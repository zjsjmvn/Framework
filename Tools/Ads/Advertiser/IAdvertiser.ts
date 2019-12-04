import { RewardVideoCallBackMsg } from '../AdsManager';
export interface IAdvertiser {


    // init();
    showRewardVideo(): Promise<RewardVideoCallBackMsg>;
    showInterstitial();
    showBanner(style?);
    hideBanner();
    hasRewardVideo(): boolean;
    preloadRewardVideo(): Promise<boolean>;

}
