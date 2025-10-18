
import { log } from "cc";
import { DestroyBannerACK } from "../../proto/BannerAd";
import { DestroyNativeAdACK, DestroyNativeAdREQ, LoadNativeAdACK, LoadNativeAdREQ, NativeAdListenerNTF, NativeAdTemplateSize, NativeLoadedNTF } from "../../proto/NativeAd";
import { AdClient } from "./AdClient";
import { NativeAdListener } from "../listener/NativeAdListener";
import { OnNativeAdLoadedListener } from "../listener/OnNativeAdLoadedListener";
import { NativePaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";

/**
 * @zh
 * 原生广告客户端
 * 由于不可销毁，通常来说游戏不会用到
 * 提供两种类型，请查看 NativeAdTemplateSize
 * @en
 * native ad client
 * Two types are supported, please check NativeAdTemplateSize for more details
 */
const module = "[NativeAdClient]";
export class NativeAdClient extends AdClient {

    /**
     * @zh
     * 原生广告的监听器
     * @en
     * Listener for the native ad
     */
    private _nativeAdListener: NativeAdListener;

    /**
     * @zh
     * 原生广告的监听器
     * @en
     * Listener for the native ad
     */
    get nativeAdListener(): NativeAdListener {
        return this._nativeAdListener;
    }

    /**
     * @zh
     * 原生广告的监听器
     * @en
     * Listener for the native ad
     */
    set nativeAdListener(value: NativeAdListener) {
        if (this._nativeAdListener) {
            this.removeEventListener("NativeLoadedNTF", this.onNativeLoadedNTF, this);
            this.removeEventListener("NativeAdListenerNTF", this.onNativeAdListenerNTF, this);
            this.removeEventListener("NativePaidEventNotification", this.onPaidEvent, this);
        }
        this._nativeAdListener = value;
        if (this._nativeAdListener) {
            this.addEventListener("NativeLoadedNTF", this.onNativeLoadedNTF, this);
            this.addEventListener("NativeAdListenerNTF", this.onNativeAdListenerNTF, this);
            this.addEventListener("NativePaidEventNotification", this.onPaidEvent, this);
        }
    }

    /**
     * @zh
     * 加载原生广告
     * @en
     * Load native ad.
     * @param unitId 
     *  @zh 单元Id
     *  @en The unit id
     * @param size 
     *  @zh 广告的大小
     *  @en The ad size
     * @param nativeListener 
     *  @zh 监听器
     *  @en The listener
     */
    load(unitId: string, size: NativeAdTemplateSize, nativeListener?: NativeAdListener) {
        log(module, "load", `unitId = ${unitId}`);
        this.nativeAdListener = nativeListener;
        let req = new LoadNativeAdREQ(unitId);
        req.size = size;
        this.sendToNative("LoadNativeAdREQ", req);
    }

    /**
     * @zh
     * 销毁原生广告
     * @en
     * Destroy the native ad
     */
    destroy() {
        log(module, "destroy");
        if (this._nativeAdListener) {
            this.removeEventListener("NativeLoadedNTF", this.onNativeLoadedNTF, this);
            this.removeEventListener("NativeAdListenerNTF", this.onNativeAdListenerNTF, this);
            this.removeEventListener("NativePaidEventNotification", this.onPaidEvent, this);
        }
        this._nativeAdListener = null;
        this.sendToNative("DestroyNativeAdREQ", { unitId: this.unitId });
        super.destroy();
    }

    private onNativeLoadedNTF = (ntf: NativeLoadedNTF) => {
        if (this.nativeAdListener) {
            const listener = this.nativeAdListener as OnNativeAdLoadedListener;
            if (listener && listener.onNativeAdLoaded) {
                listener.onNativeAdLoaded();
            }
        }
    }

    private onNativeAdListenerNTF = (ntf: NativeAdListenerNTF) => {
        const method = this.nativeAdListener[ntf.method];
        if (method) {
            method(ntf.loadAdError);
        }
    }

    private onPaidEvent = (ntf: NativePaidEventNotification) => {
        const paid = this.nativeAdListener as OnPaidEventListener<NativePaidEventNotification>;
        if (paid && paid.onPaidEvent) {
            paid.onPaidEvent(ntf);
        }
    }
}