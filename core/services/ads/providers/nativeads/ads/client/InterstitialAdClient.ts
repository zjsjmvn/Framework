
import { AdClient, NativeAdsEvents, NativeAdsStatus, parseNativePayload } from "./AdClient";
import { AdsInterstitialAdLoadCalLBackNTF, AdsLoadInterstitialAdREQ, AdsShowInterstitialAdREQ, AdsInterstitialFullScreenContentCallbackNTF } from "../../proto/InterstitailAd";
import { log } from "cc";
import { AdsInterstitialPaidEventNotification } from "../../proto/PaidEventNTF";
import { AdPaidListener } from "../listener/AdPaidListener";
import { AdFullScreenListener } from "../listener/AdFullScreenListener";
import { AdLoadListener } from "../listener/AdLoadListener";

type InterstitialAdListener = AdLoadListener & AdFullScreenListener & AdPaidListener<AdsInterstitialPaidEventNotification>;

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
            this.removeEventListener(NativeAdsEvents.Interstitial.EVENT, this.onInterstitialEvent, this);
            this.removeEventListener(NativeAdsEvents.Interstitial.PAID, this.onPaidEvent, this);
        }
        this._adListener = v;
        if (this._adListener) {
            this.addEventListener(NativeAdsEvents.Interstitial.EVENT, this.onInterstitialEvent, this);
            this.addEventListener(NativeAdsEvents.Interstitial.PAID, this.onPaidEvent, this);
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
    init(unitId: string, adListener?: InterstitialAdListener) {
        // 设置 unitId
        this.unitId = unitId;

        // 设置事件监听器
        if (adListener) {
            this.adListener = adListener;
        }

    }

    /**
     * @zh
     * 加载插屏广告 - 新版本API
     * @en
     * Load interstitial ad - new version API
     */
    loadInterstitial() {
        let req = new AdsLoadInterstitialAdREQ(this.unitId);
        this.sendToNative(NativeAdsEvents.Interstitial.LOAD, req);
    }

    /**
     * @zh
     * 展示插屏广告
     * @en
     * Show interstitial ad
     */
    show() {
        let req = new AdsShowInterstitialAdREQ(this.unitId);
        this.sendToNative(NativeAdsEvents.Interstitial.SHOW, req);
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
            this.removeEventListener(NativeAdsEvents.Interstitial.EVENT, this.onInterstitialEvent, this);
            this.removeEventListener(NativeAdsEvents.Interstitial.PAID, this.onPaidEvent, this);
        }

        super.destroy();
    }

    /**
     * @zh
     * 广告加载回调处理
     * @en
     * Handle ad load callback
     */
    private onInterstitialEvent = (payload: AdsInterstitialAdLoadCalLBackNTF | AdsInterstitialFullScreenContentCallbackNTF | string) => {
        const ntf = parseNativePayload<AdsInterstitialAdLoadCalLBackNTF & AdsInterstitialFullScreenContentCallbackNTF>(payload);
        if (ntf.unitId !== this.unitId) return;

        const loadCallback = this._adListener as AdLoadListener;
        const fullScreenCallback = this._adListener as AdFullScreenListener;

        switch (ntf.method) {
            case NativeAdsStatus.LOADED:
                loadCallback?.onAdLoaded?.();
                break;
            case NativeAdsStatus.LOAD_FAILED:
                loadCallback?.onAdFailedToLoad?.(ntf.loadAdError);
                break;
            case NativeAdsStatus.SHOWN:
                fullScreenCallback?.onAdShowedFullScreenContent?.();
                fullScreenCallback?.onAdImpression?.();
                break;
            case NativeAdsStatus.SHOW_FAILED:
                fullScreenCallback?.onAdFailedToShowFullScreenContent?.(ntf.adError ?? ntf.loadAdError);
                break;
            case NativeAdsStatus.CLICKED:
                fullScreenCallback?.onAdClicked?.();
                break;
            case NativeAdsStatus.DISMISSED:
                fullScreenCallback?.onAdDismissedFullScreenContent?.();
                break;
        }
    }

    /**
     * @zh
     * 付费事件处理
     * @en
     * Handle paid events
     */
    private onPaidEvent = (payload: AdsInterstitialPaidEventNotification | string) => {
        const ntf = parseNativePayload<AdsInterstitialPaidEventNotification>(payload);
        if (ntf.unitId !== this.unitId) return;

        // 如果业务实现了展示价值回调，就把 Java 层的 paid 事件交给业务统计。
        const paidEventListener = this._adListener as AdPaidListener<AdsInterstitialPaidEventNotification>;
        if (paidEventListener && paidEventListener.onPaidEvent) {
            paidEventListener.onPaidEvent(ntf);
        }
    }

}

