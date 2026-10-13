import { isValid } from 'cc';
import { IGuideAnchor, IGuideAnchorRegistry, IGuideWaitCancellation } from './guide-types';

/** 等待某个 guideId 注册的挂起请求。 */
interface Waiter {
    /** 等待的目标 id。 */
    guideId: string;
    /** 找到目标或超时时 resolve。 */
    resolve: (anchor: IGuideAnchor | null) => void;
    /** 超时定时器。 */
    timer: any;
    /** 解除本次等待的取消监听。 */
    cancelCleanup: (() => void) | null;
    /** 防止取消、目标出现与超时重复收尾。 */
    completed: boolean;
}

/** 全局锚点注册表。目标节点通过 GuideAnchor 生命周期注册，步骤通过 guideId 查询。 */
export class GuideAnchorRegistry implements IGuideAnchorRegistry {
    /** 默认全局注册表。 */
    public static readonly instance = new GuideAnchorRegistry();

    /** guideId 到锚点列表。允许重复注册，但运行时只会使用第一个可用锚点。 */
    private readonly anchors: Map<string, IGuideAnchor[]> = new Map();
    /** 正在等待目标出现的步骤。 */
    private readonly waiters: Waiter[] = [];

    /** 注册一个锚点，并唤醒等待同 guideId 的步骤。 */
    public register(anchor: IGuideAnchor): void {
        if (!anchor || !anchor.guideId) {
            console.warn('[GuideNext] register anchor failed: guideId is empty.');
            return;
        }

        let list = this.anchors.get(anchor.guideId);
        if (!list) {
            list = [];
            this.anchors.set(anchor.guideId, list);
        }

        if (list.indexOf(anchor) < 0) {
            list.push(anchor);
        }

        const available = this.resolve(anchor.guideId);
        if (available) {
            this.resolveWaiters(anchor.guideId, available);
        }

        if (list.length > 1) {
            console.warn(`[GuideNext] duplicate guideId "${anchor.guideId}" registered. The first active anchor will be used.`);
        }
    }

    /** 注销一个锚点。组件 disable 或 destroy 时会调用。 */
    public unregister(anchor: IGuideAnchor): void {
        if (!anchor || !anchor.guideId) {
            return;
        }

        const list = this.anchors.get(anchor.guideId);
        if (!list) {
            return;
        }

        const index = list.indexOf(anchor);
        if (index >= 0) {
            list.splice(index, 1);
        }

        if (list.length === 0) {
            this.anchors.delete(anchor.guideId);
        }
    }

    /** 立即查找一个可用锚点。 */
    public resolve(guideId: string): IGuideAnchor | null {
        const list = this.anchors.get(guideId);
        if (!list || list.length === 0) {
            return null;
        }

        // 场景切换或对象池销毁后可能留下失效节点，查询时顺手清理。
        for (let i = list.length - 1; i >= 0; i--) {
            const anchor = list[i];
            if (!anchor || !isValid(anchor.node)) {
                list.splice(i, 1);
            }
        }

        for (const anchor of list) {
            if (anchor.isAvailable()) {
                return anchor;
            }
        }

        return null;
    }

    /** 等待某个 guideId 出现。超时或本次等待被取消时返回 null，不影响其他等待者。 */
    public waitFor(guideId: string, timeoutSeconds: number = 5, cancellation?: IGuideWaitCancellation): Promise<IGuideAnchor | null> {
        if (cancellation?.cancelled) {
            return Promise.resolve(null);
        }
        const anchor = this.resolve(guideId);
        if (anchor) {
            return Promise.resolve(anchor);
        }

        return new Promise((resolve) => {
            const waiter: Waiter = {
                guideId,
                resolve,
                timer: null,
                cancelCleanup: null,
                completed: false,
            };

            this.waiters.push(waiter);
            if (timeoutSeconds > 0) {
                waiter.timer = setTimeout(() => {
                    this.finishWaiter(waiter, null);
                }, timeoutSeconds * 1000);
            }

            const cancelCleanup = cancellation?.onCancel(() => this.finishWaiter(waiter, null));
            if (waiter.completed) {
                cancelCleanup?.();
            } else {
                waiter.cancelCleanup = cancelCleanup ?? null;
            }
        });
    }

    /** 返回当前注册过的所有 guideId，主要用于调试。 */
    public getAllGuideIds(): string[] {
        return Array.from(this.anchors.keys());
    }

    /** 清空注册表，并让所有等待者以 null 结束。 */
    public clear(): void {
        this.anchors.clear();
        while (this.waiters.length > 0) {
            this.finishWaiter(this.waiters[this.waiters.length - 1], null);
        }
    }

    /** 唤醒等待指定 guideId 的步骤。 */
    private resolveWaiters(guideId: string, anchor: IGuideAnchor): void {
        // 唤醒所有等待同一个 guideId 的步骤，并清掉各自超时定时器，避免之后重复 resolve。
        for (let i = this.waiters.length - 1; i >= 0; i--) {
            const waiter = this.waiters[i];
            if (waiter.guideId !== guideId) {
                continue;
            }

            this.finishWaiter(waiter, anchor);
        }
    }

    /** 单次等待的所有结束路径统一清理定时器、取消监听和队列项。 */
    private finishWaiter(waiter: Waiter, anchor: IGuideAnchor | null): void {
        if (waiter.completed) {
            return;
        }
        waiter.completed = true;
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) {
            this.waiters.splice(index, 1);
        }
        if (waiter.timer !== null) {
            clearTimeout(waiter.timer);
            waiter.timer = null;
        }
        waiter.cancelCleanup?.();
        waiter.cancelCleanup = null;
        waiter.resolve(anchor);
    }
}
