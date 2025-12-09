
import { AdClient } from "./AdClient";
import { BannerAdListenerNTF, ShowBannerREQ, LoadBannerREQ, LoadBannerACK, DestroyBannerREQ, DestroyBannerACK } from "../../proto/BannerAd";
import { log } from "cc";
import { BannerSize } from "../../misc/BannerSize";
import { BannerAlignment, BottomCenter } from "../../misc/BannerAlignment";
import { BannerSizeOption } from "../../misc/BannerSizeOption";
import { BannerAdListener } from "../listener/BannerAdListener";
import { BannerPaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";
import { BannerSizeType } from "../../misc/BannerSizeType";
import { AdListener } from "../listener/AdListener";

/**
 * @zh
 * 横幅的客户端
 * @en
 * TS client for Banner ad.
 */
const module = "[BannerClient]"
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
        if (this._adListener) {
            this.removeEventListener("BannerAdListenerNTF", this.onAdListenerEvent, this);
            this.removeEventListener("BannerPaidEventNotification", this.onPaidEvent, this);
        }
        this._adListener = v;
        if (this._adListener) {
            this.addEventListener("BannerAdListenerNTF", this.onAdListenerEvent, this);
            this.addEventListener("BannerPaidEventNotification", this.onPaidEvent, this);
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
        let req = new ShowBannerREQ(this.unitId);
        req.visible = visible;
        this.sendToNative("ShowBannerREQ", req);
    }

    /**
     * @zh
     * 加载横幅 - 兼容现有代码的调用方式
     * @en
     * Load banner - compatible with existing code calling style
     * @param unitId 广告单元ID
     * @param adListener 广告监听器
     * @param options 横幅选项
     */
    load(unitId: string, adListener?: BannerAdListener, options?: BannerSizeOption) {
        // 设置 unitId
        this.unitId = unitId;

        // 设置事件监听器
        if (adListener) {
            this.adListener = adListener;
        }

        // 构建加载请求
        let req = new LoadBannerREQ(unitId);

        if (options) {
            req.bannerSize = options.size || BannerSize.BANNER;
            req.bannerSizeType = options.type || BannerSizeType.Builtin;
            req.alignments = options.alignments || [BannerAlignment.ALIGN_PARENT_BOTTOM, BannerAlignment.CENTER_HORIZONTAL];
        } else {
            req.bannerSize = BannerSize.BANNER;
            req.bannerSizeType = BannerSizeType.Builtin;
            req.alignments = [BannerAlignment.ALIGN_PARENT_BOTTOM, BannerAlignment.CENTER_HORIZONTAL];
        }

        // this.sendToNative("LoadBannerREQ", req, "LoadBannerACK", (response: LoadBannerACK) => {
        //     // 处理加载响应
        //     console.log("Banner load response:", response.unitId);
        // }, this);
    }

    /**
     * @zh
     * 加载横幅 - 新版本API
     * @en
     * Load banner - new version API
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
        let req = new LoadBannerREQ(this.unitId);
        req.bannerSize = bannerSize;
        req.bannerSizeType = bannerSizeType;
        req.alignments = alignments;
        this.sendToNative("LoadBannerREQ", req, "LoadBannerACK", (response: LoadBannerACK) => {
            // 处理加载响应
            console.log("Banner load response:", response);
        }, this);
    }

    /**
     * @zh
     * 销毁横幅
     * @en
     * Destroy banner
     */
    destroy() {
        let req = new DestroyBannerREQ(this.unitId);
        this.sendToNative("DestroyBannerREQ", req, "DestroyBannerACK", (response: DestroyBannerACK) => {
            // 处理销毁响应
            console.log("Banner destroy response:", response);
        }, this);

        // 移除事件监听器
        if (this._adListener) {
            this.removeEventListener("BannerAdListenerNTF", this.onAdListenerEvent, this);
            this.removeEventListener("BannerPaidEventNotification", this.onPaidEvent, this);
        }

        super.destroy();
    }

    /**
     * @zh
     * 横幅广告事件处理
     * @en
     * Handle banner ad events
     */
    private onAdListenerEvent = (ntf: BannerAdListenerNTF) => {
        ntf = JSON.parse(ntf);
        console.log("BannerAdListenerNTF:", ntf, this.unitId);
        if (ntf.unitId != this.unitId) {
            console.log("BannerAdListenerNTF3:", ntf, this.unitId);
            return;
        }
        console.log("BannerAdListenerNTF2:", ntf);
        if (this._adListener) {
            // 检查是否为 AdListener 类型
            const adListener = this._adListener as AdListener;

            switch (ntf.method) {
                case "onAdLoaded":
                    if (adListener.onAdLoaded) {
                        adListener.onAdLoaded();
                    }
                    break;
                case "onAdFailedToLoad":
                    if (adListener.onAdFailedToLoad) {
                        adListener.onAdFailedToLoad(ntf.loadAdError);
                    }
                    break;
                case "onAdClicked":
                    console.log("onAdClicked11111")
                    if (adListener.onAdClicked) {
                        console.log("onAdClicked11112221")

                        adListener.onAdClicked();
                    }
                    break;
                case "onAdImpression":
                    if (adListener.onAdImpression) {
                        adListener.onAdImpression();
                    }
                    break;
                case "onAdClosed":
                    if (adListener.onAdClosed) {
                        adListener.onAdClosed();
                    }
                    break;
                case "onAdOpened":
                    if (adListener.onAdOpened) {
                        adListener.onAdOpened();
                    }
                    break;
                case "onAdSwipeGestureClicked":
                    if (adListener.onAdSwipeGestureClicked) {
                        adListener.onAdSwipeGestureClicked();
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
    private onPaidEvent = (ntf: BannerPaidEventNotification) => {
        if (ntf.unitId !== this.unitId) return;

        // 检查是否为 OnPaidEventListener 类型
        const paidEventListener = this._adListener as OnPaidEventListener<BannerPaidEventNotification>;
        if (paidEventListener && paidEventListener.onPaidEvent) {
            paidEventListener.onPaidEvent(ntf);
        }
    }
}
