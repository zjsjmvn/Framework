import RedDotManager from './RedDotManager';
const { ccclass, property } = cc._decorator;



@ccclass
export default class RedDotComponent extends cc.Component {

    @property
    public _path: string = ''
    protected currentValue = 0;

    onLoad() {
        // 注册。注册路径和事件。移除路径和事件。
        RedDotManager.instance.addPathAndBindListener(this._path, this.onValueChanged.bind(this));
    }

    // 这个负责显示红点。
    onValueChanged(value) {
        this.currentValue = value;
        if (value == 0 && this.node) {
            // 关闭红点显示。
            this.node.opacity = 0;
        } else if (value > 0 && this.node) {
            // 显示红点。
            this.node.opacity = 255;
        } else if (value < 0) {
            cc.log('value < 0 ');
        }
    }

    onDestroy() {
        // 移除注册事件，防止value改变的时候事件已经是空
        if (this._path != "") {
            RedDotManager.instance.removeListener(this._path);
        }
    }

}
