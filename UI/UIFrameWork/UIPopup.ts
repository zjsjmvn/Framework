import UIBase from './UIBase';
import UIManager from './UIManager';
const { property, ccclass } = cc._decorator
@ccclass
export default class UIPopup extends UIBase {
    /**
     * @description 快速关闭，
     * @type {boolean}
     * @memberof UIBase
     */
    _quickClose: boolean = false;
    @property({ displayName: "此ui是否需要快速关闭", tooltip: "勾选后，当玩家点击ui之外空白处时会关闭此ui" })
    get quickClose() {
        return this._quickClose;
    }
    set quickClose(value) {
        if (this.node.getChildByName("Container")) {
            this._quickClose = value;
        } else {
            cc.error('需要Container节点才行');
        }

    }

    onLoad() {

        cc.log("show")
        this.show();
    }


    show() {
        super.show();
        if (this._quickClose) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEndUsedForQuickClose, this);
        }

    }

    close() {
        super.close();
        if (this._quickClose) {
            this.node.off(cc.Node.EventType.TOUCH_END, this.onThisNodeTouchEndUsedForQuickClose, this);
        }
    }

    onThisNodeTouchEndUsedForQuickClose(event) {
        // 判断是否点击的是外面,如果点击的是container外面。则关闭。
        let containerNode: cc.Node = this.node.getChildByName("Container1");
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



}