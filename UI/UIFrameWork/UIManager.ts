import UIBase from './UIBase';
import { singleton } from '../../Tools/Decorator/Singleton';
import UITips from './UITips';
import { setPoints } from '../../../../../creator';
import UIPopup from './UIPopup';

export class ViewZOrder {
    /**场景层 */
    public static readonly Scene = 20;
    /**顶部和底部菜单栏层级 */
    public static readonly MenuPanel = 80;
    /**UI层 */
    public static readonly UI = 100;
    /**弹框层 */
    public static readonly Popup = 200;
    /**提示层 */
    public static readonly Tips = 300;
    /**引导层 */
    public static readonly Guide = 400;
    /**通知层 */
    public static readonly Notice = 500;
    /**loading层 */
    public static readonly Loading = 600;
}

/**确定框界面参数 */
export interface DialogParams {
    title: string,
    content: string,
    okCallback?: Function,
    cancelCallback?: Function
}
export interface PopupParams {
    closeCallback?: Function;
}


export interface LoadingParams {
    events: [],//监听的事件。比如网络断开，展示loading. 连接成功之后关闭.那还需要个回调.


}

/**
 * 考虑缓存的问题。
 */
@singleton
export default class UIManager {
    public static instance: UIManager;

    /**
     * @description ui栈
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private uiStack: UIBase[] = [];

    /**
     * @description 缓存的ui，如果ui标记needCache那么就会在存到这里。
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private cachedUI: Map<string, Array<UIBase>> = new Map();

    public openUIClass<T extends UIBase>(uiClass: { new(): T }, zOrder: number = ViewZOrder.UI, callback?: Function, onProgress?: Function, data?: any) {
        if (this.hasUI(uiClass)) {
            if (!this.getUI(uiClass).allowMultiThisUI) {
                console.error(`UIManager OpenUI 1: ui ${cc.js.getClassName(uiClass)} is already exist, please check`);
                return;
            }
        }

        let initUI = (uiInstance: UIBase) => {
            if (!uiInstance) {
                console.error(`${uiClass.PrefabPath}没有绑定UI脚本!!!`);
                return;
            }
            let uiRoot = cc.director.getScene().getChildByName('Canvas');
            if (!uiRoot) {
                console.error(`当前场景没有${cc.director.getScene().name}Canvas!!!`);
                return;
            }
            uiInstance.node.parent = uiRoot;
            uiInstance.node.setPosition(0, 0);
            uiInstance.init(data);

            uiInstance.node.zIndex = zOrder;
            uiInstance.show();
            this.uiStack.push(uiInstance);
            callback && callback(uiInstance);

        }

        let uiInstance = this.getUIFromCachedList(uiClass);
        if (uiInstance) {
            initUI(uiInstance);
            return;
        }
        cc.loader.loadRes(uiClass.PrefabPath, (completedCount: number, totalCount: number, item: any) => {
            onProgress && onProgress(completedCount, totalCount, item);
        }, (error, prefab) => {
            if (error) {
                console.error(`UIManager OpenUI: load ui error: ${error}`);
                return;
            }
            if (this.hasUI(uiClass)) {
                if (!this.getUI(uiClass).allowMultiThisUI) {
                    console.error(`UIManager OpenUI 1: ui ${cc.js.getClassName(uiClass)} is already exist, please check`);
                    return;
                }
            }
            let uiNode: cc.Node = cc.instantiate(prefab);
            let uiInstance = uiNode.getComponent(uiClass) as UIBase;
            initUI(uiInstance);

        });
    }





    /**
     * @description 按节点打开，传过来要打开的弹窗的节点，然后控制其显示关闭
     * @param {cc.Node} uiNode
     * @param {number} [zOrder=ViewZOrder.UI]
     * @param {Function} [callback]
     * @memberof UIManager
     */
    public openUINode(uiNode: cc.Node, zOrder: number = ViewZOrder.UI, callback?: Function) {
        if (!uiNode.active) {
            uiNode.active = true;
        }
        uiNode.setPosition(0, 0);
        uiNode.zIndex = zOrder;
        uiNode.getComponent(UIBase).show();
    }


    public getUIFromCachedList<T extends UIBase>(uiClass: { new(): T }): UIBase {
        let ui = null;
        let uiName = cc.js.getClassName(uiClass);
        if (this.cachedUI.has(uiName)) {
            let uiArr = this.cachedUI.get(uiName);
            if (uiArr) {
                cc.log('cachedUI ', uiName, this.cachedUI.get(uiName).length);
                ui = uiArr.pop();
            }
        }
        return ui;
    }

    private setUIToCachedMap(ui: UIBase) {
        let uiName = cc.js.getClassName(ui);
        if (this.cachedUI.has(uiName)) {
            let uiArr = this.cachedUI.get(uiName);
            uiArr.push(ui);
        } else {
            let arr = new Array();
            arr.push(ui);
            this.cachedUI.set(uiName, arr);
        }
        cc.log('cachedUI ', uiName, this.cachedUI.get(uiName).length);
    }


    public closeUIByUIClass<T extends UIBase>(uiClass: { new(): T }) {
        for (let i = 0; i < this.uiStack.length; ++i) {
            if (cc.js.getClassName(this.uiStack[i]) === cc.js.getClassName(uiClass)) {
                if (cc.isValid(this.uiStack[i].node)) {
                    this.uiStack[i].close();
                }
                this.uiStack.splice(i, 1);
                return;
            }
        }
    }
    public closeUI(ui: UIBase | cc.Node) {
        cc.log('closeUI');
        if (ui instanceof cc.Node) {
            ui.getComponent(UIBase).close();
        }
        else {
            let index = this.uiStack.indexOf(ui);
            if (index < 0) {

            }
            if (cc.isValid(ui)) {
                if (ui.needCache) {
                    ui.hide();
                    this.setUIToCachedMap(ui);
                } else {
                    ui.close();
                }
            }
            if (index >= 0) {
                this.uiStack.splice(index, 1);
            }
        }

    }

    public closeAllUI() {
        if (this.uiStack.length == 0) {
            return;
        }
        this.closeUI(this.uiStack[0]);
        while (this.uiStack.length > 0) {
            this.closeUI(this.uiStack[0]);
        }
    }


    /**
     * @description 当一个界面关闭的时候。其附带的子界面都要关闭。
     * @memberof UIManager
     */
    public closeToUI() {

    }

    public hideUI<T extends UIBase>(uiClass: { new(): T }) {
        let ui = this.getUI(uiClass);
        if (ui) {
            ui.node.active = false;
        }
    }

    public hasUI<T extends UIBase>(uiClass: { new(): T }): boolean {
        let uiName = cc.js.getClassName(uiClass);
        for (let i = 0; i < this.uiStack.length; ++i) {
            if (cc.js.getClassName(this.uiStack[i]) == uiName) {
                return true;
            }
        }
        return false;
    }

    public getUI<T extends UIBase>(uiClass: { new(): T }): UIBase {
        for (let i = 0; i < this.uiStack.length; ++i) {
            if (cc.js.getClassName(this.uiStack[i]) === cc.js.getClassName(uiClass)) {
                return this.uiStack[i];
            }
        }
        return null;
    }

    public isShowing<T extends UIBase>(uiClass: { new(): T }) {
        let ui = this.getUI(uiClass);
        if (!ui) {
            return false;
        }
        return ui.node.active;
    }

    // 暂时没用到。先private 这个地方需要处理缓存ui
    private showUI<T extends UIBase>(uiClass: { new(): T }, callback?: Function, data?: any) {
        this.openUIClass(uiClass, ViewZOrder.UI, callback, null, data);
    }

    public showTips(uiClass, message: string, pos: cc.Vec2, ...param: any[]) {
        let tipUI = this.getUI(uiClass) as UITips;
        if (!tipUI) {
            this.openUIClass(uiClass, ViewZOrder.Tips, null, null, { message: message, pos: pos });
        } else {
            tipUI.init({ message: message, pos: pos });
            tipUI.show();
        }
    }

    public showPopup(uiClass, data?: any) {
        if (uiClass instanceof cc.Node) {
            this.openUINode(uiClass, ViewZOrder.Popup, null);
        } else {
            this.openUIClass(uiClass, ViewZOrder.Popup, null, null, data);
        }
    }


    // public showUI<T extends UIBase>(uiClass: UIClass<T>, callback?: Function) {
    //     let ui = this.getUI(uiClass);
    //     if (!ui) {
    //         console.error(`UIManager showUI: ui ${uiClass.getName()} not exist`);
    //         return;
    //     }
    //     ui.node.active = true;
    // }

    public ShowConfirmDialog(uiClass, data?: any) {
        this.openUIClass(uiClass, ViewZOrder.Popup, null, null, data);
    }
}