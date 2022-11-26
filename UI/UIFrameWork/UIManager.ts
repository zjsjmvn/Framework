import { singleton } from '../../Utils/Decorator/Singleton';
import UIBase from './UIBase';
import UITips from './UITips';

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
     * @description 动态ui栈放的是动态加载的ui
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private dynamicUIStack: UIBase[] = [];

    /**
     * @description 静态ui栈，放的是静态ui，比如弹框里的弹框，就没必要在分出去预制体了,否则太乱。
     * @private
     * @type {cc.Node[]}
     * @memberof UIManager
     */
    private staticUIStack: cc.Node[] = [];
    /**
     * @description 缓存的ui，如果ui标记needCache那么就会在存到这里。
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private cachedUI: Map<string, UIBase> = new Map();

    private uiPrefabNameAndPathMap: Map<string, string> = new Map();

    public openUIClass<T extends UIBase>(uiClass: { new(): T }, zOrder: number = ViewZOrder.UI, showCallback?: Function, onProgress?: Function, data?: any, closeCallback?: Function) {
        if (this.hasUI(uiClass)) {
            if (!this.getUI(uiClass).allowMultiThisUI) {
                console.warn(`UIManager OpenUI 1: ui ${cc.js.getClassName(uiClass)} is already exist, please check`);
                return;
            }
        }

        let initUI = (uiInstance: UIBase) => {
            if (!uiInstance) {
                console.error(`${cc.js.getClassName(uiClass)}没有绑定UI脚本!!!`);
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
            uiInstance.closeCallback = closeCallback;
            uiInstance.node.zIndex = zOrder;
            uiInstance.show();
            this.dynamicUIStack.push(uiInstance);
            showCallback && showCallback(uiInstance);

        }

        let uiInstance = this.getUIFromCachedMap(uiClass);
        if (uiInstance) {
            initUI(uiInstance);
            uiInstance.show();
            return;
        }


        let path = this.uiPrefabNameAndPathMap.get(cc.js.getClassName(uiClass));
        if (!path) {
            cc.error(`没有找到uiClass = ${cc.js.getClassName(uiClass)}对应的预制体路径`)
            return;
        }
        cc.resources.load(path, (completedCount: number, totalCount: number, item: any) => {
            onProgress && onProgress(completedCount, totalCount, item);
        }, (error, prefab) => {
            if (error) {
                console.error(`UIManager OpenUI: load ui error: ${error}`);
                return;
            }
            if (this.hasUI(uiClass)) {
                if (!this.getUI(uiClass).allowMultiThisUI) {
                    console.warn(`UIManager OpenUI 1: ui ${cc.js.getClassName(uiClass)} is already exist, please check`);
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
    public openUINode(uiNode: cc.Node, zOrder: number = ViewZOrder.UI, callback?: Function, data?: any, closeCallback?: Function) {
        if (!uiNode.active) {
            uiNode.active = true;
        }
        uiNode.setPosition(0, 0);
        uiNode.zIndex = zOrder;
        uiNode.getComponent(UIBase).init(data);
        uiNode.getComponent(UIBase).show();
        uiNode.getComponent(UIBase).closeCallback = closeCallback;
        this.staticUIStack.push(uiNode);
    }


    public getUIFromCachedMap<T extends UIBase>(uiClass: { new(): T }): UIBase {
        let ui = null;
        let uiName = cc.js.getClassName(uiClass);
        if (this.cachedUI.has(uiName)) {
            ui = this.cachedUI.get(uiName);
        }
        return ui;
    }

    private setUIToCachedMap(ui: UIBase) {
        let uiName = cc.js.getClassName(ui);
        if (this.cachedUI.has(uiName)) {
            return;
        } else {
            this.cachedUI.set(uiName, ui);
        }
        // cc.log('cachedUI ', uiName, this.cachedUI.get(uiName).length);
    }

    public closeUIByUIClass<T extends UIBase>(uiClass: { new(): T }) {
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (cc.js.getClassName(this.dynamicUIStack[i]) === cc.js.getClassName(uiClass)) {
                if (cc.isValid(this.dynamicUIStack[i].node)) {
                    this.dynamicUIStack[i].close();
                    // return this.closeUI(this.dynamicUIStack[i]);
                }
                this.dynamicUIStack.splice(i, 1);
                return;
            }
        }
    }
    public async closeUI(ui: UIBase | cc.Node): Promise<boolean> {
        //节点类型就是在场景中直接存在的
        if (ui instanceof cc.Node) {
            let index = this.staticUIStack.indexOf(ui);
            if (index >= 0) {
                this.staticUIStack.splice(index, 1);
            }
            await ui.getComponent(UIBase).hide();
            return Promise.resolve(true);
        } else {
            // 不在uiStack的ui都是由节点自己管理。
            let index = this.dynamicUIStack.indexOf(ui);
            if (index < 0) {
                await ui.hide();
                return Promise.resolve(true);
            } else {
                if (index >= 0) {
                    this.dynamicUIStack.splice(index, 1);
                }
                if (cc.isValid(ui)) {
                    if (ui.needCache) {
                        await ui.hide();
                        this.setUIToCachedMap(ui);
                        return Promise.resolve(true);
                    } else {
                        await ui.close();
                        return Promise.resolve(true);
                    }
                }
            }
        }
    }

    public closeAllUI() {
        if (this.dynamicUIStack.length == 0) {
            return;
        }
        while (this.dynamicUIStack.length > 0) {
            this.closeUI(this.dynamicUIStack[0]);
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
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (cc.js.getClassName(this.dynamicUIStack[i]) == uiName) {
                return true;
            }
        }
        return false;
    }

    public getUI<T extends UIBase>(uiClass: { new(): T }): UIBase {
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (cc.js.getClassName(this.dynamicUIStack[i]) === cc.js.getClassName(uiClass)) {
                return this.dynamicUIStack[i];
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

    public showTips(uiClass, data: any) {
        this.openUIClass(uiClass, ViewZOrder.Tips, null, null, data);
    }

    public showPopup(ui, data?: any, showCallback?, closeCallback?) {
        if (ui instanceof cc.Node) {
            this.openUINode(ui, ViewZOrder.Popup, showCallback, data);
        } else {
            this.openUIClass(ui, ViewZOrder.Popup, showCallback, null, data, closeCallback);
        }
    }


    public showNotice(ui, data?: any, callback?: Function) {
        this.openUIClass(ui, ViewZOrder.Notice, callback, null, data);

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


    public registerUIPrefab(path: string) {
        let infos = [];
        cc.resources.getDirWithPath(path, cc.Prefab, infos);
        infos.forEach((info) => {
            let splitPathArr = (info.path as string).split('/')
            cc.log("splitPathArr", splitPathArr)
            if (splitPathArr.length > 0) {
                let lastPath = splitPathArr.slice(-1)
                if (lastPath.length > 0) {
                    let prefabPath = this.uiPrefabNameAndPathMap.get(lastPath[0]);
                    if (prefabPath) {
                        cc.error(`已经存在${lastPath[0]},prefabPath = ${prefabPath}`);
                        return;
                    }
                    this.uiPrefabNameAndPathMap.set(lastPath[0], info.path);
                } else {
                    cc.error("lastPath length is zero")
                }
            } else {
                cc.error("splitPathArr length is zero")
            }
        })
    }
}