
import { log } from "cc";
import { LoadRewardedAdACK, LoadRewardedAdREQ, OnUserEarnedRewardNotification, RewardedAdLoadNotification, RewardedFullScreenContentNotification, ShowRewardedAdACK, ShowRewardedAdREQ } from "../../proto/RewardedAd";
import { AdClient } from "./AdClient";
import { OnUserEarnedRewardListener } from "../listener/OnUserEarnedRewardListener";
import { RewardedAdListener } from "../listener/RewardedAdListener";
import { RewardedPaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";

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
     * 激励广告监听器的联合类型
     * @en
     * Union of listeners for rewarded ad.
     */
    public set rewardedListener(value: RewardedAdListener) {
        if (this._rewardedListener) {
            this.removeEventListener("RewardedAdLoadNotification", this.onRewardedAdLoadNotification, this);
            this.removeEventListener("RewardedFullScreenContentNotification", this.onFullScreenContentNotification, this);
            this.removeEventListener("OnUserEarnedRewardNotification", this.onOnUserEarnedRewardNotification, this);
            this.removeEventListener("RewardedPaidEventNotification", this.onPaidEvent, this);
        }
        this._rewardedListener = value;

        if (this._rewardedListener) {
            this.addEventListener("RewardedAdLoadNotification", this.onRewardedAdLoadNotification, this);
            this.addEventListener("RewardedFullScreenContentNotification", this.onFullScreenContentNotification, this);
            this.addEventListener("OnUserEarnedRewardNotification", this.onOnUserEarnedRewardNotification, this);
            this.addEventListener("RewardedPaidEventNotification", this.onPaidEvent, this);
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
     * 加载记录广告
     * @en
     * Load the rewarded ad
     */
    load() {
        log(module, `load, unitId = ${this.unitId}`);
        this.sendToNative("LoadRewardedAdREQ", { unitId: this.unitId });
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
            this.removeEventListener("RewardedAdLoadNotification", this.onRewardedAdLoadNotification, this);
            this.removeEventListener("RewardedFullScreenContentNotification", this.onFullScreenContentNotification, this);
            this.removeEventListener("OnUserEarnedRewardNotification", this.onOnUserEarnedRewardNotification, this);
            this.removeEventListener("RewardedPaidEventNotification", this.onPaidEvent, this);
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
        this.sendToNative("ShowRewardedAdREQ", { unitId: this.unitId });
    }

    private onRewardedAdLoadNotification = (ntfStr: any) => {
        // 解析 JSON 字符串
        const ntf: RewardedAdLoadNotification = typeof ntfStr === 'string' ? JSON.parse(ntfStr) : ntfStr;
        log(module, `onRewardedAdLoadNotification, method: ${ntf.method}, unitId: ${ntf.unitId}`);

        if (this.rewardedListener && ntf.method) {
            const method = (this.rewardedListener as any)[ntf.method];
            if (typeof method === 'function') {
                // onAdFailedToLoad 需要传递 loadAdError 参数
                if (ntf.method === 'onAdFailedToLoad') {
                    method(ntf.loadAdError);
                } else {
                    // onAdLoaded 不需要参数
                    method();
                }
            }
        }
    }

    private onFullScreenContentNotification = (ntfStr: any) => {
        // 解析 JSON 字符串
        const ntf: RewardedFullScreenContentNotification = typeof ntfStr === 'string' ? JSON.parse(ntfStr) : ntfStr;
        log(module, `onFullScreenContentNotification, method: ${ntf.method}, unitId: ${ntf.unitId}`);

        if (this.rewardedListener && ntf.method) {
            const method = (this.rewardedListener as any)[ntf.method];
            if (typeof method === 'function') {
                // onAdFailedToShowFullScreenContent 需要传递 adError 参数
                if (ntf.method === 'onAdFailedToShowFullScreenContent') {
                    method(ntf.adError);
                } else {
                    // 其他方法不需要参数：onAdClicked, onAdDismissedFullScreenContent, onAdImpression, onAdShowedFullScreenContent
                    method();
                }
            }
        }
    }

    private onOnUserEarnedRewardNotification = (ntfStr: any) => {
        // 解析 JSON 字符串
        const ntf: OnUserEarnedRewardNotification = typeof ntfStr === 'string' ? JSON.parse(ntfStr) : ntfStr;
        log(module, `onOnUserEarnedRewardNotification, rewardType: ${ntf.rewardType}, amount: ${ntf.rewardAmount}, unitId: ${ntf.unitId}`);

        if (this.rewardedListener) {
            const onUserEarnedRewardListener = this.rewardedListener as OnUserEarnedRewardListener;
            if (onUserEarnedRewardListener && typeof onUserEarnedRewardListener.onEarn === 'function') {
                onUserEarnedRewardListener.onEarn(ntf.rewardType, ntf.rewardAmount);
            }
        }
    }

    private onPaidEvent = (ntfStr: any) => {
        // 解析 JSON 字符串
        const ntf: RewardedPaidEventNotification = typeof ntfStr === 'string' ? JSON.parse(ntfStr) : ntfStr;
        log(module, `onPaidEvent, valueMicros: ${ntf.valueMicros}, currencyCode: ${ntf.currencyCode}, unitId: ${ntf.unitId}`);

        if (this.rewardedListener) {
            const paid = this.rewardedListener as OnPaidEventListener<RewardedPaidEventNotification>;
            if (paid && typeof paid.onPaidEvent === 'function') {
                paid.onPaidEvent(ntf);
            }
        }
    }
}