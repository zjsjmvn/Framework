import { Prefab, director, error, instantiate, js, resources, log, Node, Label, isValid, warn, AssetManager } from 'cc';
import { singleton } from '../../utils/decorator/singleton';
import UIBase from './ui-base';
import UIPopup from './ui-popup';


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
/**
 * 弹窗缓存模式
 */
enum CacheMode {
    /** 一次性的（立即销毁节点，预制体资源随即释放） */
    Once = 1,
    /** 正常的（立即销毁节点，但是缓存预制体资源） */
    Normal,
    /** 频繁的（只关闭节点，且缓存预制体资源） */
    Frequent
}


class PopupParams {
    /** 缓存模式 */
    mode?: CacheMode = CacheMode.Normal;
    /** 优先级（优先级大的优先展示） */
    priority?: number = 0;
    /** 立刻展示（将会挂起当前展示中的弹窗） */
    immediately?: boolean = false;
    /**
     * @description 是否挂起当前,比如展示loading的时候就不要挂起。
     * @type {boolean}
     * @memberof PopupParams 
     */
    suspendCurrent?: boolean = true;
}
class PopupDataBundle {
    /** 弹窗选项 */
    uiClass: any;

    data: any;
    /** 缓存模式 */
    params: PopupParams;
    /** 弹窗节点 */
    node?: Node;

    zOrder: ViewZOrder = ViewZOrder.Popup;
}

/**
 * 考虑缓存的问题。
 */
@singleton
export default class UIManager {
    public static instance: UIManager;

    /**
     * @description  当前弹窗
     * @readonly
     * @memberof UIManager
     */
    public get currentShowingPopup() {
        return this._currentShowingPopup;
    }
    private _currentShowingPopup: PopupDataBundle = null;

    /**
     * @description 正在显示的ui栈，可能ui会叠好几层
     * @private
     * @type {PopupDataBundle[]}
     * @memberof UIManager
     */
    private showingUIStack: PopupDataBundle[] = [];

    /**
     * @description 等待队列
     * @readonly
     * @memberof UIManager
     */
    public get waitingQueue() {
        return this._waitingQueue;
    }
    private _waitingQueue: PopupDataBundle[] = [];


    /**
     * @description 被挂起的弹窗队列
     * @readonly
     * @memberof UIManager
     */
    public get suspendedQueue() {
        return this._suspendedQueue;
    }
    private _suspendedQueue: PopupDataBundle[] = [];

    /**
     * @description 缓存的ui，如果ui标记needCache那么就会在存到这里。
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private cachedUI: Map<string, UIBase> = new Map();

    /**
     * @description 扫描到的弹框预制体都放在这里。
     * @private
     * @type {Map<string, string>}
     * @memberof UIManager
     */
    private uiPrefabNameAndPathMap: Map<string, { path: string, bundle: AssetManager.Bundle }> = new Map();

    public closeAllUI() {
        // if (this.showingUIStack.length == 0) {
        //     return;
        // }
        // while (this.showingUIStack.length > 0) {
        //     this.closeUI(this.showingUIStack[0]);
        // }
        // while (this._suspendedQueue.length > 0) {
        //     //@ts-ignore
        //     this.closeUI(this._suspendedQueue[0].node.getComponent(UIBase));
        // }
        // this._queue = [];
    }

    public async showTips(uiClass, data: any) {
        let initUI = (uiInstance: UIBase) => {
            if (!uiInstance) {
                console.error(`${js.getClassName(uiClass)}没有绑定UI脚本!!!`);
                return;
            }
            let uiRoot = director.getScene().getChildByName('Canvas');
            if (!uiRoot) {
                console.error(`当前场景没有${director.getScene().name}Canvas!!!`);
                return;
            }
            uiInstance.node.parent = uiRoot;
            uiInstance.init(data);
            uiInstance.node.setSiblingIndex(ViewZOrder.Tips as number);
            uiInstance.show();
        }
        let pathAndBundle = this.uiPrefabNameAndPathMap.get(js.getClassName(uiClass));
        if (!pathAndBundle) {
            error(`没有找到uiClass = ${js.getClassName(uiClass)}对应的预制体路径`)
            return;
        }
        let prefab = await this.loadPrefab(pathAndBundle.path, pathAndBundle.bundle);
        let node = instantiate(prefab);
        //@ts-ignore
        let uiInstance = node.getComponent(UIBase);
        // this._currentShowingPopup.node = node;
        initUI(uiInstance);
    }

    //#region popup

    public async showPopup(ui, data?: any, params?: PopupParams) {
        if (ui instanceof Node) {
            await this.openNodeTypePopup(ui, data);
        } else {
            let bundle = this.generatePopupDataBundle(ui, data, null, ViewZOrder.Popup, params);
            await this.openClassTypePopup(bundle);
        }
    }

    public closePopupByClass<T extends UIBase>(uiClass: { new(): T }) {
        // for (let i = 0; i < this.showingUIStack.length; ++i) {
        //     if (js.getClassName(this.showingUIStack[i]) === js.getClassName(uiClass)) {
        //         if (isValid(this.showingUIStack[i].node)) {
        //             this.showingUIStack[i].close();
        //             // return this.closeUI(this.dynamicUIStack[i]);
        //         }
        //         this.showingUIStack.splice(i, 1);
        //         return;
        //     }
        // }
    }

    /**
     * @description 按节点打开，传过来要打开的弹窗的节点，然后控制其显示关闭
     * @param {Node} uiNode
     * @param {number} [zOrder=ViewZOrder.UI]
     * @param {Function} [callback]
     * @memberof UIManager
     */
    public async openNodeTypePopup(uiNode: Node, data?: any) {
        if (!uiNode.active) {
            uiNode.active = true;
        }
        uiNode.setPosition(0, 0);
        //@ts-ignore
        uiNode.getComponent(UIBase).init(data);
        //@ts-ignore
        uiNode.getComponent(UIBase).show();
        return Promise.resolve();
    }

    private pushQueue(popupDataBundle: PopupDataBundle) {
        if (!this._currentShowingPopup) {
            this.openClassTypePopup(popupDataBundle);
            return;
        }
        // 加入队列
        this._waitingQueue.push(popupDataBundle);
        // 按照优先级从大到小排序
        this._waitingQueue.sort((a, b) => (b.params.priority - a.params.priority));
    }

    private showNextPopup() {
        if (this._currentShowingPopup || (this._suspendedQueue.length === 0 && this._waitingQueue.length === 0 && this.showingUIStack.length == 0)) {
            return;
        }
        let bundle: PopupDataBundle = null;
        if (this._suspendedQueue.length > 0) {
            bundle = this._suspendedQueue.shift();
        } else {
            bundle = this._waitingQueue.shift();
        }
        // 已有实例
        if (isValid(bundle.node)) {
            // 设为当前弹窗
            this._currentShowingPopup = bundle;
            // 直接展示
            //@ts-ignore
            bundle.node.getComponent(UIPopup).show();
            return;
        }
        // 加载并展示
        this.openClassTypePopup(bundle);
    }

    private async openClassTypePopup(popupDataBundle: PopupDataBundle): Promise<void> {
        return new Promise(async res => {
            if (this._currentShowingPopup) {
                // 是否立即强制展示
                if (popupDataBundle.params && popupDataBundle.params.immediately) {
                    if (popupDataBundle.params.suspendCurrent) {
                        await this.suspendCurrentPopup();
                    }
                } else {
                    // 将请求推入等待队列
                    this.pushQueue(popupDataBundle);
                    res();
                    return;
                }
            }
            this._currentShowingPopup = popupDataBundle;
            let initUI = (uiInstance: UIBase) => {
                if (!uiInstance) {
                    console.error(`${js.getClassName(popupDataBundle.uiClass)}没有绑定UI脚本!!!`);
                    return;
                }
                let uiRoot = director.getScene().getChildByName('Canvas');
                if (!uiRoot) {
                    console.error(`当前场景没有${director.getScene().name}Canvas!!!`);
                    return;
                }
                uiInstance.node.parent = uiRoot;
                uiInstance.node.setPosition(0, 0);
                uiInstance.init(popupDataBundle.data);
                uiInstance.node.setSiblingIndex(popupDataBundle.zOrder as number);
                uiInstance.show();
                this.showingUIStack.push(this._currentShowingPopup);
                res();
            }

            let uiInstance = this.getUIFromCachedMap(popupDataBundle.uiClass);
            let node = uiInstance?.node;
            if (!uiInstance) {
                let pathAndBundle = this.uiPrefabNameAndPathMap.get(js.getClassName(popupDataBundle.uiClass));
                if (!pathAndBundle) {
                    error(`没有找到uiClass = ${js.getClassName(popupDataBundle.uiClass)}对应的预制体路径`)
                    return;
                }
                let prefab = await this.loadPrefab(pathAndBundle.path, pathAndBundle.bundle);
                node = instantiate(prefab);
                //@ts-ignore
                uiInstance = node.getComponent(UIBase);
            }
            this._currentShowingPopup.node = node;
            initUI(uiInstance);
        });
    }

    private generatePopupDataBundle(uiClass, data, node, zOrder, params: PopupParams) {
        let bundle = new PopupDataBundle();
        bundle.data = data;
        bundle.uiClass = uiClass;
        bundle.zOrder = zOrder;
        bundle.node = node;
        bundle.params = params;
        if (bundle.params == undefined) {
            bundle.params = new PopupParams();
        }
        // 缓存模式
        if (bundle.params.mode == undefined) {
            bundle.params.mode = CacheMode.Normal;
        }
        // 优先级
        if (bundle.params.priority == undefined) {
            bundle.params.priority = 0;
        }
        // 立刻展示
        if (bundle.params.immediately == undefined) {
            bundle.params.immediately = false;
        }
        // 是否隐藏当前ui
        if (bundle.params.suspendCurrent == undefined) {
            bundle.params.suspendCurrent = true;
        }
        return bundle;
    }

    public getUIFromCachedMap<T extends UIBase>(uiClass: { new(): T }): T {
        let ui = null;
        let uiName = js.getClassName(uiClass);
        if (this.cachedUI.has(uiName)) {
            ui = this.cachedUI.get(uiName);
        }
        return ui;
    }

    private setUIToCachedMap(ui: UIBase) {
        let uiName = js.getClassName(ui);
        if (this.cachedUI.has(uiName)) {
            ui.node.destroy();
            return;
        } else {
            ui.node.removeFromParent();
            this.cachedUI.set(uiName, ui);
        }
    }
    /**
     * 挂起当前展示中的弹窗
     */
    private async suspendCurrentPopup() {
        if (!this._currentShowingPopup) {
            return;
        }
        // 从showingStack移除
        let index = this.showingUIStack.findIndex((x) => {
            return x == this._currentShowingPopup
        })
        if (index >= 0) {
            this.showingUIStack.splice(index, 1);
        }
        // 将当前弹窗推入挂起队列
        this._suspendedQueue.unshift(this._currentShowingPopup);
        // @ts-ignore
        await this._currentShowingPopup.node.getComponent(UIPopup).onSuspended();
        // 关闭当前弹窗（挂起）
        // @ts-ignore
        await this._currentShowingPopup.node.getComponent(UIPopup).hide();
        // 置空当前
        this._currentShowingPopup = null;
    }

    // 恢复挂起的弹窗
    public async resumeSuspendPopup() {
        if (this._suspendedQueue.length <= 0) {
            return;
        }
        let bundle = this._suspendedQueue.shift();
        // @ts-ignore
        await bundle.node.getComponent(UIPopup).onResume();
        // @ts-ignore
        await bundle.node.getComponent(UIPopup).show();
        this._currentShowingPopup = bundle;
        this.showingUIStack.push(this._currentShowingPopup);
    }


    public async closePopup(ui: UIPopup | Node): Promise<void> {
        //节点类型就是在场景中直接存在的
        if (ui instanceof Node) {
            //@ts-ignore
            //node一般都属于弹框里的弹框，不能销毁。否则没办法再次显示了
            await ui.getComponent(UIBase).hide();
            return Promise.resolve();
        } else {
            let clear = (arr) => {
                let index = arr.findIndex((bundle: PopupDataBundle) => {
                    //@ts-ignore
                    return bundle.node?.getComponent(UIPopup) == ui;
                })
                if (index >= 0) {
                    return arr.splice(index, 1);
                }
                return null;
            }
            // 清理栈  // 清理等待队列   // 清理挂起队列
            clear(this.showingUIStack) || clear(this._waitingQueue) || clear(this._suspendedQueue);
            if (isValid(ui)) {
                //@ts-ignore           
                if (this._currentShowingPopup.node.getComponent(UIPopup) == ui) {
                    this._currentShowingPopup = null;
                    log('this._currentShowingPopup set to  null')
                }
                await ui.close();
                this.showNextPopup();
                if (ui.needCache) {
                    this.setUIToCachedMap(ui);
                }
                return Promise.resolve();
            } else {
                error("ui is not available");
            }
        }
    }
    // public async suspendCurrentP



    //#endregion




    /**
    //  * @description 暂时先这样用。
    //  * @param {(UITips | Node)} ui
    //  * @return {*}  {Promise<void>}
    //  * @memberof UIManager
    //  */
    // public async closeTip(ui: UITips | Node): Promise<void> {
    //     if (ui instanceof Node) {
    //         //@ts-ignore
    //         //node一般都属于弹框里的弹框，不能销毁。否则没办法再次显示了
    //         await ui.getComponent(UITips).hide();
    //     } else {
    //         ui.close();
    //     }
    //     return Promise.resolve();
    // }




    /**
     * @description
     * @param {(UIBase | Node)} ui
     * @return {*}  {Promise<boolean>}
     * @memberof UIManager
     * @deprecated
     */
    public async closeUI(ui: UIBase | Node): Promise<boolean> {
        //节点类型就是在场景中直接存在的
        if (ui instanceof Node) {
            //@ts-ignore
            //node一般都属于弹框里的弹框，不能销毁。否则没办法再次显示了
            await ui.getComponent(UIBase).hide();
            return Promise.resolve(true);
        } else {
            // 不在uiStack的ui都是由节点自己管理。
            let index = this.showingUIStack.indexOf(ui);
            if (index < 0) {
                // 判断是否在队列

                // 判断是否挂起


                await ui.hide();
                return Promise.resolve(true);
            } else {
                if (index >= 0) {
                    this.showingUIStack.splice(index, 1);
                }
                if (isValid(ui)) {
                    if (ui.needCache) {
                        await ui.hide();
                        this.setUIToCachedMap(ui);
                        return Promise.resolve(true);
                    } else {
                        await ui.close();
                        this._currentShowingPopup = null;
                        this.showNextPopup();
                        return Promise.resolve(true);
                    }
                }
            }
        }
    }



    /**
     * @description 扫描弹窗预制体
     * @param {string} path
     * @memberof UIManager
     */
    public registerUIPrefab(path: string, bundle?: AssetManager.Bundle) {
        let infos = [];

        if (bundle) {
            bundle.getDirWithPath(path, Prefab, infos);
        } else {
            resources.getDirWithPath(path, Prefab, infos);
        }
        log('infos', path, infos);
        infos.forEach((info) => {
            let splitPathArr = (info.path as string).split('/')
            log("splitPathArr", splitPathArr)
            if (splitPathArr.length > 0) {
                let lastPath = splitPathArr.slice(-1)
                if (lastPath.length > 0) {
                    let prefabPath = this.uiPrefabNameAndPathMap.get(lastPath[0]);
                    if (prefabPath?.path) {
                        error(`已经存在${lastPath[0]},prefabPath = ${prefabPath.path}`);
                        return;
                    }
                    if (bundle) {
                        this.uiPrefabNameAndPathMap.set(lastPath[0], { path: info.path, bundle: bundle });
                    } else {
                        this.uiPrefabNameAndPathMap.set(lastPath[0], { path: info.path, bundle: resources });
                    }
                } else {
                    error("lastPath length is zero")
                }
            } else {
                error("splitPathArr length is zero")
            }
        })
    }

    private loadPrefab(path: string, bundle): Promise<Prefab> {
        return new Promise(res => {
            bundle.load(path, (error, prefab: Prefab) => {
                if (error) {
                    console.error(`UIManager loadPrefab error: ${error}`);
                    return;
                }
                res(prefab);
            });
        });
    }


}



