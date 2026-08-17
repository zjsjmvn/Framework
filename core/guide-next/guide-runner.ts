import { EventTouch, isValid, Node, UITransform, v2, v3, Vec2 } from 'cc';
import {
    GuideAnchorSnapshot,
    GuideFlowConfig,
    GuideProgressData,
    GuideStartOptions,
    GuideStepCompleteReason,
    GuideStepConfig,
    GuideStepContext,
    GuideStepKind,
    GuideTargetMissPolicy,
    IGuideAnchor,
    IGuideAnchorRegistry,
    IGuideEventBus,
    IGuideOverlay,
    IGuideRuntime,
    IGuideStorage,
} from './guide-types';
import { GuideAnchorRegistry } from './guide-anchor-registry';
import { GuideLocalStorage } from './guide-storage';
import { GuideEventBus } from './guide-event-bus';
import { normalizeGuideFlowConfig } from './guide-flow-utils';

/** 当前步骤等待状态。步骤可能由触摸、事件、定时器或自定义逻辑完成，统一放在这里清理。 */
interface StepWaiter {
    /** 完成当前步骤。 */
    resolve: (reason: GuideStepCompleteReason) => void;
    /** 让当前步骤失败。 */
    reject: (error: Error) => void;
    /** 步骤期间创建的定时器，步骤结束时统一清除。 */
    timers: any[];
    /** 步骤期间注册的事件、长按计时器等清理函数。 */
    cleanups: Array<() => void>;
    /** 防止重复完成或重复失败。 */
    completed: boolean;
}

/** 引导流程运行器：负责步骤推进、目标解析、输入判断、事件等待和进度保存。 */
export class GuideRunner implements IGuideRuntime {
    /** 当前运行的流程配置。 */
    public readonly flow: GuideFlowConfig;
    /** 当前使用的遮罩实现。 */
    public readonly overlay: IGuideOverlay;
    /** 当前使用的进度存储。 */
    public readonly storage: IGuideStorage;
    /** 当前使用的锚点注册表。 */
    public readonly anchorRegistry: IGuideAnchorRegistry;
    /** 当前使用的事件总线。 */
    public readonly eventBus: IGuideEventBus;
    /** 启动参数。 */
    public readonly options: GuideStartOptions;

    /** 是否正在运行。 */
    public isRunning: boolean = false;
    /** 当前步骤下标；未运行时为 -1。 */
    public currentStepIndex: number = -1;

    /** 当前步骤的等待器；没有等待中的步骤时为 null。 */
    private currentWaiter: StepWaiter | null = null;
    /** 是否已经被 stop 主动停止。 */
    private stopped: boolean = false;
    /** stop 时传入的原因，最终会交给 onStop。 */
    private stopReason: string = '';
    /** 流程结束后是否销毁遮罩节点。 */
    private destroyOverlayOnComplete: boolean = true;

    constructor(flow: GuideFlowConfig, overlay: IGuideOverlay, options: GuideStartOptions = {}) {
        this.flow = normalizeGuideFlowConfig(flow);
        this.overlay = overlay;
        this.options = options;
        this.storage = options.storage || new GuideLocalStorage();
        this.anchorRegistry = options.anchorRegistry || GuideAnchorRegistry.instance;
        this.eventBus = options.eventBus || new GuideEventBus();
        this.destroyOverlayOnComplete = options.destroyOverlayOnComplete !== false;
    }

    /** 启动流程，并按进度从正确步骤继续执行。 */
    public async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.stopped = false;
        this.stopReason = '';

        const version = this.flow.version || 1;
        const autoSave = this.flow.autoSaveProgress !== false;
        const progress = this.flow.restartFromBeginning ? null : this.storage.loadProgress(this.flow.guideId, version);
        // 进度记录的是“最后完成的步骤”，恢复时从下一个步骤开始。
        let startIndex = progress && !progress.completed ? progress.completedStepIndex + 1 : 0;
        this.trace(`start guide, version=${version}, startStep=${startIndex}, completed=${!!progress?.completed}`);

        if (progress?.completed && !this.flow.restartFromBeginning) {
            this.trace('skip guide because progress is already completed');
            this.finishGuide();
            return;
        }

        while (this.isRunning && !this.stopped && startIndex < this.flow.steps.length) {
            this.currentStepIndex = startIndex;
            const step = this.flow.steps[startIndex];
            this.trace(`step start: ${this.getStepName(step, startIndex)}`);

            try {
                const reason = await this.runStep(step, startIndex);
                if (autoSave) {
                    this.saveProgress(startIndex, false);
                }
                this.trace(`step completed: ${this.getStepName(step, startIndex)}, reason=${reason}`);
            } catch (error) {
                console.error(`[GuideNext] step failed: ${this.getStepName(step, startIndex)}`, error);
                // 失败也必须清理遮罩：否则超时/verify 失败后蒙层和引导文本会永久残留在界面上，甚至挡住玩法输入。
                // 不走 onStop/onComplete，失败语义仍由 reject -> GuideService onError 承担。
                this.isRunning = false;
                this.currentStepIndex = -1;
                this.overlay.clearStep();
                if (this.destroyOverlayOnComplete) {
                    this.overlay.dispose();
                }
                throw error;
            }

            startIndex++;
        }

        if (autoSave && !this.stopped) {
            this.saveProgress(this.flow.steps.length - 1, true);
        }

        this.finishGuide();
    }

    /** 外部或步骤内部主动完成当前步骤。 */
    public completeCurrentStep(reason: GuideStepCompleteReason = GuideStepCompleteReason.Custom): void {
        if (!this.currentWaiter || this.currentWaiter.completed) {
            return;
        }
        this.currentWaiter.completed = true;
        this.currentWaiter.resolve(reason);
    }

    /** 外部或步骤内部主动让当前步骤失败。 */
    public failCurrentStep(error: Error): void {
        if (!this.currentWaiter || this.currentWaiter.completed) {
            return;
        }
        this.currentWaiter.completed = true;
        this.currentWaiter.reject(error);
    }

    /** 停止整条引导，并按跳过原因结束当前等待中的步骤。 */
    public stop(reason: string = 'stopped'): void {
        this.trace(`stop guide, reason=${reason}`);
        this.stopped = true;
        this.stopReason = reason;
        this.isRunning = false;
        this.completeCurrentStep(GuideStepCompleteReason.Skipped);
        this.overlay.clearStep();
    }

    /** 跳过当前步骤，流程会继续执行后续步骤。 */
    public skipCurrentStep(): void {
        this.completeCurrentStep(GuideStepCompleteReason.Skipped);
    }

    /** 通过引导事件总线派发事件，常用于完成 waitEvent 步骤。 */
    public emit(eventName: string, data?: any): void {
        this.eventBus.emit?.(eventName, data);
    }

    /** 执行单个步骤的完整生命周期。 */
    private async runStep(step: GuideStepConfig, stepIndex: number): Promise<GuideStepCompleteReason> {
        const snapshots = await this.resolveStepSnapshots(step);
        if (snapshots === null) {
            return GuideStepCompleteReason.Skipped;
        }

        const context = this.createContext(step, stepIndex);
        if (step.canStart && await step.canStart(context) === false) {
            this.trace(`step skipped by canStart: ${this.getStepName(step, stepIndex)}`);
            return GuideStepCompleteReason.Skipped;
        }

        if (step.beforeDelay) {
            await this.delay(step.beforeDelay);
        }

        await step.onEnter?.(context);
        this.overlay.showStep(step, snapshots);

        const reason = await this.waitForStepCompletion(step, stepIndex, snapshots);
        if (step.verify && await step.verify(context) === false) {
            throw new Error(`Guide step verify failed: ${this.getStepName(step, stepIndex)}`);
        }

        this.overlay.showCompleteText(step);
        await step.onComplete?.(context, reason);

        const waitAfterComplete = step.finishDelay || step.afterDelay || 0;
        if (waitAfterComplete > 0) {
            await this.delay(waitAfterComplete);
        }

        this.overlay.clearStep();
        return reason;
    }

    /** 把步骤中声明的 guideId 解析成遮罩坐标系下的目标快照。 */
    private async resolveStepSnapshots(step: GuideStepConfig): Promise<GuideAnchorSnapshot[] | null> {
        const targetIds = this.getTargetIds(step);
        if (targetIds.length === 0) {
            return [];
        }

        // 先解析完所有目标再绘制，拖拽和滑动步骤才能拿到同一时刻的矩形快照。
        const anchors: IGuideAnchor[] = [];
        for (const guideId of targetIds) {
            const anchor = await this.resolveAnchor(guideId, step);
            if (!anchor) {
                const policy = step.targetMissPolicy || GuideTargetMissPolicy.FailGuide;
                if (policy === GuideTargetMissPolicy.SkipStep) {
                    console.warn(`[GuideNext] skip step because target missing: flow=${this.flow.guideId}, target=${guideId}`);
                    return null;
                }
                throw new Error(`Guide target missing: ${guideId}, flow=${this.flow.guideId}`);
            }
            anchors.push(anchor);
        }

        const snapshots = anchors
            .map((anchor) => anchor.getSnapshot(this.overlay.node, step.maskPadding))
            .filter((snapshot) => !!snapshot) as GuideAnchorSnapshot[];

        if (snapshots.length !== anchors.length) {
            const missing = targetIds.filter((_, index) => !snapshots[index]).join(', ');
            throw new Error(`Guide target snapshot failed: ${missing}`);
        }

        return snapshots;
    }

    /** 根据缺失策略查找或等待单个目标锚点。 */
    private async resolveAnchor(guideId: string, step: GuideStepConfig): Promise<IGuideAnchor | null> {
        const anchor = this.anchorRegistry.resolve(guideId);
        if (anchor) {
            return anchor;
        }

        const policy = step.targetMissPolicy || GuideTargetMissPolicy.FailGuide;
        if (policy !== GuideTargetMissPolicy.Wait) {
            return null;
        }

        this.trace(`wait target: ${guideId}, timeout=${step.waitTargetTimeout || 5}`);
        return this.anchorRegistry.waitFor(guideId, step.waitTargetTimeout || 5);
    }

    /** 根据步骤类型安装对应等待逻辑，并返回步骤完成原因。 */
    private waitForStepCompletion(step: GuideStepConfig, stepIndex: number, snapshots: GuideAnchorSnapshot[]): Promise<GuideStepCompleteReason> {
        return new Promise((resolve, reject) => {
            const waiter: StepWaiter = {
                resolve,
                reject,
                timers: [],
                cleanups: [],
                completed: false,
            };
            this.currentWaiter = waiter;

            // 所有完成路径都经过这两个包装函数，确保定时器、事件和触摸处理只清理一次。
            const cleanupAndResolve = (reason: GuideStepCompleteReason) => {
                this.cleanupWaiter(waiter);
                resolve(reason);
            };
            const cleanupAndReject = (error: Error) => {
                this.cleanupWaiter(waiter);
                reject(error);
            };
            waiter.resolve = cleanupAndResolve;
            waiter.reject = cleanupAndReject;

            if (step.timeout && step.timeout > 0) {
                waiter.timers.push(setTimeout(() => {
                    this.failCurrentStep(new Error(`Guide step timeout: ${this.getStepName(step, stepIndex)}`));
                }, step.timeout * 1000));
            }

            switch (step.kind) {
                case GuideStepKind.Tap:
                case 'tap':
                    this.bindTapStep(step, snapshots);
                    break;
                case GuideStepKind.LongPress:
                case 'longPress':
                    this.bindLongPressStep(step, snapshots, waiter);
                    break;
                case GuideStepKind.Drag:
                case 'drag':
                    this.bindDragStep(step, snapshots);
                    break;
                case GuideStepKind.Move:
                case 'move':
                    this.bindMoveStep(step, snapshots);
                    break;
                case GuideStepKind.WaitEvent:
                case 'waitEvent':
                    this.bindWaitEventStep(step, stepIndex, waiter);
                    break;
                case GuideStepKind.WaitSeconds:
                case 'waitSeconds':
                    this.bindWaitSecondsStep(step, waiter);
                    break;
                case GuideStepKind.Custom:
                case 'custom':
                    this.bindCustomStep(step, stepIndex);
                    break;
                default:
                    this.failCurrentStep(new Error(`Unknown guide step kind: ${(step as any).kind}`));
                    break;
            }
        });
    }

    /** 点击步骤：触摸结束点命中目标区域后计数，达到 requiredTouchCount 即完成。 */
    private bindTapStep(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        let touchCount = 0;
        const requiredTouchCount = step.requiredTouchCount || 1;

        this.overlay.setTouchHandler({
            onTouchStart: (event: EventTouch) => this.shouldSwallowTouch(step, snapshots, this.getTouchPoint(event)),
            onTouchEnd: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                if (!this.containsAny(snapshots, point)) {
                    return this.shouldSwallowTouch(step, snapshots, point);
                }

                touchCount++;
                if (touchCount >= requiredTouchCount) {
                    const shouldSwallow = this.shouldSwallowTouch(step, snapshots, point);
                    if (shouldSwallow) {
                        this.completeCurrentStep(GuideStepCompleteReason.Tap);
                    } else {
                        // 透传点击要先交给下层真实按钮处理，同步清理遮罩可能打断本次事件链。
                        setTimeout(() => this.completeCurrentStep(GuideStepCompleteReason.Tap), 0);
                    }
                }
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchCancel: () => true,
        });
    }

    /** 长按步骤：按下点命中目标并持续 duration 秒后完成，移出或松手会取消计时。 */
    private bindLongPressStep(step: any, snapshots: GuideAnchorSnapshot[], waiter: StepWaiter): void {
        let timer: any = null;
        const duration = step.duration || 0.8;

        const clearPressTimer = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };
        waiter.cleanups.push(clearPressTimer);

        this.overlay.setTouchHandler({
            onTouchStart: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                if (this.containsAny(snapshots, point)) {
                    clearPressTimer();
                    timer = setTimeout(() => {
                        this.completeCurrentStep(GuideStepCompleteReason.LongPress);
                    }, duration * 1000);
                }
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchMove: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                if (!this.containsAny(snapshots, point)) {
                    clearPressTimer();
                }
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchEnd: (event: EventTouch) => {
                clearPressTimer();
                return this.shouldSwallowTouch(step, snapshots, this.getTouchPoint(event));
            },
            onTouchCancel: () => {
                clearPressTimer();
                return true;
            },
        });
    }

    /** 拖拽步骤：从第一个目标按下，松手时落在第二个目标内，并满足最小距离后完成。 */
    private bindDragStep(step: any, snapshots: GuideAnchorSnapshot[]): void {
        const from = snapshots[0];
        const to = snapshots[1];
        let startedInside = false;

        this.overlay.setTouchHandler({
            onTouchStart: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                startedInside = from?.rectInOverlay.contains(point);
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchEnd: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                const startPoint = this.getTouchStartPoint(event);
                const distance = Vec2.distance(startPoint, point);
                const minDistance = step.minDistance || 0;
                if (startedInside && to?.rectInOverlay.contains(point) && distance >= minDistance) {
                    this.completeCurrentStep(GuideStepCompleteReason.Drag);
                }
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchCancel: () => {
                startedInside = false;
                return true;
            },
        });
    }

    /** 滑动步骤：从第一个目标开始，移动到最后一个目标并满足最小距离后完成。 */
    private bindMoveStep(step: any, snapshots: GuideAnchorSnapshot[]): void {
        let firstHit = false;
        const last = snapshots[snapshots.length - 1];

        this.overlay.setTouchHandler({
            onTouchStart: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                firstHit = snapshots[0]?.rectInOverlay.contains(point);
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchMove: (event: EventTouch) => {
                const point = this.getTouchPoint(event);
                const startPoint = this.getTouchStartPoint(event);
                const minDistance = step.minDistance || 0;
                if (firstHit && last?.rectInOverlay.contains(point) && Vec2.distance(startPoint, point) >= minDistance) {
                    this.completeCurrentStep(GuideStepCompleteReason.Move);
                }
                return this.shouldSwallowTouch(step, snapshots, point);
            },
            onTouchEnd: (event: EventTouch) => this.shouldSwallowTouch(step, snapshots, this.getTouchPoint(event)),
            onTouchCancel: () => {
                firstHit = false;
                return true;
            },
        });
    }

    /** 等事件步骤：监听 eventName，eventFilter 通过后完成。 */
    private bindWaitEventStep(step: any, stepIndex: number, waiter: StepWaiter): void {
        const callback = (data?: any) => {
            const context = this.createContext(step, stepIndex);
            if (!step.eventFilter || step.eventFilter(data, context)) {
                this.completeCurrentStep(GuideStepCompleteReason.Event);
            }
        };

        // 事件步骤通过 GuideEventBus 复用项目 EventManager，业务代码不用依赖 runner 实例。
        this.eventBus.on(step.eventName, callback, this);
        waiter.cleanups.push(() => this.eventBus.off(step.eventName, callback, this));
    }

    /** 等待秒数步骤：到时间后自动完成。 */
    private bindWaitSecondsStep(step: any, waiter: StepWaiter): void {
        waiter.timers.push(setTimeout(() => {
            this.completeCurrentStep(GuideStepCompleteReason.Timer);
        }, Math.max(0, step.seconds || 0) * 1000));
    }

    /** 自定义步骤：把完成和失败控制权交给业务传入的 run 函数。 */
    private bindCustomStep(step: any, stepIndex: number): void {
        const context = this.createContext(step, stepIndex);
        Promise.resolve(step.run(
            context,
            (reason = GuideStepCompleteReason.Custom) => this.completeCurrentStep(reason),
            (error: Error) => this.failCurrentStep(error)
        )).catch((error) => this.failCurrentStep(error));
    }

    /** 清理当前步骤创建的所有一次性资源。 */
    private cleanupWaiter(waiter: StepWaiter): void {
        waiter.timers.forEach((timer) => clearTimeout(timer));
        waiter.cleanups.forEach((cleanup) => cleanup());
        waiter.timers.length = 0;
        waiter.cleanups.length = 0;
        this.overlay.setTouchHandler(null);
        if (this.currentWaiter === waiter) {
            this.currentWaiter = null;
        }
    }

    /** 创建回调上下文，让业务代码能拿到流程、步骤、遮罩和运行器。 */
    private createContext(step: GuideStepConfig, stepIndex: number): GuideStepContext {
        return {
            flow: this.flow,
            step,
            stepIndex,
            guideNode: this.overlay.node,
            overlay: this.overlay,
            manager: this,
        };
    }

    /** 从不同步骤类型中提取需要解析的目标 guideId。 */
    private getTargetIds(step: any): string[] {
        if (step.kind === GuideStepKind.Drag || step.kind === 'drag') {
            return [step.from, step.to].filter((id) => !!id);
        }

        if (step.kind === GuideStepKind.Move || step.kind === 'move') {
            return (step.targets || []).filter((id) => !!id);
        }

        if (step.targets && step.targets.length > 0) {
            return step.targets;
        }

        if (step.target) {
            return [step.target];
        }

        return [];
    }

    /** 判断点是否命中任意目标快照。 */
    private containsAny(snapshots: GuideAnchorSnapshot[], point: Vec2): boolean {
        return snapshots.some((snapshot) => snapshot.rectInOverlay.contains(point));
    }

    /** 判断当前触摸是否应该被遮罩吞掉。 */
    private shouldSwallowTouch(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[], point: Vec2): boolean {
        if (step.blockOthers === true) {
            return true;
        }

        const matched = snapshots.find((snapshot) => snapshot.rectInOverlay.contains(point));
        if (!matched) {
            // 目标区域外默认由遮罩拦截，只有步骤显式 passThrough 时才放行。
            return step.passThrough === true ? false : true;
        }

        if (step.passThrough !== undefined) {
            // 步骤级 passThrough 优先级高于锚点默认值，用于处理特殊步骤。
            return !step.passThrough;
        }

        return !matched.passThrough;
    }

    /** 把触摸当前位置从屏幕 UI 坐标转换到遮罩本地坐标。 */
    private getTouchPoint(event: EventTouch): Vec2 {
        const uiPoint = event.getUILocation();
        return this.overlay.node.getComponent(UITransform).convertToNodeSpaceAR(v3(uiPoint.x, uiPoint.y, 0)).toVec2();
    }

    /** 把触摸起点从屏幕 UI 坐标转换到遮罩本地坐标。 */
    private getTouchStartPoint(event: EventTouch): Vec2 {
        const uiPoint = event.getUIStartLocation();
        return this.overlay.node.getComponent(UITransform).convertToNodeSpaceAR(v3(uiPoint.x, uiPoint.y, 0)).toVec2();
    }

    /** 保存当前步骤进度。 */
    private saveProgress(stepIndex: number, completed: boolean): void {
        const progress: GuideProgressData = {
            guideId: this.flow.guideId,
            version: this.flow.version || 1,
            completedStepIndex: stepIndex,
            completed,
            updatedAt: Date.now(),
        };
        this.storage.saveProgress(progress);
    }

    /** 结束流程，清理遮罩并触发完成或停止回调。 */
    private finishGuide(): void {
        this.isRunning = false;
        this.currentStepIndex = -1;
        this.overlay.clearStep();
        if (this.destroyOverlayOnComplete) {
            this.overlay.dispose();
        }
        if (this.stopped) {
            this.options.onStop?.(this.stopReason);
        } else {
            this.options.onComplete?.();
        }
    }

    /** 生成日志里使用的步骤名。 */
    private getStepName(step: GuideStepConfig, index: number): string {
        return step.id || step.debugName || `${this.flow.guideId}[${index}]`;
    }

    /** flow.debug=true 时输出生命周期日志，方便排查启动和步骤推进。 */
    private trace(message: string): void {
        if (!this.flow.debug) {
            return;
        }

        console.log(`[GuideNext] ${this.flow.guideId}: ${message}`);
    }

    /** 秒级延迟工具。 */
    private delay(seconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
}
