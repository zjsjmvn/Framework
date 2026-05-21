import type { Node, Rect, Vec2 } from 'cc';

/** 引导步骤类型。每一种类型都由 GuideRunner 绑定不同的完成条件。 */
export enum GuideStepKind {
    /** 点击目标区域后完成。 */
    Tap = 'tap',
    /** 在目标区域内按住指定时长后完成。 */
    LongPress = 'longPress',
    /** 从 from 目标拖到 to 目标后完成。 */
    Drag = 'drag',
    /** 从第一个目标滑动到最后一个目标后完成。 */
    Move = 'move',
    /** 等待项目事件派发后完成。 */
    WaitEvent = 'waitEvent',
    /** 等待固定秒数后完成。 */
    WaitSeconds = 'waitSeconds',
    /** 交给业务自定义异步逻辑决定何时完成。 */
    Custom = 'custom',
}

/** 步骤目标找不到时的处理策略。 */
export enum GuideTargetMissPolicy {
    /** 等待目标锚点注册，直到 waitTargetTimeout。 */
    Wait = 'wait',
    /** 找不到目标时跳过当前步骤。 */
    SkipStep = 'skipStep',
    /** 找不到目标时让整条引导失败。 */
    FailGuide = 'failGuide',
}

/** 步骤完成原因，方便日志、埋点和 onComplete 分支判断。 */
export enum GuideStepCompleteReason {
    Tap = 'tap',
    LongPress = 'longPress',
    Drag = 'drag',
    Move = 'move',
    Event = 'event',
    Timer = 'timer',
    Custom = 'custom',
    Skipped = 'skipped',
}

/** 目标镂空区域的额外边距，单位是 UI 坐标。 */
export interface GuidePadding {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

/** 流程级步骤默认配置。步骤自身字段优先，未配置时才继承这里的默认值。 */
export interface GuideStepDefaults {
    /** 当前步骤显示的引导文案。 */
    text?: string;
    /** 步骤完成后短暂显示的文案。 */
    completeText?: string;
    /** 是否显示遮罩；事件和计时步骤通常不需要遮罩。 */
    showMask?: boolean;
    /** 是否显示默认手指动画。 */
    showFinger?: boolean;
    /** 当前步骤是否把命中的触摸透传给下方真实节点。 */
    passThrough?: boolean;
    /** 是否强制拦截所有触摸。 */
    blockOthers?: boolean;
    /** 点击步骤需要命中几次才完成。 */
    requiredTouchCount?: number;
    /** 步骤开始前等待秒数。 */
    beforeDelay?: number;
    /** 步骤完成后等待秒数，兼容旧命名。 */
    afterDelay?: number;
    /** 步骤完成后等待秒数，优先级高于 afterDelay。 */
    finishDelay?: number;
    /** 步骤最大等待秒数，超时会失败。 */
    timeout?: number;
    /** targetMissPolicy=Wait 时等待目标出现的秒数。 */
    waitTargetTimeout?: number;
    /** 目标缺失策略。 */
    targetMissPolicy?: GuideTargetMissPolicy | string;
    /** 覆盖锚点自己的 padding，用于某一步临时放大或缩小镂空区域。 */
    maskPadding?: GuidePadding;
    /** 固定文案位置；不填时默认围绕第一个目标自动摆放。 */
    textPosition?: Vec2;
    /** 手指动画相对目标中心的偏移。 */
    fingerOffset?: Vec2;
}

/** 默认遮罩的流程级默认配置，只会应用到 GuideDefaultOverlay。 */
export interface GuideOverlayDefaults {
    /** 遮罩不透明度，0 完全透明，255 完全不透明。 */
    maskOpacity?: number;
    /** 目标高亮圆角半径。 */
    holeRadius?: number;
    /** 多目标手指动画移动速度，单位是 UI 坐标每秒。 */
    fingerMoveSpeed?: number;
    /** 默认手指图片路径，格式为 bundle/path/to/sprite/spriteFrame。 */
    fingerSpritePath?: string;
}

/** 目标在某个步骤开始时的快照。 */
export interface GuideAnchorSnapshot {
    /** 目标业务 id。 */
    guideId: string;
    /** 快照对应的真实节点。 */
    node: Node;
    /** 目标节点矩形转换到遮罩节点本地坐标后的结果，用于绘制和命中判断。 */
    rectInOverlay: Rect;
    /** 目标节点的世界坐标矩形，保留给自定义遮罩或调试使用。 */
    worldRect: Rect;
    /** 命中该目标区域时，默认是否把触摸传给下方真实节点。 */
    passThrough: boolean;
    /** 本次快照实际使用的 padding。 */
    padding: Required<GuidePadding>;
}

/** 传给步骤回调的运行上下文。 */
export interface GuideStepContext {
    /** 当前引导流程配置。 */
    flow: GuideFlowConfig;
    /** 当前步骤配置。 */
    step: GuideStepConfig;
    /** 当前步骤下标。 */
    stepIndex: number;
    /** 遮罩层节点。 */
    guideNode: Node;
    /** 当前遮罩实现。 */
    overlay: IGuideOverlay;
    /** 当前运行器，可用来主动完成、跳过或停止步骤。 */
    manager: IGuideRuntime;
}

/** 所有步骤共享的基础配置。 */
export interface GuideStepBaseConfig {
    /** 稳定步骤 id，用于日志、调试和排错。 */
    id?: string;
    /** 步骤类型。字符串写法用于兼容 Inspector 配置。 */
    kind: GuideStepKind | string;
    /** 当前步骤显示的引导文案。 */
    text?: string;
    /** 步骤完成后短暂显示的文案。 */
    completeText?: string;
    /** 单目标步骤使用的 guideId。 */
    target?: string;
    /** 多目标步骤使用的 guideId 列表。 */
    targets?: string[];
    /** 是否显示遮罩；事件和计时步骤通常不需要遮罩。 */
    showMask?: boolean;
    /** 是否显示默认手指动画。 */
    showFinger?: boolean;
    /** 当前步骤是否把命中的触摸透传给下方真实节点；会覆盖锚点默认值。 */
    passThrough?: boolean;
    /** 是否强制拦截所有触摸。 */
    blockOthers?: boolean;
    /** 点击步骤需要命中几次才完成。 */
    requiredTouchCount?: number;
    /** 步骤开始前等待秒数。 */
    beforeDelay?: number;
    /** 步骤完成后等待秒数，兼容旧命名。 */
    afterDelay?: number;
    /** 步骤完成后等待秒数，优先级高于 afterDelay。 */
    finishDelay?: number;
    /** 步骤最大等待秒数，超时会失败。 */
    timeout?: number;
    /** targetMissPolicy=Wait 时等待目标出现的秒数。 */
    waitTargetTimeout?: number;
    /** 目标缺失策略。代码配置默认失败，Inspector 配置默认等待。 */
    targetMissPolicy?: GuideTargetMissPolicy | string;
    /** 覆盖锚点自己的 padding，用于某一步临时放大或缩小镂空区域。 */
    maskPadding?: GuidePadding;
    /** 固定文案位置；不填时默认围绕第一个目标自动摆放。 */
    textPosition?: Vec2;
    /** 手指动画相对目标中心的偏移。 */
    fingerOffset?: Vec2;
    /** 调试名；没有 id 时用于日志。 */
    debugName?: string;
    /** 返回 false 时跳过当前步骤。 */
    canStart?: (context: GuideStepContext) => boolean | Promise<boolean>;
    /** 遮罩显示前执行，适合打开 UI 或准备业务状态。 */
    onEnter?: (context: GuideStepContext) => void | Promise<void>;
    /** 步骤完成后执行，reason 表示完成来源。 */
    onComplete?: (context: GuideStepContext, reason: GuideStepCompleteReason) => void | Promise<void>;
    /** 预留失败回调字段；当前失败由 runner 抛出给 GuideService.onError。 */
    onFail?: (context: GuideStepContext, error: Error) => void | Promise<void>;
    /** 步骤完成后做业务校验，返回 false 会让流程失败。 */
    verify?: (context: GuideStepContext) => boolean | Promise<boolean>;
}

/** 点击步骤配置。 */
export interface GuideTapStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.Tap | 'tap';
    /** 要点击的目标 guideId。 */
    target: string;
}

/** 长按步骤配置。 */
export interface GuideLongPressStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.LongPress | 'longPress';
    /** 要长按的目标 guideId。 */
    target: string;
    /** 长按持续秒数，默认 0.8。 */
    duration?: number;
}

/** 拖拽步骤配置。 */
export interface GuideDragStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.Drag | 'drag';
    /** 拖拽起点 guideId。 */
    from: string;
    /** 拖拽终点 guideId。 */
    to: string;
    /** 最小拖拽距离。 */
    minDistance?: number;
}

/** 滑动步骤配置。 */
export interface GuideMoveStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.Move | 'move';
    /** 滑动路径上的目标 guideId 列表。当前完成判断使用第一个和最后一个。 */
    targets: string[];
    /** 预留字段：是否往返滑动。当前默认遮罩尚未实现往返判断。 */
    backAndForth?: boolean;
    /** 最小滑动距离。 */
    minDistance?: number;
}

/** 等待事件步骤配置。 */
export interface GuideWaitEventStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.WaitEvent | 'waitEvent';
    /** EventManager 事件名。 */
    eventName: string;
    /** 返回 true 时才完成步骤。 */
    eventFilter?: (data: any, context: GuideStepContext) => boolean;
}

/** 等待固定时间步骤配置。 */
export interface GuideWaitSecondsStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.WaitSeconds | 'waitSeconds';
    /** 等待秒数。 */
    seconds: number;
}

/** 自定义步骤配置。 */
export interface GuideCustomStepConfig extends GuideStepBaseConfig {
    kind: GuideStepKind.Custom | 'custom';
    /** 业务自己执行异步逻辑，并在合适时机调用 finish 或 fail。 */
    run: (context: GuideStepContext, finish: (reason?: GuideStepCompleteReason) => void, fail: (error: Error) => void) => void | Promise<void>;
}

/** 任意一种步骤配置。 */
export type GuideStepConfig =
    GuideTapStepConfig |
    GuideLongPressStepConfig |
    GuideDragStepConfig |
    GuideMoveStepConfig |
    GuideWaitEventStepConfig |
    GuideWaitSecondsStepConfig |
    GuideCustomStepConfig;

/** 一整条引导流程配置。 */
export interface GuideFlowConfig {
    /** 引导流程 id，用于进度存档和日志。 */
    guideId: string;
    /** 修改步骤数量或顺序后要提升版本，避免旧进度从错误步骤继续。 */
    version?: number;
    /** 所有步骤共享的默认配置；步骤自身字段优先。 */
    stepDefaults?: GuideStepDefaults;
    /** 默认遮罩共享配置；只应用到 GuideDefaultOverlay。 */
    overlayDefaults?: GuideOverlayDefaults;
    /** 按顺序执行的步骤列表。 */
    steps: GuideStepConfig[];
    /** 忽略已有进度，强制从第一步开始。 */
    restartFromBeginning?: boolean;
    /** 是否自动保存每一步进度，默认 true。 */
    autoSaveProgress?: boolean;
    /** 是否输出步骤完成日志。 */
    debug?: boolean;
}

/** 启动引导时的运行时选项。 */
export interface GuideStartOptions {
    /** 默认遮罩或 prefab 遮罩要挂到哪个父节点下；不传时查找场景 Canvas。 */
    parent?: Node;
    /** resources 下的遮罩 prefab 路径。 */
    overlayPrefabPath?: string;
    /** 外部传入的自定义遮罩实例。 */
    overlay?: IGuideOverlay;
    /** 自定义进度存储，测试或服务端存档可替换。 */
    storage?: IGuideStorage;
    /** 自定义锚点注册表，测试或隔离多套引导时可替换。 */
    anchorRegistry?: IGuideAnchorRegistry;
    /** 自定义事件总线，默认使用项目 EventManager。 */
    eventBus?: IGuideEventBus;
    /** 遮罩节点插入到父节点后的 siblingIndex。 */
    childIndex?: number;
    /** 完成或停止后是否销毁遮罩节点，默认 true。 */
    destroyOverlayOnComplete?: boolean;
    /** 全部步骤完成回调。 */
    onComplete?: () => void;
    /** 主动停止回调。 */
    onStop?: (reason?: string) => void;
    /** 运行失败回调。 */
    onError?: (error: Error) => void;
}

/** 本地存储中的引导进度结构。 */
export interface GuideProgressData {
    /** 引导流程 id。 */
    guideId: string;
    /** 引导流程版本。 */
    version: number;
    /** 最后完成的步骤下标。 */
    completedStepIndex: number;
    /** 整条流程是否完成。 */
    completed: boolean;
    /** 更新时间戳。 */
    updatedAt: number;
}

/** 进度存储接口。 */
export interface IGuideStorage {
    loadProgress(guideId: string, version: number): GuideProgressData | null;
    saveProgress(progress: GuideProgressData): void;
    clearProgress(guideId: string, version?: number): void;
}

/** 锚点注册和等待接口。 */
export interface IGuideAnchorRegistry {
    register(anchor: IGuideAnchor): void;
    unregister(anchor: IGuideAnchor): void;
    resolve(guideId: string): IGuideAnchor | null;
    waitFor(guideId: string, timeoutSeconds?: number): Promise<IGuideAnchor | null>;
    getAllGuideIds(): string[];
}

/** 引导目标锚点接口。 */
export interface IGuideAnchor {
    /** 稳定业务 id。 */
    guideId: string;
    /** 锚点所在真实节点。 */
    node: Node;
    /** 命中目标区域时是否默认透传。 */
    passThrough: boolean;
    /** 默认镂空 padding。 */
    padding: Required<GuidePadding>;
    /** 当前节点是否可以作为引导目标。 */
    isAvailable(): boolean;
    /** 创建目标在遮罩坐标系下的快照。 */
    getSnapshot(overlayNode: Node, overridePadding?: GuidePadding): GuideAnchorSnapshot | null;
}

/** 遮罩层接口，允许替换默认 GuideDefaultOverlay。 */
export interface IGuideOverlay {
    /** 遮罩根节点。 */
    node: Node;
    /** 预备当前步骤视觉状态。 */
    prepare(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void;
    /** 显示当前步骤。 */
    showStep(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void;
    /** 显示步骤完成文案。 */
    showCompleteText(step: GuideStepConfig): void;
    /** 清理当前步骤视觉和触摸状态。 */
    clearStep(): void;
    /** 释放遮罩资源。 */
    dispose(): void;
    /** 设置当前步骤触摸处理器；传 null 表示不处理触摸。 */
    setTouchHandler(handler: IGuideTouchHandler | null): void;
}

/** 遮罩触摸处理器。返回 true 表示遮罩吞掉触摸，false 表示放行。 */
export interface IGuideTouchHandler {
    onTouchStart?(event: any): boolean;
    onTouchMove?(event: any): boolean;
    onTouchEnd?(event: any): boolean;
    onTouchCancel?(event: any): boolean;
}

/** 引导事件总线接口。 */
export interface IGuideEventBus {
    on(eventName: string, callback: (data?: any) => void, target?: any): any;
    off(eventName: string, callback: (data?: any) => void, target?: any): void;
    emit?(eventName: string, data?: any): void;
}

/** 运行时控制接口，暴露给步骤回调使用。 */
export interface IGuideRuntime {
    readonly isRunning: boolean;
    readonly currentStepIndex: number;
    /** 主动完成当前步骤。 */
    completeCurrentStep(reason?: GuideStepCompleteReason): void;
    /** 主动让当前步骤失败。 */
    failCurrentStep(error: Error): void;
    /** 停止整条引导。 */
    stop(reason?: string): void;
    /** 跳过当前步骤。 */
    skipCurrentStep(): void;
    /** 通过当前事件总线派发事件。 */
    emit(eventName: string, data?: any): void;
}

/** 把可选 padding 规格化成完整四边数值，避免后续计算反复判空。 */
export function normalizePadding(padding?: GuidePadding): Required<GuidePadding> {
    return {
        left: padding?.left || 0,
        right: padding?.right || 0,
        top: padding?.top || 0,
        bottom: padding?.bottom || 0,
    };
}
