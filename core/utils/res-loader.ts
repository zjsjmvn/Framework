import { Asset, AssetManager, assetManager, Constructor, error, js, Prefab, resources } from "cc";

type ProgressCallback = (finished: number, total: number, item: AssetManager.RequestItem) => void;
type CompleteCallback<T = any> = (error: Error | null, data: T) => void;
type IRemoteOptions = { ext?: string; [key: string]: any };
type AssetType<T = Asset> = Constructor<T>;
type BundleCallback = (error: Error | null, bundle: AssetManager.Bundle | null) => void;

interface ILoadResArgs<T extends Asset> {
    bundle?: string;
    dir?: string;
    paths: string | string[];
    type: AssetType<T> | null;
    onProgress: ProgressCallback | null;
    onComplete: CompleteCallback<T> | null;
}

/** 游戏资管理 */
export class ResLoader {
    private readonly bundleLoads = new Map<string, BundleCallback[]>();
    private readonly resourceLoads = new WeakMap<AssetManager.Bundle, Map<string, ILoadResArgs<any>[]>>();
    private readonly assetTypes = new WeakMap<Function, number>();
    private nextAssetType = 0;

    /**
     * 加载远程资源
     * @param url           资源地址
     * @param options       资源参数，例：{ ext: ".png" }
     * @param onComplete    加载完成回调
     * @example
var opt: IRemoteOptions = { ext: ".png" };
var onComplete = (err: Error | null, data: ImageAsset) => {
    const texture = new Texture2D();
    texture.image = data;
    
    const spriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    
    var sprite = this.sprite.addComponent(Sprite);
    sprite.spriteFrame = spriteFrame;
}
oops.res.loadRemote<ImageAsset>(this.url, opt, onComplete);
     */
    loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    loadRemote<T extends Asset>(url: string, ...args: any): void {
        var options: IRemoteOptions | null = null;
        var onComplete: CompleteCallback<T> | null = null;
        if (args.length == 2) {
            options = args[0];
            onComplete = args[1];
        }
        else {
            onComplete = args[0];
        }
        assetManager.loadRemote<T>(url, options, onComplete);
    }

    /**
     * 加载资源包
     * @param url       资源地址
     * @param complete  完成事件
     * @param v         资源MD5版本号
     * @example
var serverUrl = "http://192.168.1.8:8080/";         // 服务器地址
var md5 = "8e5c0";                                  // Cocos Creator 构建后的MD5字符
await oops.res.loadBundle(serverUrl,md5);
     */
    loadBundle(url: string, v?: string): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>((resolve, reject) => {
            this.requestBundle(url, v, (err, bundle) => {
                if (err) reject(err);
                else resolve(bundle!);
            });
        });
    }

    /**
     * 加载一个资源
     * @param bundleName    远程包名
     * @param paths         资源路径
     * @param type          资源类型
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     * @example
oops.res.load("spine_path", sp.SkeletonData, (err: Error | null, sd: sp.SkeletonData) => {

});
     */
    load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(
        bundleName: string | string[],
        paths?: string | string[] | AssetType<T> | ProgressCallback | CompleteCallback | null,
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onProgress?: ProgressCallback | CompleteCallback | null,
        onComplete?: CompleteCallback | null,
    ) {
        let args: ILoadResArgs<T> | null = null;
        if (typeof paths === "string" || paths instanceof Array) {
            args = this.parseLoadResArgs(paths, type, onProgress, onComplete);
            args.bundle = bundleName as string;
        }
        else {
            args = this.parseLoadResArgs(bundleName, paths, type, onProgress);
        }
        this.loadByArgs(args);
    }

    /**
     * 加载文件夹中的资源
     * @param bundleName    远程包名
     * @param dir           文件夹名
     * @param type          资源类型
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     * @example
// 加载进度事件
var onProgressCallback = (finished: number, total: number, item: any) => {
    console.log("资源加载进度", finished, total);
}

// 加载完成事件
var onCompleteCallback = () => {
    console.log("资源加载完成");
}
oops.res.loadDir("game", onProgressCallback, onCompleteCallback);
     */
    loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(
        bundleName: string,
        dir?: string | AssetType<T> | ProgressCallback | CompleteCallback | null,
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onProgress?: ProgressCallback | CompleteCallback | null,
        onComplete?: CompleteCallback | null,
    ) {
        let args: ILoadResArgs<T> | null = null;
        if (typeof dir === "string") {
            args = this.parseLoadResArgs(dir, type, onProgress, onComplete);
            args.bundle = bundleName;
        }
        else {
            args = this.parseLoadResArgs(bundleName, dir, type, onProgress);
        }
        args.dir = args.paths as string;
        this.loadByArgs(args);
    }

    /** Load and deserialize one asset; shares pending requests with load(). */
    loadAsync<T extends Asset>(bundleName: string, path: string, type: AssetType<T> | null, onProgress?: ProgressCallback | null): Promise<T>;
    loadAsync<T extends Asset>(path: string, type: AssetType<T> | null, onProgress?: ProgressCallback | null): Promise<T>;
    loadAsync<T extends Asset>(bundleOrPath: string, pathOrType: string | AssetType<T> | null,
        typeOrProgress?: AssetType<T> | ProgressCallback | null, onProgress?: ProgressCallback | null): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const complete = (err: Error | null, asset: T): void => {
                if (err) reject(err);
                else if (!asset) reject(new Error(`Asset did not load: ${typeof pathOrType === "string" ? pathOrType : bundleOrPath}`));
                else resolve(asset);
            };
            if (typeof pathOrType === "string") {
                this.load(bundleOrPath, pathOrType, typeOrProgress as AssetType<T> | null, onProgress ?? null, complete);
            } else {
                this.load(bundleOrPath, pathOrType, typeOrProgress as ProgressCallback | null, complete);
            }
        });
    }

    /** Load and deserialize a directory; an empty path means the bundle root. */
    loadDirAsync<T extends Asset>(bundleName: string, path: string, type: AssetType<T> | null, onProgress?: ProgressCallback | null): Promise<T[]>;
    loadDirAsync<T extends Asset>(path: string, type: AssetType<T> | null, onProgress?: ProgressCallback | null): Promise<T[]>;
    loadDirAsync<T extends Asset>(bundleOrPath: string, pathOrType: string | AssetType<T> | null,
        typeOrProgress?: AssetType<T> | ProgressCallback | null, onProgress?: ProgressCallback | null): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            const complete = (err: Error | null, assets: T[]): void => {
                if (err) reject(err);
                else if (!assets) reject(new Error(`Directory did not load: ${typeof pathOrType === "string" ? pathOrType : bundleOrPath}`));
                else resolve(assets);
            };
            if (typeof pathOrType === "string") {
                this.loadDir(bundleOrPath, pathOrType, typeOrProgress as AssetType<T> | null, onProgress ?? null, complete);
            } else {
                this.loadDir(bundleOrPath, pathOrType, typeOrProgress as ProgressCallback | null, complete);
            }
        });
    }

    /**
     * 通过资源相对路径释放资源
     * @param path          资源路径
     * @param bundleName    远程资源包名
     */
    release(path: string, bundleName: string = "resources") {
        var bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            var asset = bundle.get(path);
            if (asset) {
                this.releasePrefabtDepsRecursively(asset._uuid);
            }
        }
    }

    /**
     * 通过相对文件夹路径删除所有文件夹中资源
     * @param path          资源文件夹路径
     * @param bundleName    远程资源包名
     */
    releaseDir(path: string, bundleName: string = "resources") {
        var bundle: AssetManager.Bundle | null = assetManager.getBundle(bundleName);
        var infos = bundle?.getDirWithPath(path);
        infos?.map((info) => {
            this.releasePrefabtDepsRecursively(info.uuid);
        });

        if (path == "" && bundleName != "resources" && bundle) {
            assetManager.removeBundle(bundle);
        }
    }

    /**
     * 获取资源
     * @param path          资源路径
     * @param type          资源类型
     * @param bundleName    远程资源包名
     */
    get<T extends Asset>(path: string, type?: AssetType<T> | null, bundleName: string = "resources"): T | null {
        var bundle: AssetManager.Bundle | null = assetManager.getBundle(bundleName);
        return bundle!.get(path, type);
    }

    /** 打印缓存中所有资源信息 */
    dump() {
        assetManager.assets.forEach((value: Asset, key: string) => {
            console.log(assetManager.assets.get(key));
        })
        console.log(`当前资源总数:${assetManager.assets.count}`);
    }

    private parseLoadResArgs<T extends Asset>(
        paths: string | string[],
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onProgress?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onComplete?: ProgressCallback | CompleteCallback | null
    ) {
        let pathsOut: any = paths;
        let typeOut: any = type;
        let onProgressOut: any = onProgress;
        let onCompleteOut: any = onComplete;
        if (onComplete === undefined) {
            const isValidType = js.isChildClassOf(type as AssetType, Asset);
            if (onProgress) {
                onCompleteOut = onProgress as CompleteCallback;
                if (isValidType) {
                    onProgressOut = null;
                }
            }
            else if (onProgress === undefined && !isValidType) {
                onCompleteOut = type as CompleteCallback;
                onProgressOut = null;
                typeOut = null;
            }
            if (onProgress !== undefined && !isValidType) {
                onProgressOut = type as ProgressCallback;
                typeOut = null;
            }
        }
        return { paths: pathsOut, type: typeOut, onProgress: onProgressOut, onComplete: onCompleteOut };
    }

    private loadByBundleAndArgs<T extends Asset>(bundle: AssetManager.Bundle, args: ILoadResArgs<T>): void {
        let requests = this.resourceLoads.get(bundle);
        if (!requests) {
            requests = new Map();
            this.resourceLoads.set(bundle, requests);
        }
        let typeId = 0;
        if (args.type) {
            typeId = this.assetTypes.get(args.type) ?? ++this.nextAssetType;
            this.assetTypes.set(args.type, typeId);
        }
        const directory = args.dir !== undefined;
        const key = JSON.stringify([directory, args.paths, typeId]);
        const pending = requests.get(key);
        if (pending) {
            pending.push(args);
            return;
        }
        const listeners = [args];
        requests.set(key, listeners);
        const complete: CompleteCallback = (err, data) => {
            if (requests!.get(key) !== listeners) return;
            requests!.delete(key);
            for (const listener of listeners) this.invoke(listener.onComplete, err, data);
        };
        const progress: ProgressCallback = (...values) => {
            if (requests!.get(key) !== listeners) return;
            for (const listener of listeners.slice()) this.invoke(listener.onProgress, ...values);
        };
        try {
            if (directory) bundle.loadDir(args.paths as string, args.type, progress, complete);
            else if (typeof args.paths === "string") bundle.load(args.paths, args.type, progress, complete);
            else bundle.load(args.paths, args.type, progress, complete);
        } catch (cause) {
            complete(cause instanceof Error ? cause : new Error(String(cause)), null);
        }
    }

    private loadByArgs<T extends Asset>(args: ILoadResArgs<T>): void {
        if (!args.bundle || args.bundle === "resources") {
            this.loadByBundleAndArgs(resources, args);
            return;
        }
        this.requestBundle(args.bundle, undefined, (err, bundle) => {
            if (err) this.invoke(args.onComplete, err, null);
            else this.loadByBundleAndArgs(bundle!, args);
        });
    }

    private requestBundle(url: string, version: string | undefined, callback: BundleCallback): void {
        const cached = version === undefined ? assetManager.bundles.get(url) : null;
        if (cached) {
            this.invoke(callback, null, cached);
            return;
        }
        const key = JSON.stringify([url, version ?? null]);
        const pending = this.bundleLoads.get(key);
        if (pending) {
            pending.push(callback);
            return;
        }
        const callbacks = [callback];
        this.bundleLoads.set(key, callbacks);
        const complete: BundleCallback = (err, bundle) => {
            if (this.bundleLoads.get(key) !== callbacks) return;
            this.bundleLoads.delete(key);
            const failure = err || (!bundle ? new Error(`Bundle ${url} did not load`) : null);
            for (const listener of callbacks) this.invoke(listener, failure, failure ? null : bundle);
        };
        try {
            if (version === undefined) assetManager.loadBundle(url, complete);
            else assetManager.loadBundle(url, { version }, complete);
        } catch (cause) {
            complete(cause instanceof Error ? cause : new Error(String(cause)), null);
        }
    }

    private invoke(callback: Function | null | undefined, ...args: any[]): void {
        if (!callback) return;
        try { callback(...args); }
        catch (cause) { error(cause); }
    }

    /** 释放预制依赖资源 */
    private releasePrefabtDepsRecursively(uuid: string) {
        var asset = assetManager.assets.get(uuid)!;
        assetManager.releaseAsset(asset);

        if (asset instanceof Prefab) {
            var uuids: string[] = assetManager.dependUtil.getDepsRecursively(uuid)!;
            uuids.forEach(uuid => {
                var asset = assetManager.assets.get(uuid)!;
                asset.decRef();
            });
        }
    }
}
export let resLoader = new ResLoader();
