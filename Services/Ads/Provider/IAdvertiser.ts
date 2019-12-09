import { RewardVideoCallBackMsg } from '../AdsManager';
export interface IAdProvider {


    // init();
    showRewardVideo(): Promise<RewardVideoCallBackMsg>;
    showInterstitial();
    showBanner(style?);
    hideBanner();
    hasRewardVideo(): boolean;
    preloadRewardVideo(): Promise<boolean>;

}
