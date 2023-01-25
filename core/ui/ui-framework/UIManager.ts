import { singleton } from '../../Utils/Decorator/Singleton';
import UIBase from './UIBase';
import { Prefab, director, error, instantiate, js, resources, log, Node, Label, isValid } from 'cc';

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

/**
 * 弹窗请求结果类型
 */
enum ShowResultType {
    /** 展示成功（已关闭） */
    Done = 1,
    /** 展示失败（加载失败） */
    Failed,
    /** 等待中（已加入等待队列） */
    Waiting
}
class PopupParams {
    /** 缓存模式 */
    mode?: CacheMode = CacheMode.Normal;
    /** 优先级（优先级大的优先展示） */
    priority?: number = 0;
    /** 立刻展示（将会挂起当前展示中的弹窗） */
    immediately?: boolean = false;
}
class PopupRequest {
    /** 弹窗选项 */
    uiClass: any;
    /**
     * @description 数据
     * @type {*}
     * @memberof PopupRequest
     */
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
     * @description 动态ui栈放的是动态加载的ui
     * @private
     * @type {UIBase[]}
     * @memberof UIManager
     */
    private dynamicUIStack: UIBase[] = [];

    /**
     * @description 静态ui栈，放的是静态ui，比如弹框里的弹框，就没必要在分出去预制体了,否则太乱。
     * @private
     * @type {Node[]}
     * @memberof UIManager
     */
    private staticUIStack: Node[] = [];

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
    private uiPrefabNameAndPathMap: Map<string, string> = new Map();

    /**
        * 当前弹窗请求
        */
    public get current() {
        return this._current;
    }
    private _current: PopupRequest = null;

    /**
     * 等待队列
     */
    public get queue() {
        return this._queue;
    }
    private _queue: PopupRequest[] = [];

    /**
     * 被挂起的弹窗队列
     */
    public get suspended() {
        return this._suspended;
    }
    private _suspended: PopupRequest[] = [];

    /**
     * 锁定状态
     */
    private locked: boolean = false;

    /**
     * 连续展示弹窗的时间间隔（秒）
     */
    public interval: number = 0.05;

    public async openUIClass<T extends UIBase>(uiClass: { new(): T }, zOrder: ViewZOrder = ViewZOrder.UI, data?: any, params?: PopupParams): Promise<ShowResultType> {
        return new Promise(async res => {
            console.log("================================ ")
            if (this._current) {
                // 是否立即强制展示
                if (params && params.immediately) {
                    // this.locked = false;
                    await this.suspend();
                } else {
                    // 将请求推入等待队列
                    this.push(uiClass, zOrder, data, params);
                    res(ShowResultType.Waiting);
                    return;
                }
            }
            // 保存为当前弹窗，阻止新的弹窗请求
            this._current = { uiClass, data: data, params, zOrder };

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
                uiInstance.node.setPosition(0, 0);
                uiInstance.init(data);
                uiInstance.node.setSiblingIndex(zOrder);
                uiInstance.show();
                this.dynamicUIStack.push(uiInstance);
                res(ShowResultType.Done);
            }

            let uiInstance = this.getUIFromCachedMap(uiClass);
            let node = uiInstance?.node;
            if (!uiInstance) {
                let path = this.uiPrefabNameAndPathMap.get(js.getClassName(uiClass));
                if (!path) {
                    error(`没有找到uiClass = ${js.getClassName(uiClass)}对应的预制体路径`)
                    return;
                }
                let prefab = await this.load(path);
                node = instantiate(prefab);
                uiInstance = node.getComponent(UIBase);
            }
            this._current.node = node;
            initUI(uiInstance);
        });
    }
    /**
     * 挂起当前展示中的弹窗
     */
    private async suspend() {
        console.log("Suspending...");
        if (!this._current) {
            return;
        }
        const request = this._current;
        // 将当前弹窗推入挂起队列
        this._suspended.push(request);
        // @ts-ignore
        await request.node.getComponent(UIBase).onSuspended();
        // 关闭当前弹窗（挂起）
        await request.node.getComponent(UIBase).hide();
        // 置空当前
        this._current = null;
    }

    /**
     * 加载并缓存弹窗预制体资源
     * @param path 弹窗路径
     */
    public load(path: string): Promise<Prefab> {
        return new Promise(res => {
            resources.load(path, (error, prefab: Prefab) => {
                if (error) {
                    console.error(`UIManager OpenUI: load ui error: ${error}`);
                    return;
                }
                res(prefab);
            });
        });
    }

    private push(uiClass, zOrder, data?: any, params?: PopupParams) {
        // 直接展示

        if (!this._current && !this.locked) {
            this.openUIClass(uiClass, zOrder, data, params);
            return;
        }
        // 加入队列
        this._queue.push({ uiClass, data, params, zOrder });
        // 按照优先级从小到大排序
        this._queue.sort((a, b) => (a.params.priority - b.params.priority));
    }

    /**
     * 展示挂起或等待队列中的下一个弹窗
     */
    private next() {
        console.log("next")
        if (this._current || (this._suspended.length === 0 && this._queue.length === 0)) {
            return;
        }
        let request: PopupRequest = null;
        if (this._suspended.length > 0) {
            request = this._suspended.shift();
        } else {
            request = this._queue.shift();
        }
        // 解除锁定
        this.locked = false;
        // 已有实例
        if (isValid(request.node)) {
            // 设为当前弹窗
            this._current = request;
            // 直接展示
            request.node.getComponent(UIBase).show();
            return;
        }
        // 加载并展示
        this.openUIClass(request.uiClass, request.zOrder, request.data, request.params);
    }

    /**
     * @description 按节点打开，传过来要打开的弹窗的节点，然后控制其显示关闭
     * @param {Node} uiNode
     * @param {number} [zOrder=ViewZOrder.UI]
     * @param {Function} [callback]
     * @memberof UIManager
     */
    public async openUINode(uiNode: Node, data?: any, zOrder: number = ViewZOrder.UI) {
        if (!uiNode.active) {
            uiNode.active = true;
        }
        uiNode.setPosition(0, 0);
        uiNode.setSiblingIndex(zOrder);
        uiNode.getComponent(UIBase).init(data);
        await uiNode.getComponent(UIBase).beforeShow();
        uiNode.getComponent(UIBase).show();
        uiNode.getComponent(UIBase).afterShow();
        this.staticUIStack.push(uiNode);
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
            return;
        } else {
            this.cachedUI.set(uiName, ui);
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

    public hideUI(uiClass: { new(): UIBase }) {
        let ui = this.getUI(uiClass);
        if (ui) {
            ui.node.active = false;
        }
    }

    public hasUI(uiClass: { new(): UIBase }): boolean {
        let uiName = js.getClassName(uiClass);
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (js.getClassName(this.dynamicUIStack[i]) == uiName) {
                return true;
            }
        }
        return false;
    }

    public getUI<T extends UIBase>(uiClass: { new(): T }): T {
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (js.getClassName(this.dynamicUIStack[i]) === js.getClassName(uiClass)) {
                return this.dynamicUIStack[i];
            }
        }
        return null;
    }

    public isShowing(uiClass: { new(): UIBase }) {
        let ui = this.getUI(uiClass);
        if (!ui) {
            return false;
        }
        return ui.node.active;
    }

    public isShowingAnyUI() {
        return this.dynamicUIStack.length > 0
    }

    // public showTips(uiClass, data: any) {
    //     this.openUIClass(uiClass, ViewZOrder.Tips, null, null, data);
    // }

    public async showPopup(ui, data?: any, params?: PopupParams) {
        if (ui instanceof Node) {
            this.openUINode(ui, data, ViewZOrder.Popup);
        } else {
            await this.openUIClass(ui, ViewZOrder.Popup, data, params);
        }
    }



    public closeUIByUIClass<T extends UIBase>(uiClass: { new(): T }) {
        for (let i = 0; i < this.dynamicUIStack.length; ++i) {
            if (js.getClassName(this.dynamicUIStack[i]) === js.getClassName(uiClass)) {
                if (isValid(this.dynamicUIStack[i].node)) {
                    this.dynamicUIStack[i].close();
                    // return this.closeUI(this.dynamicUIStack[i]);
                }
                this.dynamicUIStack.splice(i, 1);
                return;
            }
        }
    }

    public async closeUI(ui: UIBase | Node): Promise<boolean> {
        //节点类型就是在场景中直接存在的
        if (ui instanceof Node) {
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
                if (isValid(ui)) {
                    if (ui.needCache) {
                        await ui.hide();
                        this.setUIToCachedMap(ui);
                        return Promise.resolve(true);
                    } else {
                        await ui.close();
                        this._current = null;
                        this.next();
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
    public registerUIPrefab(path: string) {
        let infos = [];
        resources.getDirWithPath(path, Prefab, infos);
        log('infos', infos);
        infos.forEach((info) => {
            let splitPathArr = (info.path as string).split('/')
            log("splitPathArr", splitPathArr)
            if (splitPathArr.length > 0) {
                let lastPath = splitPathArr.slice(-1)
                if (lastPath.length > 0) {
                    let prefabPath = this.uiPrefabNameAndPathMap.get(lastPath[0]);
                    if (prefabPath) {
                        error(`已经存在${lastPath[0]},prefabPath = ${prefabPath}`);
                        return;
                    }
                    this.uiPrefabNameAndPathMap.set(lastPath[0], info.path);
                } else {
                    error("lastPath length is zero")
                }
            } else {
                error("splitPathArr length is zero")
            }
        })
    }
}