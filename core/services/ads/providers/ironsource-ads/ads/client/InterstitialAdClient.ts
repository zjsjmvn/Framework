
import { AdClient } from "./AdClient";
import { InterstitialAdLoadCalLBackNTF, LoadInterstitialAdREQ, LoadInterstitialAdACK, ShowInterstitialAdREQ, ShowInterstitialAdACK, InterstitialFullScreenContentCallbackNTF } from "../../proto/InterstitailAd";
import { log } from "cc";
import { InterstitialAdListener } from "../listener/InterstitialAdListener";
import { InterstitialPaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";
import { InterstitialFullScreenContentCallback } from "../listener/InterstitialFullScreenContentCallback";
import { InterstitialAdLoadCallback } from "../listener/InterstitialAdLoadCallback";

/**
 * @zh
 * 插屏广告的客户端
 * @en
 * TS client for Interstitial ad.
 */
const module = "[InterstitialAdClient]"
export class InterstitialAdClient extends AdClient {

    /**
     * @zh
     * 插屏广告的事件监听器
     * @en
     * Interstitial ad event listener
     */
    private _adListener: InterstitialAdListener = null;

    /**
     * @zh
     * 构造函数 - 支持无参数构造以兼容现有代码
     * @en
     * Constructor - supports no-parameter construction for compatibility
     */
    constructor(unitId?: string) {
        super(unitId || "");
    }

    /**
     * @zh
     * 插屏广告的事件监听器
     * @en
     * Interstitial ad event listener
     */
    public get adListener(): InterstitialAdListener {
        return this._adListener;
    }

    /**
     * @zh
     * 插屏广告的事件监听器
     * @en
     * Interstitial ad event listener
     */
    public set adListener(v: InterstitialAdListener) {
        if (this._adListener) {
            this.removeEventListener("InterstitialAdLoadCalLBackNTF", this.onAdLoadCallback, this);
            this.removeEventListener("InterstitialPaidEventNotification", this.onPaidEvent, this);
            this.removeEventListener("InterstitialPaidEventNTF", this.onPaidEvent, this);
            this.removeEventListener("InterstitialFullScreenContentCallbackNTF", this.onFullScreenContentCallback, this);
        }
        this._adListener = v;
        if (this._adListener) {
            this.addEventListener("InterstitialAdLoadCalLBackNTF", this.onAdLoadCallback, this);
            this.addEventListener("InterstitialPaidEventNotification", this.onPaidEvent, this);
            this.addEventListener("InterstitialPaidEventNTF", this.onPaidEvent, this);
            this.addEventListener("InterstitialFullScreenContentCallbackNTF", this.onFullScreenContentCallback, this);
        }
    }

    /**
     * @zh
     * 加载插屏广告 - 兼容现有代码的调用方式
     * @en
     * Load interstitial ad - compatible with existing code calling style
     * @param unitId 广告单元ID
     * @param adListener 广告监听器
     */
    load(unitId: string, adListener?: InterstitialAdListener) {
        // 设置 unitId
        this.unitId = unitId;

        // 设置事件监听器
        if (adListener) {
            this.adListener = adListener;
        }

        let req = new LoadInterstitialAdREQ(unitId);
        this.sendToNative("LoadInterstitialAdREQ", req, "LoadInterstitialAdACK", (response: LoadInterstitialAdACK) => {
            // 处理加载响应
            console.log("Interstitial load response:", response);
        }, this);
    }

    /**
     * @zh
     * 加载插屏广告 - 新版本API
     * @en
     * Load interstitial ad - new version API
     */
    loadInterstitial() {
        let req = new LoadInterstitialAdREQ(this.unitId);
        this.sendToNative("LoadInterstitialAdREQ", req, "LoadInterstitialAdACK", (response: LoadInterstitialAdACK) => {
            // 处理加载响应
            console.log("Interstitial load response:", response);
        }, this);
    }

    /**
     * @zh
     * 展示插屏广告
     * @en
     * Show interstitial ad
     */
    show() {
        let req = new ShowInterstitialAdREQ(this.unitId);
        this.sendToNative("ShowInterstitialAdREQ", req, "ShowInterstitialAdACK", (response: ShowInterstitialAdACK) => {
            // 处理展示响应
            console.log("Interstitial show response:", response);
        }, this);
    }

    /**
     * @zh
     * 销毁客户端
     * @en
     * Destroy client
     */
    public destroy() {
        // 移除事件监听器
        if (this._adListener) {
            this.removeEventListener("InterstitialAdLoadCalLBackNTF", this.onAdLoadCallback, this);
            this.removeEventListener("InterstitialPaidEventNotification", this.onPaidEvent, this);
            this.removeEventListener("InterstitialPaidEventNTF", this.onPaidEvent, this);
            this.removeEventListener("InterstitialFullScreenContentCallbackNTF", this.onFullScreenContentCallback, this);
        }

        super.destroy();
    }

    /**
     * @zh
     * 广告加载回调处理
     * @en
     * Handle ad load callback
     */
    private onAdLoadCallback = (ntf: InterstitialAdLoadCalLBackNTF | string) => {
        ntf = typeof ntf === 'string' ? JSON.parse(ntf) : ntf;
        if (ntf.unitId !== this.unitId) return;

        // 检查是否为 InterstitialAdLoadCallback 类型
        const loadCallback = this._adListener as InterstitialAdLoadCallback;
        if (loadCallback) {
            switch (ntf.method) {
                case "onAdLoaded":
                    if (loadCallback.onAdLoaded) {
                        loadCallback.onAdLoaded();
                    }
                    break;
                case "onAdFailedToLoad":
                    if (loadCallback.onAdFailedToLoad) {
                        loadCallback.onAdFailedToLoad(ntf.loadAdError);
                    }
                    break;
            }
        }
    }

    /**
     * @zh
     * 付费事件处理
     * @en
     * Handle paid events
     */
    private onPaidEvent = (ntf: InterstitialPaidEventNotification | string) => {
        ntf = typeof ntf === 'string' ? JSON.parse(ntf) : ntf;
        if (ntf.unitId !== this.unitId) return;

        // 检查是否为 OnPaidEventListener 类型
        const paidEventListener = this._adListener as OnPaidEventListener<InterstitialPaidEventNotification>;
        if (paidEventListener && paidEventListener.onPaidEvent) {
            paidEventListener.onPaidEvent(ntf);
        }
    }

    /**
     * @zh
     * 全屏内容回调处理
     * @en
     * Handle full screen content callback
     */
    private onFullScreenContentCallback = (ntf: InterstitialFullScreenContentCallbackNTF | string) => {
        ntf = typeof ntf === 'string' ? JSON.parse(ntf) : ntf;
        if (ntf.unitId !== this.unitId) return;

        // 检查是否为 InterstitialFullScreenContentCallback 类型
        const fullScreenCallback = this._adListener as InterstitialFullScreenContentCallback;
        if (fullScreenCallback) {
            switch (ntf.method) {
                case "onAdClicked":
                    if (fullScreenCallback.onAdClicked) {
                        fullScreenCallback.onAdClicked();
                    }
                    break;
                case "onAdDismissedFullScreenContent":
                    if (fullScreenCallback.onAdDismissedFullScreenContent) {
                        fullScreenCallback.onAdDismissedFullScreenContent();
                    }
                    break;
                case "onAdFailedToShowFullScreenContent":
                    if (fullScreenCallback.onAdFailedToShowFullScreenContent) {
                        fullScreenCallback.onAdFailedToShowFullScreenContent((ntf as any).loadAdError ?? (ntf as any).adError);
                    }
                    break;
                case "onAdImpression":
                    if (fullScreenCallback.onAdImpression) {
                        fullScreenCallback.onAdImpression();
                    }
                    break;
                case "onAdShowedFullScreenContent":
                    if (fullScreenCallback.onAdShowedFullScreenContent) {
                        fullScreenCallback.onAdShowedFullScreenContent();
                    }
                    break;
            }
        }
    }
}
