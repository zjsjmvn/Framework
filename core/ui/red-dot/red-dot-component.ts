import { Component, _decorator, log, UIOpacity } from 'cc';
import RedDotManager from './red-dot-manager';
import { Enum } from 'cc';
import { RedDotNodeType } from './tree-node';
import { error } from 'cc';
const { ccclass, property } = _decorator;

@ccclass("RedDotComponent")
export default class RedDotComponent extends Component {
    @property({
        type: Enum(RedDotNodeType),
        tooltip: "动态生成的都是Dynamic,比如背包内的装备。静态都是static,比如背包界面的按钮",
    })
    public redDotNodeType: RedDotNodeType = RedDotNodeType.Static;
    @property
    public _path: string = ''
    protected currentValue = 0;

    onLoad() {
        // 先隐藏
        if (this.currentValue == 0) {
            this.onValueChanged(0);
        }

    }
    // 这个负责显示红点。
    onValueChanged(value) {
        this.currentValue = value;
        if (value == 0 && this.node) {
            // 关闭红点显示。
            this.node.getComponent(UIOpacity).opacity = 0;
        } else if (value > 0 && this.node) {
            // 显示红点。
            this.node.getComponent(UIOpacity).opacity = 255;
        } else if (value < 0) {
            log('value < 0 ');
        }
    }

    onDestroy() {
        // 移除注册事件，防止value改变的时候事件已经是空
        if (this._path != "") {
            RedDotManager.instance.removeListener(this._path);
        }
    }


    public setDynamicPath(path: string) {
        this._path = path;
        if (this.redDotNodeType == RedDotNodeType.Dynamic) {
            RedDotManager.instance.addPathAndBindListener(this._path, this.onValueChanged.bind(this));
        } else {
            error("动态路径只能设置动态类型的节点");
        }
    }


    public setStaticPath(path: string) {
        this._path = path;
        if (this.redDotNodeType == RedDotNodeType.Static) {
            RedDotManager.instance.addPathAndBindListener(this._path, this.onValueChanged.bind(this));
        } else {
            error("静态路径只能设置静态类型的节点");
        }
    }

    public changeValueToZero() {
        RedDotManager.instance.changeValue(this._path, 0);
    }

}
