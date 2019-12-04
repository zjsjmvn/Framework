
const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("Plugins/UIComponents/ButtonScaler")
export default class ButtonScaler extends cc.Component {
    pressedScale: 1;
    transDuration: 0;
    // use this for initialization
    onLoad() {
        this.node.on('touchstart', this.onTouchStart, this);
        this.node.on('touchend', this.onTouchEnd, this);
        this.node.on('touchcancel', this.onTouchCancel, this);
    }
    onTouchStart() {
        this.node.scale = 1.05
    }
    onTouchEnd() {
        this.node.scale = 1.0
    }
    onTouchCancel() {
        this.node.scale = 1.0
    }

}
