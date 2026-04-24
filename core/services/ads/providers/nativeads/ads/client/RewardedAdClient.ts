
import { log } from "cc";
import { AdsOnUserEarnedRewardNotification, AdsRewardedAdLoadNotification, AdsRewardedFullScreenContentNotification } from "../../proto/RewardedAd";
import { AdClient, NativeAdsEvents, NativeAdsStatus, parseNativePayload } from "./AdClient";
import { AdsRewardedPaidEventNotification } from "../../proto/PaidEventNTF";
import { AdPaidListener } from "../listener/AdPaidListener";
import { AdFullScreenListener } from "../listener/AdFullScreenListener";
import { AdLoadListener } from "../listener/AdLoadListener";
import { RewardedEarnListener } from "../listener/RewardedEarnListener";

type RewardedAdListener = AdLoadListener & AdFullScreenListener & RewardedEarnListener & AdPaidListener<AdsRewardedPaidEventNotification>;

/**
 * @zh
 * 激励广告 Rewarded Ad 客户端
 * @en
 * The rewarded ad client
 */
const module = "[RewardedAdClient]"
export class RewardedAdClient extends AdClient {

    /**
     * @zh
     * 激励广告监听器的联合类型
     * @en
     * Union of listeners for rewarded ad.
     */
    private _rewardedListener: RewardedAdListener;

    /**
     * @zh
     * 构造函数，支持先创建实例，再通过 init 绑定广告位。
     * @en
     * Constructor. The unit id can be assigned later through init.
     */
    constructor(unitId?: string) {
        super(unitId || "");
    }

    /**
     * @zh
     * 激励广告监听器的联合类型
     * @en
     * Union of listeners for rewarded ad.
     */
    public set rewardedListener(value: RewardedAdListener) {
        if (this._rewardedListener) {
            this.removeEventListener(NativeAdsEvents.Rewarded.EVENT, this.onRewardedEvent, this);
            this.removeEventListener(NativeAdsEvents.Rewarded.REWARD, this.onRewardedReward, this);
            this.removeEventListener(NativeAdsEvents.Rewarded.PAID, this.onPaidEvent, this);
        }
        this._rewardedListener = value;

        if (this._rewardedListener) {
            this.addEventListener(NativeAdsEvents.Rewarded.EVENT, this.onRewardedEvent, this);
            this.addEventListener(NativeAdsEvents.Rewarded.REWARD, this.onRewardedReward, this);
            this.addEventListener(NativeAdsEvents.Rewarded.PAID, this.onPaidEvent, this);
        }
    }

    /**
     * @zh
     * 激励广告监听器的联合类型
     * @en
     * Union of listeners for rewarded ad.
     */
    public get rewardedListener(): RewardedAdListener {
        return this._rewardedListener;
    }

    /**
     * @zh
     * 初始化激励广告客户端，只记录广告位和事件监听器。
     * 真正加载广告请调用 load。
     * @en
     * Initialize rewarded ad client only. Call load to request an ad.
     * @param unitId 广告单元ID
     * @param rewardedListener 激励广告监听器
     */
    init(unitId: string, rewardedListener?: RewardedAdListener) {
        log(module, `init, unitId = ${unitId}, hasListener = ${!!rewardedListener}`);
        this.unitId = unitId;
        if (rewardedListener) {
            this.rewardedListener = rewardedListener;
        }
    }

    /**
     * @zh
     * 加载记录广告
     * @en
     * Load the rewarded ad
     */
    load() {
        log(module, `load, unitId = ${this.unitId}`);
        this.sendToNative(NativeAdsEvents.Rewarded.LOAD, { unitId: this.unitId });
    }

    /**
     * @zh
     * 销毁事件监听
     * @en
     * Deregister ad listener
     */
    destroy() {
        log(module, `destroy`);
        if (this._rewardedListener) {
            this.removeEventListener(NativeAdsEvents.Rewarded.EVENT, this.onRewardedEvent, this);
            this.removeEventListener(NativeAdsEvents.Rewarded.REWARD, this.onRewardedReward, this);
            this.removeEventListener(NativeAdsEvents.Rewarded.PAID, this.onPaidEvent, this);
        }
        this._rewardedListener = null;
        super.destroy();
    }

    /**
     * @zh
     * 展示激励广告
     * @en
     * Show the rewarded ad.
     */
    show() {
        log(module, `show`);
        this.sendToNative(NativeAdsEvents.Rewarded.SHOW, { unitId: this.unitId });
    }

    private onRewardedEvent = (payload: AdsRewardedAdLoadNotification | AdsRewardedFullScreenContentNotification | string) => {
        const ntf = parseNativePayload<AdsRewardedAdLoadNotification & AdsRewardedFullScreenContentNotification>(payload);
        log(module, `onRewardedEvent, method: ${ntf.method}, unitId: ${ntf.unitId}`);
        if (ntf.unitId !== this.unitId || !this.rewardedListener) {
            return;
        }

        const listener = this.rewardedListener as any;
        switch (ntf.method) {
            case NativeAdsStatus.LOADED:
                listener.onAdLoaded?.();
                break;
            case NativeAdsStatus.LOAD_FAILED:
                listener.onAdFailedToLoad?.(ntf.loadAdError);
                break;
            case NativeAdsStatus.SHOWN:
                listener.onAdShowedFullScreenContent?.();
                listener.onAdImpression?.();
                break;
            case NativeAdsStatus.SHOW_FAILED:
                listener.onAdFailedToShowFullScreenContent?.(ntf.adError ?? ntf.loadAdError);
                break;
            case NativeAdsStatus.CLICKED:
                listener.onAdClicked?.();
                break;
            case NativeAdsStatus.DISMISSED:
                listener.onAdDismissedFullScreenContent?.();
                break;
        }
    }

    private onRewardedReward = (payload: AdsOnUserEarnedRewardNotification | string) => {
        const ntf = parseNativePayload<AdsOnUserEarnedRewardNotification>(payload);
        log(module, `onRewardedReward, rewardType: ${ntf.rewardType}, amount: ${ntf.rewardAmount}, unitId: ${ntf.unitId}`);
        if (ntf.unitId !== this.unitId) {
            return;
        }

        if (this.rewardedListener) {
            const onUserEarnedRewardListener = this.rewardedListener as RewardedEarnListener;
            if (onUserEarnedRewardListener && typeof onUserEarnedRewardListener.onEarn === 'function') {
                onUserEarnedRewardListener.onEarn(ntf.rewardType, ntf.rewardAmount);
            }
        }
    }

    private onPaidEvent = (payload: AdsRewardedPaidEventNotification | string) => {
        const ntf = parseNativePayload<AdsRewardedPaidEventNotification>(payload);
        log(module, `onPaidEvent, valueMicros: ${ntf.valueMicros}, currencyCode: ${ntf.currencyCode}, unitId: ${ntf.unitId}`);
        if (ntf.unitId !== this.unitId) {
            return;
        }

        if (this.rewardedListener) {
            const paid = this.rewardedListener as AdPaidListener<AdsRewardedPaidEventNotification>;
            if (paid && typeof paid.onPaidEvent === 'function') {
                paid.onPaidEvent(ntf);
            }
        }
    }
}
