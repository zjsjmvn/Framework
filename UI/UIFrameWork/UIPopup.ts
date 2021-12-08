import UIBase from './UIBase';
import UIManager from './UIManager';
const { property, ccclass } = cc._decorator

/**
 * @description 空白判断类型。
 * @enum {number}
 */
enum BlankJudgeType {
    ContentSize,
    BoundingBoxToWorld,
}
@ccclass
export default abstract class UIPopup extends UIBase {
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
            cc.error('需要Container节点才行');
        }
    }


    @property({
        visible: function () { return this.touchBlankToClose === true },
        displayName: "空白处判断方式",
        tooltip: "ContentSize就是使用container的大小来判断，BoundingBoxToWorld是使用包围盒来判断，会考虑子节点位置",
        type: cc.Enum(BlankJudgeType)
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
        cc.log('showNonBlankArea')
        let containerNode: cc.Node = this.node.getChildByName("Container");

        if (!!!containerNode) {
            cc.error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let rect: cc.Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            rect = containerNode.getBoundingBoxToWorld();
            let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
            rect.x = nodePos.x
            rect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNode.getContentSize();
            rect = cc.rect(containerNode.x - contentSize.width / 2, containerNode.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }

        let node = new cc.Node();
        node.opacity = 100;
        this.node.addChild(node);
        let sp = node.addComponent(cc.Sprite);
        if (sp) {
            cc.resources.load({ uuid: 'a23235d1-15db-4b95-8439-a2e005bfff91', type: cc.SpriteFrame }, (e, r) => {
                if (!e) {
                    sp.spriteFrame = r;
                    node.setContentSize(rect.width, rect.height);
                    node.setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);
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
    private closeCallback: Function = null;

    protected duration: number = 0.2

    abstract init(args);


    show() {
        super.show();
        if (this._touchBlankToClose) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        this.node._touchListener?.setSwallowTouches(false);


        // 储存选项
        // 初始化节点
        const background = this.node.getChildByName('Bg')
        if (background) {
            background.active = true;
            background.opacity = 0;
            // 播放背景遮罩动画
            cc.tween(background)
                .to(this.duration * 0.8, { opacity: 200 })
                .start();
        }

        const container = this.node.getChildByName('Container');
        if (container) {
            container.active = true;
            container.scale = 0.5;
            container.opacity = 0;
            // 播放弹窗主体动画
            cc.tween(container)
                .to(this.duration, { scale: 1, opacity: 255 }, { easing: 'backOut' })
                .call(() => {

                })
                .start();
        }


    }

    // TODO: 解决show频繁注册的问题。解决之后hide就不用关闭注册的事件了。
    hide() {
        if (this._touchBlankToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        // 动画时长不为 0 时拦截点击事件（避免误操作）
        if (this.duration !== 0) {
            let blocker = this.node.getChildByName('blocker');
            if (!blocker) {
                blocker = blocker = new cc.Node('blocker');
                blocker.addComponent(cc.BlockInputEvents);
                blocker.setParent(this.node);
                blocker.setContentSize(this.node.getContentSize());
            }
            blocker.active = true;
        }
        this.disappearAction(() => {
            super.hide();
        })

    }

    close() {
        if (this._touchBlankToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        this.disappearAction(() => {
            super.close();
        })

    }

    disappearAction(callback) {
        const background = this.node.getChildByName('Bg')
        if (background) {
            cc.tween(background)
                .delay(this.duration * 0.2)
                .to(this.duration * 0.8, { opacity: 0 })
                .start();
        }

        const container = this.node.getChildByName('Container');
        if (container) {
            // 播放弹窗主体动画
            cc.tween(container)
                .to(this.duration, { scale: 0.5, opacity: 0 }, { easing: 'backIn' })
                .call(() => {
                    let blocker = this.node.getChildByName('blocker');
                    blocker && (blocker.active = false);
                    callback && callback()
                })
                .start();
        }
    }

    onThisNodeTouchEnd_UsedFor_TouchMarginToClose(event) {
        // let pop = this.node.getComponentsInChildren(UIPopup);
        // cc.log('onThisNodeTouchEnd_UsedFor_TouchMarginToClose', pop)
        // 判断是否点击的是外面,如果点击的是container外面。则关闭。
        // if (event.eventPhase == cc.Event.CAPTURING_PHASE) return;
        // 允许触摸穿透
        let containerNode: cc.Node = this.node.getChildByName("Container");
        if (!!!containerNode) {
            cc.error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let rect: cc.Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            rect = containerNode.getBoundingBoxToWorld();
            let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
            rect.x = nodePos.x
            rect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNode.getContentSize();
            rect = cc.rect(containerNode.x - contentSize.width / 2, containerNode.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }
        let contains = rect.contains(this.node.convertToNodeSpaceAR(event.getLocation()));
        if (!contains) {
            UIManager.instance.closeUI(this);
        }
        return;
    }

    onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose(event) {
        cc.log('onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose');
        UIManager.instance.closeUI(this);

    }


}




