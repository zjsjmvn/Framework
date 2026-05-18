import { _decorator, Component, Node, Vec2 } from 'cc';
import { GuideFlowConfig, GuideStepConfig, GuideStepKind, GuideTargetMissPolicy } from './guide-types';

const { ccclass, property } = _decorator;

/** Inspector 中可编辑的单步配置。字段保持简单，运行时再转换成 GuideStepConfig。 */
@ccclass('GuideStepEditorConfig')
export class GuideStepEditorConfig {
    /** 可选步骤 id，用于日志和排错。 */
    @property({ displayName: '步骤ID', tooltip: '可选的稳定步骤 id，用于日志、调试和排错。例如 tap-main-play-button。' })
    public id: string = '';

    /** 步骤类型。 */
    @property({ displayName: '步骤类型', tooltip: '当前步骤类型。可填 tap、longPress、drag、move、waitEvent、waitSeconds。' })
    public kind: string = GuideStepKind.Tap;

    /** 点击或长按步骤的目标 guideId。 */
    @property({ displayName: '目标ID', tooltip: '点击或长按步骤使用的目标 guideId。需要和目标节点上的 GuideAnchor.guideId 一致。' })
    public target: string = '';

    /** 拖拽步骤起点 guideId。 */
    @property({ displayName: '拖拽起点ID', tooltip: 'drag 步骤的起点 guideId。玩家需要从这个目标区域开始拖拽。' })
    public from: string = '';

    /** 拖拽步骤终点 guideId。 */
    @property({ displayName: '拖拽终点ID', tooltip: 'drag 步骤的终点 guideId。玩家拖拽到这个目标区域后步骤完成。' })
    public to: string = '';

    /** 滑动步骤的多个 guideId，用英文逗号分隔。 */
    @property({ displayName: '滑动目标列表', tooltip: 'move 步骤的目标 guideId 列表，多个 id 用英文逗号分隔。例如 game.point-a,game.point-b。' })
    public targets: string = '';

    /** 引导文案。 */
    @property({ displayName: '引导文案', tooltip: '当前步骤显示给玩家的提示文字。为空时不显示文案。' })
    public text: string = '';

    /** 步骤完成后显示的文案。 */
    @property({ displayName: '完成文案', tooltip: '当前步骤完成后短暂显示的文字。为空时不额外显示完成文案。' })
    public completeText: string = '';

    /** waitEvent 步骤监听的事件名。 */
    @property({ displayName: '事件名', tooltip: 'waitEvent 步骤监听的事件名。业务通过 GuideService.getActiveRunner()?.emit 或 EventManager 派发同名事件后完成步骤。' })
    public eventName: string = '';

    /** waitSeconds 步骤等待秒数。 */
    @property({ displayName: '等待秒数', tooltip: 'waitSeconds 步骤等待的秒数。到时间后自动完成。' })
    public seconds: number = 0;

    /** longPress 步骤长按秒数。 */
    @property({ displayName: '长按秒数', tooltip: 'longPress 步骤需要玩家持续按住目标的秒数。默认 0.8 秒。' })
    public duration: number = 0.8;

    /** tap 步骤需要点击次数。 */
    @property({ displayName: '点击次数', tooltip: 'tap 步骤需要命中目标几次才完成。一般填 1。' })
    public requiredTouchCount: number = 1;

    /** 步骤开始前延迟秒数。 */
    @property({ displayName: '开始前延迟', tooltip: '进入当前步骤前等待的秒数。适合等待 UI 动画或节点布局完成。' })
    public beforeDelay: number = 0;

    /** 步骤完成后延迟秒数。 */
    @property({ displayName: '完成后延迟', tooltip: '当前步骤完成后、进入下一步前等待的秒数。适合展示完成文案或收尾动画。' })
    public afterDelay: number = 0;

    /** 步骤超时秒数。 */
    @property({ displayName: '步骤超时', tooltip: '当前步骤最大等待秒数。大于 0 时，超过时间还未完成会让引导失败；填 0 表示不限制。' })
    public timeout: number = 0;

    /** 等待目标出现的超时秒数。 */
    @property({ displayName: '等待目标超时', tooltip: '目标节点尚未注册时最多等待的秒数。Inspector 配置默认会等待目标出现。' })
    public waitTargetTimeout: number = 5;

    /** 是否显示遮罩。 */
    @property({ displayName: '显示遮罩', tooltip: '勾选后显示暗色遮罩和目标高亮。事件等待或纯计时步骤通常不需要显示遮罩。' })
    public showMask: boolean = true;

    /** 是否显示手指动画。 */
    @property({ displayName: '显示手指', tooltip: '勾选后显示默认手指动画。点击步骤会播放点击缩放，拖拽或滑动步骤会在目标之间移动。' })
    public showFinger: boolean = true;

    /** 当前步骤是否允许触摸透传。 */
    @property({ displayName: '步骤触摸透传', tooltip: '勾选后，当前步骤的触摸会透传给下方真实 UI。注意这是步骤级配置，可能让目标外触摸也透传；只想目标区域透传时优先配置 GuideAnchor。' })
    public passThrough: boolean = true;

    /** 是否拦截所有触摸。 */
    @property({ displayName: '强制拦截触摸', tooltip: '勾选后，当前步骤会拦截所有触摸，不让底下 UI 响应。适合强制玩家按引导流程操作。' })
    public blockOthers: boolean = false;
}

/** 可挂在节点上的引导流程组件，让流程能在 Cocos Inspector 中配置。 */
@ccclass('GuideFlowComponent')
export class GuideFlowComponent extends Component {
    /** 流程 id。不填时使用节点名。 */
    @property({ displayName: '流程ID', tooltip: '整条引导流程的稳定 id，用于日志和进度存档。不填时使用当前节点名。' })
    public guideId: string = '';

    /** 流程版本，步骤变更后应提升。 */
    @property({ displayName: '流程版本', tooltip: '引导流程版本。修改步骤数量、顺序或含义后要提升版本，避免旧进度从错误步骤继续。' })
    public version: number = 1;

    /** 是否忽略本地进度，从第一步开始。 */
    @property({ displayName: '重新开始', tooltip: '勾选后忽略本地已保存进度，每次都从第一步开始。适合测试引导流程。' })
    public restartFromBeginning: boolean = false;

    /** 是否自动保存进度。 */
    @property({ displayName: '自动保存进度', tooltip: '勾选后，每完成一步都会保存进度，整条流程完成后保存完成状态。正式新手引导建议开启。' })
    public autoSaveProgress: boolean = true;

    /** 是否输出调试日志。 */
    @property({ displayName: '调试日志', tooltip: '勾选后，步骤完成时会在控制台输出 GuideNext 调试日志，方便排查流程。' })
    public debug: boolean = false;

    /** Inspector 中配置的步骤列表。 */
    @property({ type: [GuideStepEditorConfig], displayName: '步骤列表', tooltip: '按顺序执行的引导步骤配置。每一项会在运行时转换成 GuideStepConfig。' })
    public steps: GuideStepEditorConfig[] = [];

    /** 把 Inspector 字段转换成运行器需要的 GuideFlowConfig。 */
    public toFlowConfig(): GuideFlowConfig {
        return {
            guideId: this.guideId || this.node.name,
            version: this.version || 1,
            restartFromBeginning: this.restartFromBeginning,
            autoSaveProgress: this.autoSaveProgress,
            debug: this.debug,
            steps: this.steps.map((step) => this.toStepConfig(step)),
        };
    }

    /** 把单个 Inspector 步骤转换成运行时步骤配置。 */
    private toStepConfig(step: GuideStepEditorConfig): GuideStepConfig {
        // Inspector 只能配置普通字段，这里集中转换成运行时使用的类型结构。
        const base: any = {
            id: step.id || undefined,
            kind: step.kind,
            text: step.text || undefined,
            completeText: step.completeText || undefined,
            requiredTouchCount: step.requiredTouchCount || 1,
            beforeDelay: step.beforeDelay || 0,
            afterDelay: step.afterDelay || 0,
            timeout: step.timeout || 0,
            waitTargetTimeout: step.waitTargetTimeout || 5,
            // Inspector 配置的流程通常依赖异步打开 UI，默认等待目标更符合编辑器使用习惯。
            targetMissPolicy: GuideTargetMissPolicy.Wait,
            showMask: step.showMask,
            showFinger: step.showFinger,
            passThrough: step.passThrough,
            blockOthers: step.blockOthers,
        };

        switch (step.kind) {
            case GuideStepKind.Drag:
            case 'drag':
                base.from = step.from;
                base.to = step.to;
                break;
            case GuideStepKind.Move:
            case 'move':
                base.targets = step.targets.split(',').map((item) => item.trim()).filter((item) => !!item);
                break;
            case GuideStepKind.WaitEvent:
            case 'waitEvent':
                base.eventName = step.eventName;
                base.showMask = false;
                base.showFinger = false;
                break;
            case GuideStepKind.WaitSeconds:
            case 'waitSeconds':
                base.seconds = step.seconds;
                base.showMask = false;
                base.showFinger = false;
                break;
            case GuideStepKind.LongPress:
            case 'longPress':
                base.target = step.target;
                base.duration = step.duration || 0.8;
                break;
            default:
                base.target = step.target;
                break;
        }

        return base as GuideStepConfig;
    }
}
