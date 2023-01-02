import UIBase from './UIBase';
import UIManager from './UIManager';
import { ClazzOrModelSchema } from '../../Utils/Serializer/Serializr/serializr';
import Utils from '../../Utils/Utils';
import { Enum, Node, Rect, _decorator, error, Sprite, SpriteFrame, resources, log, UIOpacity, v3, UITransform, tween, v2, EventTouch, rect, UITransformComponent } from 'cc';
const { property, ccclass } = _decorator

/**
 * @description 空白判断类型。
 * @enum {number}
 */
enum BlankJudgeType {
    ContentSize,
    BoundingBoxToWorld,
}
@ccclass
export default abstract class UIPopup<T = any> extends UIBase {
    /**
     * @description 点击空白处关闭
     * @type {boolean}
     * @memberof UIBase
     */
    @property()
    _touchBlankToClose: boolean = false;
    @property({ displayName: "点击空白处关闭", tooltip: "勾选后，当玩家点击ui之外空白处时会关闭此ui" })
    get touchBlankToClose() {
        return this._touchBlankToClose;
    }
    set touchBlankToClose(value) {
        if (this.node.getChildByName("Container")) {
            this._touchBlankToClose = value;
        } else {
            error('需要Container节点才行');
        }
    }

    @property({
        visible: function () { return this.touchBlankToClose === true },
        displayName: "空白处判断方式",
        tooltip: "ContentSize就是使用container的大小来判断，BoundingBoxToWorld是使用包围盒来判断，会考虑子节点位置",
        type: Enum(BlankJudgeType)
    })
    blankJudgeType: BlankJudgeType = BlankJudgeType.BoundingBoxToWorld;


    _showNonBlankArea: boolean = false;
    @property({
        visible: function () { return this.touchBlankToClose === true },
        displayName: "测试：显示非空白区域，显示1s后自动删除",
    })
    get showNonBlankArea() {
        return this._showNonBlankArea;
    }
    set showNonBlankArea(val) {
        // log('showNonBlankArea')
        let containerNode: Node = this.node.getChildByName("Container");
        let containerNodeUiTransform = containerNode.getComponent(UITransform);
        if (!!!containerNode) {
            error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let containerNodeRect: Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            containerNodeRect = containerNodeUiTransform.getBoundingBoxToWorld();
            let nodePos = this.node.getComponent(UITransformComponent).convertToNodeSpaceAR(v3(containerNodeRect.x, containerNodeRect.y));
            containerNodeRect.x = nodePos.x
            containerNodeRect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNodeUiTransform.contentSize;
            // rect = rect(containerNode.x - contentSize.width / 2, containerNode.y - contentSize.height / 2, contentSize.width, contentSize.height);
            containerNodeRect = rect(containerNode.position.x - contentSize.width / 2, containerNode.position.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }

        let node = new Node();
        node.getComponent(UIOpacity).opacity = 100;
        let nodeUiTransform = node.getComponent(UITransform);

        this.node.addChild(node);
        let sp = node.addComponent(Sprite);
        if (sp) {

            resources.load({ uuid: 'a23235d1-15db-4b95-8439-a2e005bfff91', type: SpriteFrame }, (e, r) => {
                if (!e) {
                    sp.spriteFrame = r;
                    nodeUiTransform.setContentSize(containerNodeRect.width, containerNodeRect.height);
                    node.setPosition(containerNodeRect.x + containerNodeRect.width / 2, containerNodeRect.y + containerNodeRect.height / 2);
                    setTimeout(() => {
                        node.removeFromParent();
                    }, 1000);
                }
            });
        }

    }

    /**
     * @description 点击任意处关闭
     * @type {boolean}
     * @memberof UIBase
     */
    @property()
    private _touchAnyWhereToClose: boolean = false;
    @property({ displayName: "点击任意处关闭", tooltip: "勾选后，当玩家点击ui的任意处都可关闭ui。适合结算等奖励界面" })
    get touchAnyWhereToClose() {
        return this._touchAnyWhereToClose;
    }
    set touchAnyWhereToClose(value) {
        this._touchAnyWhereToClose = value;
    }

    protected duration: number = 0.2;
    private backgroundOriginalOpacity: { opacity: number } = null;
    public abstract init(args?: T);

    show() {
        super.show();
        if (this._touchBlankToClose) {
            this.node.on(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.on(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        this.node._touchListener?.setSwallowTouches(false);

        this.runBgAction();

        this.runContainerAction();



    }

    runBgAction() {
        const background = this.node.getChildByName('Bg');
        if (background) {
            const oldOpacity = background.getComponent(UIOpacity).opacity;
            if (!this.backgroundOriginalOpacity) {
                this.backgroundOriginalOpacity = { opacity: oldOpacity }
            }
            background.active = true;
            background.getComponent(UIOpacity).opacity = 0;
            // 播放背景遮罩动画
            tween(background.getComponent(UIOpacity))
                .to(this.duration * 0.8, { opacity: this.backgroundOriginalOpacity.opacity })
                .start();
        }
    }

    runContainerAction() {
        const container = this.node.getChildByName('Container');
        if (container) {
            container.active = true;
            container.scale = v3(0.5, 0.5, 0.5);
            container.getComponent(UIOpacity).opacity = 0;
            // 播放弹窗主体动画
            tween(container)
                .to(this.duration, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                .call(() => {
                })
                .start();

            tween(container.getComponent(UIOpacity))
                .to(this.duration, { opacity: 255 }, { easing: 'backOut' })
                .call(() => {
                })
                .start();
        }
    }

    // TODO: 解决show频繁注册的问题。解决之后hide就不用关闭注册的事件了。
    async hide() {
        if (this._touchBlankToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }

        await this.disappearAction();
        super.hide();
    }

    async close() {
        if (this._touchBlankToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        await this.disappearAction();
        super.close();
    }
    /**
     * @description
     * @return {*}  {Promise<boolean>}
     * @memberof UIPopup
     */
    async disappearAction(): Promise<boolean> {
        const background = this.node.getChildByName('Bg')
        if (background) {
            tween(background.getComponent(UIOpacity))
                .delay(this.duration * 0.2)
                .to(this.duration * 0.8, { opacity: 0 })
                .start();
        }

        const container = this.node.getChildByName('Container');
        if (container) {
            // 播放弹窗主体动画
            tween(container)
                .to(this.duration, { scale: v3(0.5, 0.5) }, { easing: 'backIn' })
                .call(() => {
                    let blocker = this.node.getChildByName('blocker');
                    blocker && (blocker.active = false);
                })
                .start();
            tween(container.getComponent(UIOpacity))
                .to(this.duration, { opacity: 0 }, { easing: 'backIn' })
                .call(() => {
                })
                .start();
        }
        await Utils.delay(this.duration * 1000);
        return Promise.resolve(true);
    }

    onThisNodeTouchEnd_UsedFor_TouchMarginToClose(event: EventTouch) {
        // let pop = this.node.getComponentsInChildren(UIPopup);
        // log('onThisNodeTouchEnd_UsedFor_TouchMarginToClose', pop)
        // 判断是否点击的是外面,如果点击的是container外面。则关闭。
        // if (event.eventPhase == Event.CAPTURING_PHASE) return;
        // 允许触摸穿透
        let containerNode: Node = this.node.getChildByName("Container");
        let containerNodeUiTransform = containerNode.getComponent(UITransform);

        if (!!!containerNode) {
            error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let containerNodeRect: Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            containerNodeRect = containerNodeUiTransform.getBoundingBoxToWorld();
            let nodePos = containerNodeUiTransform.convertToNodeSpaceAR(v3(containerNodeRect.x, containerNodeRect.y));
            containerNodeRect.x = nodePos.x
            containerNodeRect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNodeUiTransform.contentSize;
            containerNodeRect = rect(containerNode.position.x - contentSize.width / 2, containerNode.position.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }
        let nodePos = containerNodeUiTransform.convertToNodeSpaceAR(v3(event.getLocation().x, event.getLocation().y, 0))
        let contains = containerNodeRect.contains(v2(nodePos.x, nodePos.y));
        if (!contains) {
            UIManager.instance.closeUI(this);
        }
        return;
    }

    onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose(event) {
        log('onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose');
        UIManager.instance.closeUI(this);

    }


}




