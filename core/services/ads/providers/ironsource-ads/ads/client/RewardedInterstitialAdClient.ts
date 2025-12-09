
import { log } from "cc";
import { AdClient } from "./AdClient";
import { LoadRewardedInterstitialAdACK, LoadRewardedInterstitialAdREQ, OnUserEarnedRewardedInterstitialListenerNTF, RewardedInterstitialAdLoadCallbackNTF, ShowRewardedInterstitialAdACK, ShowRewardedInterstitialAdREQ } from "../../proto/RewardedInterstitialAd";
import { RewardedInterstitialListener } from "../listener/RewardedInterstitialListener";
import { OnUserEarnedRewardListener } from "../listener/OnUserEarnedRewardListener";
import { RewardedInterstitialPaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";

/**
 * @zh
 * 插页式激励广告的广告客户端
 * https://developers.google.com/admob/android/rewarded-interstitial?hl=zh-cn
 * 
 * @en
 * The RewardedInterstitial Ad Client
 */
const module = "[RewardedInterstitialAdClient]";
export class RewardedInterstitialAdClient extends AdClient {

    /**
     * @zh
     * 监听器的联合
     * @en
     * The union of all listeners
     */
    private _rewardedInterstitialListener: RewardedInterstitialListener

    /**
     * @zh
     * 监听器的联合
     * @en
     * The union of all listeners
     */
    set rewardedInterstitialListener(value: RewardedInterstitialListener) {
        if (this._rewardedInterstitialListener) {
            this.removeEventListener("RewardedInterstitialAdLoadCallbackNTF", this.onRewardedInterstitialAdLoadCallbackNTF, this);
            this.removeEventListener("OnUserEarnedRewardedInterstitialListenerNTF", this.onOnUserEarnedRewardListenerNTF, this);
            this.removeEventListener("RewardedInterstitialPaidEventNotification", this.onPaidEvent, this);
        }

        this._rewardedInterstitialListener = value;
        if (this._rewardedInterstitialListener) {
            this.addEventListener("RewardedInterstitialAdLoadCallbackNTF", this.onRewardedInterstitialAdLoadCallbackNTF, this);
            this.addEventListener("OnUserEarnedRewardedInterstitialListenerNTF", this.onOnUserEarnedRewardListenerNTF, this);
            this.addEventListener("RewardedInterstitialPaidEventNotification", this.onPaidEvent, this);
        }
    }

    /**
     * @zh
     * 监听器的联合
     * @en
     * The union of all listeners
     */
    get rewardedInterstitialListener(): RewardedInterstitialListener {
        return this._rewardedInterstitialListener;
    }

    /**
     * @zh
     * 加载 
     * @param unitId 
     * @param listener 
     */
    load(unitId: string, listener: RewardedInterstitialListener) {
        this.destroy();
        this.unitId = unitId;
        this.rewardedInterstitialListener = listener;
        this.sendToNative("LoadRewardedInterstitialAdREQ", { unitId: unitId });
    }

    /**
     * @zh
     * 销毁插页式激励广告注册的事件
     * @en
     * Deregister all registered event listeners
     */
    destroy() {
        if (this._rewardedInterstitialListener) {
            this.removeEventListener("RewardedInterstitialAdLoadCallbackNTF", this.onRewardedInterstitialAdLoadCallbackNTF, this);
            this.removeEventListener("OnUserEarnedRewardedInterstitialListenerNTF", this.onOnUserEarnedRewardListenerNTF, this);
            this.removeEventListener("RewardedInterstitialPaidEventNotification", this.onPaidEvent, this);
        }
        this._rewardedInterstitialListener = null;
        super.destroy();
    }

    /**
     * @zh
     * 展示已加载插页式激励广告
     * @en
     * Show the loaded RewardedInterstitial Ad.
     */
    show() {
        this.sendToNative("ShowRewardedInterstitialAdREQ", { unitId: this.unitId });
    }

    private onRewardedInterstitialAdLoadCallbackNTF = (ntf: RewardedInterstitialAdLoadCallbackNTF) => {
        log(module, "onRewardedInterstitialAdLoadCallbackNTF", ntf.method);
        const method = this.rewardedInterstitialListener[ntf.method];
        if (method) {
            method(ntf.loadAdError);
        }
    }

    private onOnUserEarnedRewardListenerNTF = (ntf: OnUserEarnedRewardedInterstitialListenerNTF) => {
        log(module, `onOnUserEarnedRewardListenerNTF`);
        if (this.rewardedInterstitialListener) {
            const onEarn = this.rewardedInterstitialListener as OnUserEarnedRewardListener;
            if (onEarn && onEarn.onEarn) {
                onEarn.onEarn(ntf.rewardType, ntf.rewardAmount);
            }
        }
    }

    private onPaidEvent = (ntf: RewardedInterstitialPaidEventNotification) => {
        const paid = this.rewardedInterstitialListener as OnPaidEventListener<RewardedInterstitialPaidEventNotification>;
        if (paid && paid.onPaidEvent) {
            paid.onPaidEvent(ntf);
        }
    }
}
