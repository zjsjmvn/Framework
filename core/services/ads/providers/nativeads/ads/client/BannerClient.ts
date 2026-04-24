
import { AdClient, NativeAdsEvents, NativeAdsStatus, parseNativePayload } from "./AdClient";
import { AdsBannerAdListenerNTF, AdsShowBannerREQ, AdsLoadBannerREQ, AdsDestroyBannerREQ } from "../../proto/BannerAd";
import { log } from "cc";
import { BannerSize } from "../../misc/BannerSize";
import { BannerAlignment } from "../../misc/BannerAlignment";
import { AdsBannerPaidEventNotification } from "../../proto/PaidEventNTF";
import { AdPaidListener } from "../listener/AdPaidListener";
import { BannerSizeType } from "../../misc/BannerSizeType";
import { AdLoadListener } from "../listener/AdLoadListener";

type BannerAdListener = AdLoadListener & AdPaidListener<AdsBannerPaidEventNotification> & {
    onAdClicked?: () => void;
    onAdClosed?: () => void;
    onAdImpression?: () => void;
};

const module = "[BannerClient]";

/**
 * @zh
 * 横幅的客户端
 * @en
 * TS client for Banner ad.
 */
export class BannerClient extends AdClient {

    /**
     * @zh
     * Banner 的事件监听器，由多种监听器联合
     * @en
     * Union of all banner events listener
     */
    private _adListener: BannerAdListener = null;

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
     * Banner 的事件监听器，由多种监听器联合
     * @en
     * Union of all banner events listener
     */
    public get adListener(): BannerAdListener {
        return this._adListener;
    }

    /**
     * @zh
     * Banner 的事件监听器，由多种监听器联合
     * @en
     * Union of all banner events listener
     */
    public set adListener(v: BannerAdListener) {
        log(module, `set adListener, unitId = ${this.unitId}, hasListener = ${!!v}`);
        if (this._adListener) {
            this.removeEventListener(NativeAdsEvents.Banner.EVENT, this.onAdListenerEvent, this);
            this.removeEventListener(NativeAdsEvents.Banner.PAID, this.onPaidEvent, this);
        }
        this._adListener = v;
        if (this._adListener) {
            this.addEventListener(NativeAdsEvents.Banner.EVENT, this.onAdListenerEvent, this);
            this.addEventListener(NativeAdsEvents.Banner.PAID, this.onPaidEvent, this);
        }
    }

    /**
     * @zh
     * 展示横幅
     * @en
     * Show banner 
     * @param visible 
     *  @zh 横幅的可见性
     *  @en Visibility of the banner
     */
    show(visible: boolean) {
        log(module, `show, unitId = ${this.unitId}, visible = ${visible}`);
        let req = new AdsShowBannerREQ(this.unitId);
        req.visible = visible;
        this.sendToNative(NativeAdsEvents.Banner.SHOW, req);
    }

    /**
     * @zh
     * 初始化横幅客户端，只记录广告位和事件监听器。
     * 真正加载广告请调用 loadBanner。
     * @en
     * Initialize banner client only. Call loadBanner to request an ad.
     * @param unitId 广告单元ID
     * @param adListener 广告监听器
     */
    init(unitId: string, adListener?: BannerAdListener) {
        log(module, `init, unitId = ${unitId}, hasListener = ${!!adListener}`);
        // 设置 unitId
        this.unitId = unitId;

        // 设置事件监听器
        if (adListener) {
            this.adListener = adListener;
        }
    }

    /**
     * @zh
     * 加载横幅广告，会向 Java 层发送 Ads.banner.load。
     * @en
     * Load banner ad.
     * @param bannerSize 
     *  @zh 横幅的尺寸
     *  @en Size of the banner
     * @param bannerSizeType 
     *  @zh 横幅的尺寸类型
     *  @en Type of the banner size
     * @param alignments 
     *  @zh 横幅的对齐方式
     *  @en Alignment of the banner
     */
    loadBanner(bannerSize: BannerSize = BannerSize.BANNER, bannerSizeType: BannerSizeType = BannerSizeType.Builtin, alignments: BannerAlignment[] = [BannerAlignment.ALIGN_PARENT_BOTTOM, BannerAlignment.CENTER_HORIZONTAL]) {
        log(module, `loadBanner, unitId = ${this.unitId}, size = ${bannerSize}, type = ${bannerSizeType}, alignments = ${alignments.join(",")}`);
        let req = new AdsLoadBannerREQ(this.unitId);
        req.bannerSize = bannerSize;
        req.bannerSizeType = bannerSizeType;
        req.alignments = alignments;
        this.sendToNative(NativeAdsEvents.Banner.LOAD, req);
    }

    /**
     * @zh
     * 销毁横幅
     * @en
     * Destroy banner
     */
    destroy() {
        log(module, `destroy, unitId = ${this.unitId}`);
        let req = new AdsDestroyBannerREQ(this.unitId);
        this.sendToNative(NativeAdsEvents.Banner.DESTROY, req);

        // 移除事件监听器
        if (this._adListener) {
            this.removeEventListener(NativeAdsEvents.Banner.EVENT, this.onAdListenerEvent, this);
            this.removeEventListener(NativeAdsEvents.Banner.PAID, this.onPaidEvent, this);
        }

        super.destroy();
    }

    /**
     * @zh
     * 横幅广告事件处理
     * @en
     * Handle banner ad events
     */
    private onAdListenerEvent = (payload: AdsBannerAdListenerNTF | string) => {
        const ntf = parseNativePayload<AdsBannerAdListenerNTF>(payload);
        if (ntf.unitId != this.unitId) {
            log(module, `ignore event, currentUnitId = ${this.unitId}, eventUnitId = ${ntf.unitId}, method = ${ntf.method}`);
            return;
        }
        log(module, `onAdListenerEvent, unitId = ${ntf.unitId}, method = ${ntf.method}`);
        if (this._adListener) {
            const adListener = this._adListener;

            switch (ntf.method) {
                case NativeAdsStatus.LOADED:
                    if (adListener.onAdLoaded) {
                        adListener.onAdLoaded();
                    }
                    break;
                case NativeAdsStatus.LOAD_FAILED:
                case NativeAdsStatus.RENDER_FAILED:
                    if (adListener.onAdFailedToLoad) {
                        adListener.onAdFailedToLoad(ntf.loadAdError);
                    }
                    break;
                case NativeAdsStatus.CLICKED:
                    if (adListener.onAdClicked) {
                        adListener.onAdClicked();
                    }
                    break;
                case NativeAdsStatus.IMPRESSION:
                    if (adListener.onAdImpression) {
                        adListener.onAdImpression();
                    }
                    break;
                case NativeAdsStatus.CLOSED:
                case NativeAdsStatus.DESTROYED:
                    if (adListener.onAdClosed) {
                        adListener.onAdClosed();
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
    private onPaidEvent = (payload: AdsBannerPaidEventNotification | string) => {
        const ntf = parseNativePayload<AdsBannerPaidEventNotification>(payload);
        if (ntf.unitId !== this.unitId) {
            log(module, `ignore paid event, currentUnitId = ${this.unitId}, eventUnitId = ${ntf.unitId}`);
            return;
        }

        log(module, `onPaidEvent, unitId = ${ntf.unitId}, valueMicros = ${ntf.valueMicros}, currencyCode = ${ntf.currencyCode}`);

        const paidEventListener = this._adListener as AdPaidListener<AdsBannerPaidEventNotification>;
        if (paidEventListener && paidEventListener.onPaidEvent) {
            paidEventListener.onPaidEvent(ntf);
        }
    }
}

