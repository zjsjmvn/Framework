import { _decorator, assetManager, Color, Component, EventTouch, Graphics, Label, Node, Rect, Sprite, SpriteFrame, tween, Tween, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { GuideAnchorSnapshot, GuideStepConfig, IGuideOverlay, IGuideTouchHandler } from './guide-types';

const { ccclass, property } = _decorator;

/** 默认引导遮罩：自动绘制暗色遮罩、目标高亮、提示文字和手指动画。 */
@ccclass('GuideDefaultOverlay')
export class GuideDefaultOverlay extends Component implements IGuideOverlay {
    /** 遮罩不透明度，0 完全透明，255 完全不透明。 */
    @property({ displayName: '遮罩透明度', tooltip: '引导暗色遮罩的不透明度，0 表示完全透明，255 表示完全不透明。' })
    public maskOpacity: number = 160;

    /** 目标高亮圆角半径。 */
    @property({ displayName: '高亮圆角', tooltip: '目标高亮框和镂空区域的圆角半径。数值越大，边角越圆。' })
    public holeRadius: number = 12;

    /** 多目标手指动画移动速度，单位是 UI 坐标每秒。 */
    @property({ displayName: '手指移动速度', tooltip: '拖拽或滑动引导中，默认手指动画在多个目标之间移动的速度。单位为 UI 坐标每秒。' })
    public fingerMoveSpeed: number = 520;

    /** 默认手指图片路径，格式为 bundle/path/to/sprite/spriteFrame。为空时使用内置绘制手指。 */
    @property({ displayName: '手指图片路径', tooltip: '引导手指 SpriteFrame 的资源路径，格式为 bundle/path/to/sprite/spriteFrame。为空或加载失败时使用内置绘制手指。' })
    public fingerSpritePath: string = '';

    /** 暗色遮罩绘制组件。 */
    private maskGraphics: Graphics = null;
    /** 目标边框高亮绘制组件。 */
    private highlightGraphics: Graphics = null;
    /** 默认手指动画节点。 */
    private fingerNode: Node = null;
    /** 默认手指图片组件。 */
    private fingerSprite: Sprite = null;
    /** 默认手指图形绘制组件。 */
    private fingerGraphics: Graphics = null;
    /** 已尝试加载的手指图片路径，避免 ensureBuilt 反复发起加载。 */
    private loadedFingerSpritePath: string = '';
    /** 提示文案节点。 */
    private textNode: Node = null;
    /** 提示文案 Label。 */
    private textLabel: Label = null;
    /** 当前步骤的触摸处理器，由 GuideRunner 设置。 */
    private touchHandler: IGuideTouchHandler | null = null;
    /** 当前显示的步骤；用于隐藏遮罩步骤判断默认触摸策略。 */
    private currentStep: GuideStepConfig | null = null;

    /** 初始化默认节点结构并注册触摸事件。 */
    protected onLoad(): void {
        this.ensureBuilt();
        this.registerTouchEvents();
    }

    /** 节点销毁时停止手指 tween，避免 tween 持有失效节点。 */
    protected onDestroy(): void {
        this.stopFinger();
    }

    /** 只准备视觉内容，不播放手指动画。 */
    public prepare(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        this.ensureBuilt();
        this.currentStep = step;
        this.drawMask(step, snapshots);
        this.updateText(step, snapshots);
    }

    /** 显示一个步骤的完整默认视觉效果。 */
    public showStep(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        this.prepare(step, snapshots);
        this.playFinger(step, snapshots);
    }

    /** 步骤完成后显示 completeText。 */
    public showCompleteText(step: GuideStepConfig): void {
        if (!step.completeText) {
            return;
        }

        this.ensureBuilt();
        this.textNode.active = true;
        this.textLabel.string = step.completeText;
    }

    /** 清理当前步骤的绘制、文案、手指动画和触摸处理器。 */
    public clearStep(): void {
        this.ensureBuilt();
        this.maskGraphics.clear();
        this.highlightGraphics.clear();
        this.textNode.active = false;
        this.stopFinger();
        this.touchHandler = null;
        this.currentStep = null;
    }

    /** 释放遮罩节点。 */
    public dispose(): void {
        this.clearStep();
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
    }

    /** 设置当前步骤触摸处理器，由 GuideRunner 在步骤开始和结束时更新。 */
    public setTouchHandler(handler: IGuideTouchHandler | null): void {
        this.touchHandler = handler;
    }

    /** 懒创建默认遮罩内部节点，支持外部 prefab 只挂一个 GuideDefaultOverlay。 */
    private ensureBuilt(): void {
        let transform = this.node.getComponent(UITransform);
        if (!transform) {
            transform = this.node.addComponent(UITransform);
        }
        transform.anchorX = 0.5;
        transform.anchorY = 0.5;

        if (!this.maskGraphics) {
            const maskNode = new Node('Mask');
            maskNode.layer = this.node.layer;
            this.node.addChild(maskNode);
            const maskTransform = maskNode.addComponent(UITransform);
            maskTransform.anchorX = 0.5;
            maskTransform.anchorY = 0.5;
            this.maskGraphics = maskNode.addComponent(Graphics);
        }

        if (!this.highlightGraphics) {
            const highlightNode = new Node('Highlight');
            highlightNode.layer = this.node.layer;
            this.node.addChild(highlightNode);
            const highlightTransform = highlightNode.addComponent(UITransform);
            highlightTransform.anchorX = 0.5;
            highlightTransform.anchorY = 0.5;
            this.highlightGraphics = highlightNode.addComponent(Graphics);
        }

        if (!this.fingerNode) {
            this.fingerNode = new Node('Finger');
            this.fingerNode.layer = this.node.layer;
            this.node.addChild(this.fingerNode);
            const fingerTransform = this.fingerNode.addComponent(UITransform);
            fingerTransform.setContentSize(44, 56);
            this.fingerSprite = this.fingerNode.addComponent(Sprite);
            this.fingerGraphics = this.fingerNode.addComponent(Graphics);
            this.fingerNode.active = false;
        }
        this.refreshFingerVisual();

        if (!this.textNode) {
            this.textNode = new Node('Text');
            this.textNode.layer = this.node.layer;
            this.node.addChild(this.textNode);
            const textTransform = this.textNode.addComponent(UITransform);
            textTransform.setContentSize(460, 92);
            this.textLabel = this.textNode.addComponent(Label);
            this.textLabel.fontSize = 30;
            this.textLabel.lineHeight = 36;
            this.textLabel.color = new Color(255, 255, 255, 255);
            this.textLabel.enableWrapText = true;
            this.textLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
            this.textLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.textLabel.verticalAlign = Label.VerticalAlign.CENTER;
            this.textNode.active = false;
        }
    }

    /** 把遮罩根节点收到的触摸事件转发给当前步骤处理器。 */
    private registerTouchEvents(): void {
        this.node.on(Node.EventType.TOUCH_START, this.handleTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.handleTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.handleTouchCancel, this);
    }

    /** 绘制遮罩和目标高亮。 */
    private drawMask(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        const transform = this.node.getComponent(UITransform);
        const width = transform.width;
        const height = transform.height;
        const left = -width * transform.anchorX;
        const bottom = -height * transform.anchorY;

        this.maskGraphics.clear();
        this.maskGraphics.fillColor = new Color(0, 0, 0, step.showMask === false ? 0 : this.maskOpacity);

        if (step.showMask === false) {
            return;
        }

        if (snapshots.length === 0) {
            this.maskGraphics.fillRect(left, bottom, width, height);
            return;
        }

        const rects = snapshots.map((snapshot) => snapshot.rectInOverlay);
        // Graphics 这里没有直接的多矩形镂空能力，所以只绘制目标矩形以外的区域。
        this.fillOutsideRects(left, bottom, width, height, rects);

        this.highlightGraphics.clear();
        this.highlightGraphics.strokeColor = new Color(255, 255, 255, 230);
        this.highlightGraphics.lineWidth = 4;
        for (const rect of rects) {
            this.highlightGraphics.roundRect(rect.x, rect.y, rect.width, rect.height, this.holeRadius);
            this.highlightGraphics.stroke();
        }
    }

    /** 填充所有目标洞之外的区域，形成“镂空”效果。 */
    private fillOutsideRects(left: number, bottom: number, width: number, height: number, holes: Rect[]): void {
        const xs = [left, left + width];
        const ys = [bottom, bottom + height];

        // 用所有洞的边界切分遮罩，再填充中心点不在洞里的网格，避免依赖 shader 或 Mask 组件。
        holes.forEach((hole) => {
            xs.push(hole.x, hole.x + hole.width);
            ys.push(hole.y, hole.y + hole.height);
        });

        const sortedX = Array.from(new Set(xs)).sort((a, b) => a - b);
        const sortedY = Array.from(new Set(ys)).sort((a, b) => a - b);

        for (let ix = 0; ix < sortedX.length - 1; ix++) {
            for (let iy = 0; iy < sortedY.length - 1; iy++) {
                const x = sortedX[ix];
                const y = sortedY[iy];
                const w = sortedX[ix + 1] - x;
                const h = sortedY[iy + 1] - y;
                if (w <= 0 || h <= 0) {
                    continue;
                }

                const center = v2(x + w / 2, y + h / 2);
                const insideHole = holes.some((hole) => hole.contains(center));
                if (!insideHole) {
                    this.maskGraphics.fillRect(x, y, w, h);
                }
            }
        }
    }

    /** 更新提示文案；未配置 textPosition 时根据第一个目标自动放在上方或下方。 */
    private updateText(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        if (!step.text) {
            this.textNode.active = false;
            return;
        }

        this.textNode.active = true;
        this.textLabel.string = step.text;

        if (step.textPosition) {
            this.textNode.setPosition(step.textPosition.x, step.textPosition.y, 0);
            return;
        }

        const firstRect = snapshots[0]?.rectInOverlay;
        if (!firstRect) {
            this.textNode.setPosition(0, -180, 0);
            return;
        }

        const transform = this.node.getComponent(UITransform);
        const textHeight = this.textNode.getComponent(UITransform).height;
        const topSpace = transform.height / 2 - (firstRect.y + firstRect.height);
        const y = topSpace > textHeight + 40 ? firstRect.y + firstRect.height + 64 : firstRect.y - 64;
        this.textNode.setPosition(firstRect.x + firstRect.width / 2, y, 0);
    }

    /** 播放默认手指动画：单目标为点击缩放，多目标为按目标中心循环移动。 */
    private playFinger(step: GuideStepConfig, snapshots: GuideAnchorSnapshot[]): void {
        this.stopFinger();
        if (step.showFinger === false || snapshots.length === 0) {
            return;
        }

        const points = snapshots.map((snapshot) => this.rectCenter(snapshot.rectInOverlay));
        if (step.fingerOffset) {
            points.forEach((point) => {
                point.x += step.fingerOffset.x;
                point.y += step.fingerOffset.y;
            });
        }

        this.fingerNode.active = true;
        this.fingerNode.setPosition(points[0]);
        this.fingerNode.setScale(1, 1, 1);

        if (points.length === 1) {
            tween(this.fingerNode)
                .repeatForever(
                    tween()
                        .to(0.32, { scale: v3(1.2, 1.2, 1) })
                        .to(0.32, { scale: v3(1, 1, 1) })
                        .delay(0.25)
                )
                .start();
            return;
        }

        const actions = [];
        let from = points[0];
        for (let i = 1; i < points.length; i++) {
            const to = points[i];
            const duration = Math.max(0.15, Vec3.distance(from, to) / this.fingerMoveSpeed);
            actions.push(tween().to(duration, { position: to }).delay(0.15));
            from = to;
        }
        actions.push(tween().call(() => this.fingerNode.setPosition(points[0])));

        tween(this.fingerNode).repeatForever(tween().sequence(...actions)).start();
    }

    /** 停止手指动画并隐藏手指节点。 */
    private stopFinger(): void {
        if (!this.fingerNode) {
            return;
        }
        Tween.stopAllByTarget(this.fingerNode);
        this.fingerNode.active = false;
    }

    /** 用 Graphics 画一个简单手指图形，避免默认实现依赖外部图片资源。 */
    private drawFinger(): void {
        if (this.fingerSprite) {
            this.fingerSprite.spriteFrame = null;
            this.fingerSprite.enabled = false;
        }
        if (this.fingerGraphics) {
            this.fingerGraphics.enabled = true;
        }
        this.fingerGraphics.clear();
        this.fingerGraphics.fillColor = new Color(255, 255, 255, 255);
        this.fingerGraphics.strokeColor = new Color(70, 70, 70, 255);
        this.fingerGraphics.lineWidth = 3;
        this.fingerGraphics.roundRect(-10, -20, 20, 42, 10);
        this.fingerGraphics.fill();
        this.fingerGraphics.stroke();
        this.fingerGraphics.fillColor = new Color(255, 255, 255, 255);
        this.fingerGraphics.circle(0, 24, 10);
        this.fingerGraphics.fill();
        this.fingerGraphics.stroke();
    }

    /** 刷新手指视觉。优先加载外部 SpriteFrame，失败时回退到内置 Graphics 手指。 */
    private refreshFingerVisual(): void {
        const path = (this.fingerSpritePath || '').trim();
        if (!path) {
            this.loadedFingerSpritePath = '';
            this.drawFinger();
            return;
        }

        if (this.loadedFingerSpritePath === path) {
            return;
        }
        this.loadedFingerSpritePath = path;
        this.loadFingerSpriteFrame(path, (spriteFrame) => {
            if (!this.node?.isValid || this.loadedFingerSpritePath !== path) {
                return;
            }
            if (!spriteFrame) {
                this.drawFinger();
                return;
            }

            this.fingerGraphics.clear();
            this.fingerGraphics.enabled = false;
            this.fingerSprite.enabled = true;
            this.fingerSprite.spriteFrame = spriteFrame;
        });
    }

    /** 支持 bundle/path/spriteFrame 格式，便于业务传 game_base 子包内的手指图。 */
    private loadFingerSpriteFrame(path: string, callback: (spriteFrame: SpriteFrame | null) => void): void {
        const splitIndex = path.indexOf('/');
        const bundleName = splitIndex > 0 ? path.slice(0, splitIndex) : '';
        const assetPath = splitIndex > 0 ? path.slice(splitIndex + 1) : path;
        const bundle = bundleName ? assetManager.getBundle(bundleName) : null;

        if (!bundle) {
            callback(null);
            return;
        }

        bundle.load(assetPath, SpriteFrame, (error, spriteFrame) => {
            if (error || !spriteFrame) {
                console.warn(`[GuideNext] finger sprite load failed: ${path}`, error);
                callback(null);
                return;
            }
            callback(spriteFrame);
        });
    }

    /** 计算矩形中心点，作为手指动画的默认位置。 */
    private rectCenter(rect: Rect): Vec3 {
        return v3(rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
    }

    /** 触摸开始事件入口。 */
    private handleTouchStart(event: EventTouch): void {
        this.applyTouchResult(event, this.touchHandler?.onTouchStart?.(event));
    }

    /** 触摸移动事件入口。 */
    private handleTouchMove(event: EventTouch): void {
        this.applyTouchResult(event, this.touchHandler?.onTouchMove?.(event));
    }

    /** 触摸结束事件入口。 */
    private handleTouchEnd(event: EventTouch): void {
        this.applyTouchResult(event, this.touchHandler?.onTouchEnd?.(event));
    }

    /** 触摸取消事件入口。 */
    private handleTouchCancel(event: EventTouch): void {
        this.applyTouchResult(event, this.touchHandler?.onTouchCancel?.(event));
    }

    /** 根据步骤判断结果决定遮罩是否吞掉本次触摸。 */
    private applyTouchResult(event: EventTouch, shouldSwallow?: boolean): void {
        if (this.shouldAllowHiddenStepTouchThrough(shouldSwallow)) {
            event.preventSwallow = true;
            event.propagationStopped = false;
            return;
        }
        if (shouldSwallow === false) {
            // Cocos 的 preventSwallow=true 表示“阻止当前节点吞掉事件”，事件会继续派发给下层命中的节点。
            event.preventSwallow = true;
            event.propagationStopped = false;
        } else {
            event.preventSwallow = false;
            event.propagationStopped = true;
        }
    }

    private shouldAllowHiddenStepTouchThrough(shouldSwallow?: boolean): boolean {
        if (shouldSwallow !== undefined) {
            return false;
        }
        if (this.currentStep?.blockOthers === true) {
            return false;
        }
        return this.currentStep?.showMask === false;
    }
}
