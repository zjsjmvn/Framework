import { _decorator, Component, isValid, Node, Rect, UITransform, v3 } from 'cc';
import { GuideAnchorSnapshot, GuidePadding, IGuideAnchor, normalizePadding } from './guide-types';
import { GuideAnchorRegistry } from './guide-anchor-registry';

const { ccclass, property } = _decorator;

/** 引导目标锚点。挂在需要高亮或点击的真实 UI 节点上。 */
@ccclass('GuideAnchor')
export class GuideAnchor extends Component implements IGuideAnchor {
    /** 稳定业务 id。流程步骤只引用这个 id，不引用场景路径。 */
    @property({ displayName: '引导ID', tooltip: '稳定的业务语义 id，引导步骤通过它查找目标。例如 main.play-button、game.first-box。不要填写场景层级路径。' })
    public guideId: string = '';

    /** 命中该锚点区域时，默认是否把触摸继续传给下方真实节点。 */
    @property({ displayName: '触摸透传', tooltip: '勾选后，玩家点击该引导目标时，底下真实按钮或节点也能收到触摸。适合点击按钮后既完成引导又执行业务逻辑。' })
    public passThrough: boolean = true;

    /** 镂空区域向左扩展的距离。 */
    @property({ displayName: '左侧边距', tooltip: '引导镂空区域向左额外扩展的距离。目标高亮太贴边时可适当调大。' })
    public paddingLeft: number = 0;

    /** 镂空区域向右扩展的距离。 */
    @property({ displayName: '右侧边距', tooltip: '引导镂空区域向右额外扩展的距离。目标高亮太贴边时可适当调大。' })
    public paddingRight: number = 0;

    /** 镂空区域向上扩展的距离。 */
    @property({ displayName: '上侧边距', tooltip: '引导镂空区域向上额外扩展的距离。目标高亮太贴边时可适当调大。' })
    public paddingTop: number = 0;

    /** 镂空区域向下扩展的距离。 */
    @property({ displayName: '下侧边距', tooltip: '引导镂空区域向下额外扩展的距离。目标高亮太贴边时可适当调大。' })
    public paddingBottom: number = 0;

    /** 是否要求节点处于 activeInHierarchy 才能作为目标。 */
    @property({ displayName: '要求节点激活', tooltip: '勾选后，只有 activeInHierarchy 为 true 的节点才会被当作引导目标。一般保持勾选，避免隐藏节点被误命中。' })
    public requireActiveInHierarchy: boolean = true;

    /** 把四个 Inspector 字段合并成统一 padding 对象。 */
    public get padding(): Required<GuidePadding> {
        return {
            left: this.paddingLeft,
            right: this.paddingRight,
            top: this.paddingTop,
            bottom: this.paddingBottom,
        };
    }

    /** 组件启用时把自己注册成可用目标。 */
    protected onEnable(): void {
        // 注册跟随组件生命周期，引导流程不需要知道动态 UI 或对象池节点位于哪条场景路径。
        if (this.guideId) {
            GuideAnchorRegistry.instance.register(this);
        }
    }

    /** 组件禁用时注销，避免隐藏节点继续被引导命中。 */
    protected onDisable(): void {
        GuideAnchorRegistry.instance.unregister(this);
    }

    /** 节点销毁时兜底注销。 */
    protected onDestroy(): void {
        GuideAnchorRegistry.instance.unregister(this);
    }

    /** 运行时设置 guideId，适合动态列表、对象池和生成节点。 */
    public setGuideId(guideId: string): void {
        if (this.guideId === guideId) {
            return;
        }

        // 对象池节点可能复用给不同内容，切换 guideId 前先移除旧注册。
        GuideAnchorRegistry.instance.unregister(this);
        this.guideId = guideId;

        if (this.enabled && this.node.activeInHierarchy) {
            GuideAnchorRegistry.instance.register(this);
        }
    }

    /** 判断当前锚点是否能作为引导目标。 */
    public isAvailable(): boolean {
        if (!this.guideId || !isValid(this.node)) {
            return false;
        }

        if (this.requireActiveInHierarchy && !this.node.activeInHierarchy) {
            return false;
        }

        return !!this.node.getComponent(UITransform);
    }

    /** 生成当前目标快照，并把世界矩形转换到遮罩本地坐标。 */
    public getSnapshot(overlayNode: Node, overridePadding?: GuidePadding): GuideAnchorSnapshot | null {
        if (!this.isAvailable() || !overlayNode || !isValid(overlayNode)) {
            return null;
        }

        const uiTransform = this.node.getComponent(UITransform);
        const overlayTransform = overlayNode.getComponent(UITransform);
        if (!uiTransform || !overlayTransform) {
            return null;
        }

        const worldRect = uiTransform.getBoundingBoxToWorld();
        // 步骤判断和遮罩绘制统一使用遮罩本地坐标，避免依赖目标节点的父级层级。
        const leftBottom = overlayTransform.convertToNodeSpaceAR(v3(worldRect.x, worldRect.y, 0));
        const padding = normalizePadding(overridePadding || this.padding);
        const rectInOverlay = new Rect(
            leftBottom.x - padding.left,
            leftBottom.y - padding.bottom,
            worldRect.width + padding.left + padding.right,
            worldRect.height + padding.top + padding.bottom,
        );

        return {
            guideId: this.guideId,
            node: this.node,
            rectInOverlay,
            worldRect,
            passThrough: this.passThrough,
            padding,
        };
    }
}

/** 获取节点上的 GuideAnchor，没有就自动添加，并设置 guideId。 */
export function getOrAddGuideAnchor(node: Node, guideId: string): GuideAnchor {
    let anchor = node.getComponent(GuideAnchor);
    if (!anchor) {
        anchor = node.addComponent(GuideAnchor);
    }
    anchor.setGuideId(guideId);
    return anchor;
}
