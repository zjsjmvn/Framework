import { Prefab, director, error, instantiate, js, resources, Node, isValid, AssetManager, Vec3, Color } from 'cc';
import { singleton } from '../../utils/decorator/singleton';
import UIBase from './ui-base';
import UIPopup from './ui-popup';
import UITips from './ui-tips';
import { resLoader } from '../../utils/res-loader';

export class ViewZOrder {
    public static readonly Scene = 20;
    public static readonly MenuPanel = 80;
    public static readonly UI = 100;
    public static readonly Popup = 200;
    public static readonly Tips = 300;
    public static readonly Guide = 400;
    public static readonly Notice = 500;
    public static readonly Loading = 600;
}
export enum CacheMode {
    /** Destroy the node and release its prefab after deferred node destruction. */
    Once = 1,
    /** Destroy the node and retain its prefab. */
    Normal,
    /** Hide and detach the instance, retaining it and its prefab. */
    Frequent,
}
export class PopupParams {
    mode?: CacheMode = CacheMode.Normal;
    priority?: number = 0;
    immediately?: boolean = true;
    suspendCurrent?: boolean = false;
    parent?: Node;
    /** Rechecked after loading and lifecycle awaits. */
    isValid?: () => boolean;
}
export class PopupCancelledError extends Error {
    public constructor(name: string) {
        super('Popup request was cancelled: ' + name);
        this.name = 'PopupCancelledError';
    }
}
type PopupClass<T extends UIPopup<any> = UIPopup<any>> = new () => T;
type PopupPrefab = {
    name: string;
    promise: Promise<Prefab>;
    asset: Prefab | null;
    requests: Set<PopupDataBundle>;
    nodes: Set<Node>;
    keep: boolean;
    releasing: boolean;
};
export class PopupDataBundle {
    uiClass: PopupClass;
    data: any;
    params: PopupParams;
    node?: Node;
    zOrder: ViewZOrder = ViewZOrder.Popup;
    instance?: UIPopup<any>;
    prefab?: PopupPrefab;
    mode: CacheMode;
    explicitMode = false;
    cancelled = false;
    initialized = false;
    opened = false;
    settled = false;
    resolve: (popup: UIPopup<any>) => void;
    reject: (failure: unknown) => void;
    closing?: Promise<void>;
}

/** Popup requests, queue entries and prefab ownership share one lifecycle. */
@singleton
export default class UIManager {
    public static instance: UIManager;
    private _currentShowingPopup: PopupDataBundle = null;
    private showingUIStack: PopupDataBundle[] = [];
    private _waitingQueue: PopupDataBundle[] = [];
    private _suspendedQueue: PopupDataBundle[] = [];
    private cachedUI: Map<string, UIBase> = new Map();
    private uiPrefabNameAndPathMap = new Map<string, { path: string; bundle: AssetManager.Bundle }>();
    private popupPrefabs = new Map<string, PopupPrefab>();
    private popupRequests = new Set<PopupDataBundle>();
    public get currentShowingPopup() { return this._currentShowingPopup; }
    public get waitingQueue() { return this._waitingQueue; }
    public get suspendedQueue() { return this._suspendedQueue; }

    public showPopup<T extends UIPopup<any>>(uiClass: PopupClass<T>, data?: Parameters<T['init']>[0], params?: PopupParams): Promise<T>;
    public showPopup<T>(node: Node, data?: T, params?: PopupParams): Promise<UIPopup<any>>;
    public showPopup(uiClass: PopupClass | Node, data?: any, params?: PopupParams): Promise<UIPopup<any>> {
        if (uiClass instanceof Node) return this.openNodeTypePopup(uiClass, data);
        const bundle = new PopupDataBundle();
        bundle.uiClass = uiClass;
        bundle.data = data;
        bundle.explicitMode = params?.mode !== undefined;
        bundle.params = Object.assign(new PopupParams(), params);
        bundle.mode = bundle.params.mode;
        const result = new Promise<UIPopup<any>>((resolve, reject) => {
            bundle.resolve = resolve;
            bundle.reject = reject;
        });
        this.popupRequests.add(bundle);
        void this.openClassTypePopup(bundle);
        return result;
    }

    /** Uses the same prefab cache as showPopup. */
    public preloadPopup<T extends UIPopup<any>>(uiClass: PopupClass<T>): Promise<Prefab> {
        try { return this.getPopupPrefab(uiClass, false).promise; }
        catch (failure) { return Promise.reject(failure); }
    }

    public isPopupReady<T extends UIPopup<any>>(uiClass: PopupClass<T>): boolean {
        const prefab = this.popupPrefabs.get(js.getClassName(uiClass));
        return Boolean(prefab && !prefab.releasing && isValid(prefab.asset));
    }

    public async closePopupByClass<T extends UIBase>(uiClass: new () => T): Promise<void> {
        const bundles = Array.from(this.popupRequests).filter(bundle => (bundle.uiClass as Function) === uiClass);
        for (const bundle of bundles) this.cancelRequest(bundle);
        await Promise.all(bundles.map(bundle => this.closeBundle(bundle)));
    }

    /** Cancel all class requests and release its cached instance and prefab. */
    public async releasePopup<T extends UIPopup<any>>(uiClass: PopupClass<T>): Promise<void> {
        const name = js.getClassName(uiClass);
        const prefab = this.popupPrefabs.get(name);
        if (prefab) {
            this.popupPrefabs.delete(name);
            prefab.keep = false;
            prefab.releasing = true;
        }
        const cached = this.cachedUI.get(name);
        this.cachedUI.delete(name);
        if (isValid(cached?.node, true)) this.destroyNode(cached.node);
        try { await this.closePopupByClass(uiClass); }
        finally { if (prefab) this.finishPrefabRelease(prefab); }
    }

    public async closeAllUI(): Promise<void> {
        const bundles = Array.from(this.popupRequests);
        // Cancel the entire queue before a close can advance it.
        for (const bundle of bundles) this.cancelRequest(bundle);
        await Promise.all(bundles.map(bundle => this.closeBundle(bundle)));
    }

    public async openNodeTypePopup(node: Node, data?: any): Promise<UIPopup<any>> {
        const popup = node.getComponent(UIPopup);
        if (!popup) throw new Error('Node has no UIPopup component: ' + node.name);
        node.active = true;
        node.setPosition(0, 0);
        popup.init(data);
        await popup.show();
        return popup;
    }

    private validRequest(bundle: PopupDataBundle): boolean {
        if (bundle.cancelled || !this.popupRequests.has(bundle)) return false;
        if (bundle.params.parent && !isValid(bundle.params.parent, true)) return false;
        return !bundle.params.isValid || bundle.params.isValid();
    }
    private assertRequest(bundle: PopupDataBundle): void {
        if (!this.validRequest(bundle)) throw new PopupCancelledError(js.getClassName(bundle.uiClass));
    }

    private async openClassTypePopup(bundle: PopupDataBundle): Promise<void> {
        try {
            this.assertRequest(bundle);
            if (this._currentShowingPopup && !bundle.params.immediately) {
                this._waitingQueue.push(bundle);
                this._waitingQueue.sort((a, b) => b.params.priority - a.params.priority);
                return;
            }
            if (this._currentShowingPopup && bundle.params.suspendCurrent) {
                const suspension = this.suspendCurrentPopup();
                // Reserve the incoming request while suspension hooks await.
                this._currentShowingPopup = bundle;
                await suspension;
            }
            this.assertRequest(bundle);
            this.showingUIStack.push(bundle);
            this._currentShowingPopup = bundle;
            let popup = this.getUIFromCachedMap(bundle.uiClass) as UIPopup<any>;
            if (popup) bundle.prefab = this.popupPrefabs.get(js.getClassName(bundle.uiClass));
            if (!popup) {
                const prefab = this.getPopupPrefab(bundle.uiClass, bundle.mode !== CacheMode.Once);
                bundle.prefab = prefab;
                prefab.requests.add(bundle);
                const asset = await prefab.promise;
                this.assertRequest(bundle);
                const node = instantiate(asset);
                bundle.node = node;
                this.trackPopupNode(node, prefab);
                prefab.requests.delete(bundle);
                popup = node.getComponent(bundle.uiClass);
                if (!popup) throw new Error('Prefab has no matching UIPopup component: ' + js.getClassName(bundle.uiClass));
            }
            bundle.instance = popup;
            bundle.node = popup.node;
            if (!bundle.explicitMode && popup.needCache) bundle.mode = CacheMode.Frequent;
            popup.needCache = bundle.mode === CacheMode.Frequent;
            const parent = bundle.params.parent ?? director.getScene()?.getChildByName('Canvas');
            if (!isValid(parent, true)) throw new Error('Popup parent Canvas is missing');
            this.assertRequest(bundle);
            parent.addChild(popup.node);
            popup.node.setPosition(0, 0);
            popup.node.setSiblingIndex(bundle.zOrder as number);
            bundle.initialized = true;
            popup.init(bundle.data);
            this.assertRequest(bundle);
            await popup.show();
            this.assertRequest(bundle);
            bundle.opened = true;
            bundle.settled = true;
            bundle.resolve(popup);
        } catch (failure) {
            if (!bundle.settled) { bundle.settled = true; bundle.reject(failure); }
            await this.closeBundle(bundle).catch(closeFailure => error(closeFailure));
        }
    }

    public getUIFromCachedMap<T extends UIBase>(uiClass: new () => T): T {
        const name = js.getClassName(uiClass);
        const popup = this.cachedUI.get(name);
        this.cachedUI.delete(name);
        return isValid(popup?.node, true) ? popup as T : null;
    }
    private setUIToCachedMap(bundle: PopupDataBundle): void {
        const name = js.getClassName(bundle.uiClass);
        const existing = this.cachedUI.get(name);
        if (isValid(existing?.node, true) && existing !== bundle.instance) {
            this.destroyNode(bundle.node);
            return;
        }
        bundle.node.active = false;
        bundle.node.removeFromParent();
        this.cachedUI.set(name, bundle.instance);
    }
    private cancelRequest(bundle: PopupDataBundle): void {
        bundle.cancelled = true;
        this.removeBundle(bundle);
        if (!bundle.settled) {
            bundle.settled = true;
            bundle.reject(new PopupCancelledError(js.getClassName(bundle.uiClass)));
        }
    }
    private removeBundle(bundle: PopupDataBundle): void {
        for (const queue of [this.showingUIStack, this._waitingQueue, this._suspendedQueue]) {
            const index = queue.indexOf(bundle);
            if (index >= 0) queue.splice(index, 1);
        }
        if (this._currentShowingPopup === bundle) this._currentShowingPopup = null;
    }

    public closePopup(ui: UIPopup<any> | Node): Promise<void> {
        if (ui instanceof Node) return Promise.resolve(ui.getComponent(UIBase)?.hide());
        const bundle = Array.from(this.popupRequests).find(candidate => candidate.instance === ui);
        return bundle ? this.closeBundle(bundle) : Promise.resolve();
    }
    private closeBundle(bundle: PopupDataBundle): Promise<void> {
        if (bundle.closing) return bundle.closing;
        this.cancelRequest(bundle);
        const close = async () => {
            try {
                if (bundle.initialized && isValid(bundle.instance?.node, true)) {
                    const node = bundle.instance.node;
                    let destroyed: () => void;
                    const destruction = new Promise<void>(resolve => {
                        destroyed = resolve;
                        node.once(Node.EventType.NODE_DESTROYED, destroyed);
                    });
                    try { await Promise.race([bundle.instance.close(), destruction]); }
                    finally { if (isValid(node)) node.off(Node.EventType.NODE_DESTROYED, destroyed); }
                }
            }
            finally {
                if (isValid(bundle.node)) {
                    if (isValid(bundle.node, true) && bundle.opened && bundle.mode === CacheMode.Frequent && !bundle.prefab?.releasing) this.setUIToCachedMap(bundle);
                    else this.destroyNode(bundle.node);
                }
                this.popupRequests.delete(bundle);
                if (bundle.prefab) {
                    bundle.prefab.requests.delete(bundle);
                    this.finishPrefabRelease(bundle.prefab);
                }
                await this.showNextPopup();
            }
        };
        bundle.closing = close();
        return bundle.closing;
    }

    private async suspendCurrentPopup(): Promise<void> {
        const bundle = this._currentShowingPopup;
        if (!bundle) return;
        if (!bundle.opened) {
            this.cancelRequest(bundle);
            void this.closeBundle(bundle);
            return;
        }
        this.removeBundle(bundle);
        this._suspendedQueue.unshift(bundle);
        await bundle.instance['onSuspended']();
        if (!this.validRequest(bundle)) return;
        await bundle.instance.hide();
    }
    public async resumeSuspendPopup(): Promise<void> {
        if (!this._currentShowingPopup) await this.showNextPopup();
    }
    private async showNextPopup(): Promise<void> {
        if (this._currentShowingPopup) return;
        while (this._suspendedQueue.length) {
            const bundle = this._suspendedQueue.shift();
            if (!this.validRequest(bundle) || !isValid(bundle.node, true)) {
                await this.closeBundle(bundle);
                return;
            }
            this._currentShowingPopup = bundle;
            this.showingUIStack.push(bundle);
            try {
                await bundle.instance['onResume']();
                this.assertRequest(bundle);
                await bundle.instance.show();
                this.assertRequest(bundle);
                return;
            } catch (failure) { await this.closeBundle(bundle); return; }
        }
        if (this.showingUIStack.length) {
            this._currentShowingPopup = this.showingUIStack[this.showingUIStack.length - 1];
            return;
        }
        const next = this._waitingQueue.shift();
        if (next) void this.openClassTypePopup(next);
    }

    private getPopupPrefab(uiClass: PopupClass, keep: boolean): PopupPrefab {
        const name = js.getClassName(uiClass);
        const cached = this.popupPrefabs.get(name);
        if (cached && !cached.releasing && (!cached.asset || isValid(cached.asset))) {
            if (keep) cached.keep = true;
            return cached;
        }
        if (cached) {
            cached.keep = false;
            cached.releasing = true;
            this.finishPrefabRelease(cached);
        }
        const location = this.uiPrefabNameAndPathMap.get(name);
        if (!location) throw new Error('Popup prefab is not registered: ' + name);
        const entry: PopupPrefab = { name, promise: null, asset: null, requests: new Set(), nodes: new Set(), keep, releasing: false };
        entry.promise = this.loadPrefab(location.path, location.bundle).then(asset => {
            if (entry.releasing || this.popupPrefabs.get(name) !== entry) throw new PopupCancelledError(name);
            entry.asset = asset;
            asset.addRef();
            return asset;
        }).catch(failure => {
            if (this.popupPrefabs.get(name) === entry) this.popupPrefabs.delete(name);
            throw failure;
        });
        this.popupPrefabs.set(name, entry);
        return entry;
    }
    private trackPopupNode(node: Node, prefab: PopupPrefab): void {
        prefab.nodes.add(node);
        node.once(Node.EventType.NODE_DESTROYED, () => {
            prefab.nodes.delete(node);
            for (const bundle of Array.from(this.popupRequests)) {
                if (bundle.node !== node || bundle.cancelled) continue;
                this.cancelRequest(bundle);
                this.popupRequests.delete(bundle);
                void this.showNextPopup();
            }
            const cached = this.cachedUI.get(prefab.name);
            if (cached?.node === node) this.cachedUI.delete(prefab.name);
            this.finishPrefabRelease(prefab);
        });
    }
    private finishPrefabRelease(prefab: PopupPrefab): void {
        if ((!prefab.releasing && prefab.keep) || prefab.nodes.size || prefab.requests.size) return;
        prefab.releasing = true;
        if (this.popupPrefabs.get(prefab.name) === prefab) this.popupPrefabs.delete(prefab.name);
        if (prefab.asset) { prefab.asset.decRef(); prefab.asset = null; }
    }
    private destroyNode(node: Node): void {
        node.active = false;
        node.removeFromParent();
        node.destroy();
    }

    public async showTips<T>(uiClass: (new () => UITips<T>) | Node, data: T): Promise<void> {
        const location = this.uiPrefabNameAndPathMap.get(js.getClassName(uiClass));
        if (!location) { error('Tip prefab is not registered: ' + js.getClassName(uiClass)); return; }
        try {
            const prefab = await this.loadPrefab(location.path, location.bundle);
            const node = instantiate(prefab);
            const ui = node.getComponent(UIBase);
            const parent = director.getScene()?.getChildByName('Canvas');
            if (!ui || !parent) { node.destroy(); error('Tip component or Canvas is missing'); return; }
            parent.addChild(node);
            ui.init(data);
            node.setSiblingIndex(ViewZOrder.Tips as number);
            ui.show();
        } catch (failure) { error('showTips error: ' + failure); }
    }
    public async showPublicTip(uiClass: any, message: string, pos?: Vec3, labelColor?: Color,
        delayDuration?: number, opacityInDuration?: number, opacityOutDuration?: number): Promise<void> {
        void this.showTips(uiClass, { message, pos, labelColor, delayDuration, opacityInDuration, opacityOutDuration });
    }
    public async closeTip(ui: UITips<any> | Node): Promise<void> {
        if (ui instanceof Node) await ui.getComponent(UITips)?.hide();
        else await ui.close();
    }
    /** @deprecated Use closePopup or closeTip for managed UI. */
    public async closeUI(ui: UIBase | Node): Promise<boolean> {
        if (ui instanceof UIPopup) await this.closePopup(ui);
        else if (ui instanceof Node) await ui.getComponent(UIBase)?.hide();
        else await ui.hide();
        return true;
    }

    public registerUIPrefab(path: string, bundle: AssetManager.Bundle = resources): string[] {
        const infos = [];
        bundle.getDirWithPath(path, Prefab, infos);
        const names: string[] = [];
        for (const info of infos) {
            const name = (info.path as string).split('/').pop();
            const existing = this.uiPrefabNameAndPathMap.get(name);
            if (existing && (existing.path !== info.path || existing.bundle.name !== bundle.name)) {
                error('已经存在' + name + ',prefabPath = ' + existing.path);
                continue;
            }
            this.uiPrefabNameAndPathMap.set(name, { path: info.path, bundle });
            names.push(name);
        }
        return names;
    }
    private loadPrefab(path: string, bundle: AssetManager.Bundle): Promise<Prefab> {
        return resLoader.loadAsync(bundle.name, path, Prefab);
    }
}
