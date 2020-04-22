import UIBase from './UIBase';
import UIManager from './UIManager';
import { PopupParams } from './UIManager';
const { property, ccclass } = cc._decorator
@ccclass
export default class UIPopup extends UIBase {
    /**
     * @description 点击空白处关闭
     * @type {boolean}
     * @memberof UIBase
     */
    @property()
    _touchMarginToClose: boolean = false;
    @property({ displayName: "点击空白处关闭", tooltip: "勾选后，当玩家点击ui之外空白处时会关闭此ui" })
    get touchMarginToClose() {
        return this._touchMarginToClose;
    }
    set touchMarginToClose(value) {
        if (this.node.getChildByName("Container")) {
            this._touchMarginToClose = value;
        } else {
            cc.error('需要Container节点才行');
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


    init(args: PopupParams) {
        if (args) {
            this.closeCallback = args.closeCallback;
        }

    }
    show() {
        super.show();

        cc.log('ss', this.touchMarginToClose, this.touchAnyWhereToClose)
        if (this._touchMarginToClose) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
    }

    close() {
        super.close();
        if (this._touchMarginToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        if (!!this.closeCallback) {
            this.closeCallback();
        }
    }

    onThisNodeTouchEnd_UsedFor_TouchMarginToClose(event) {
        // 判断是否点击的是外面,如果点击的是container外面。则关闭。
        let containerNode: cc.Node = this.node.getChildByName("Container");

        if (!!!containerNode) {
            cc.error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let boundingBoxToWorld = containerNode.getBoundingBoxToWorld();
        // 算出来在本节点中的位置。
        let nodePos = this.node.convertToNodeSpaceAR(cc.v2(boundingBoxToWorld.x, boundingBoxToWorld.y));
        let boundingBoxToNode = cc.rect(nodePos.x, nodePos.y, boundingBoxToWorld.width, boundingBoxToWorld.height);
        let contains = boundingBoxToNode.contains(this.node.convertToNodeSpaceAR(event.getLocation()));
        if (contains) {
            return;
        } else {
            UIManager.instance.closeUI(this);
        }
    }

    onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose(event) {
        cc.log('onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose');
        UIManager.instance.closeUI(this);
    }


}