import RedDotManager from './RedDotManager';
const { ccclass, property } = cc._decorator;



@ccclass
export default class RedDotComponent extends cc.Component {

    @property
    public path: string = ''


    onLoad() {
        // 注册。注册路径和事件。移除路径和事件。
        cc.log('this.path', this.path);
        RedDotManager.instance.addTreeNodeAndCallback(this.path, this.onValueChanged.bind(this));
    }


    // 这个负责显示红点。
    onValueChanged(value) {
        if (value == 0) {
            // 关闭红点显示。
            this.node.opacity = 0;
        } else {
            // 显示红点。
            this.node.opacity = 255;
        }
    }

    onDestroy() {
        // 移除注册。
        RedDotManager.instance.removeTreeNode(this.path);
    }


    sss() {
        RedDotManager.instance.changeValue(this.path, 1);
    }


}
