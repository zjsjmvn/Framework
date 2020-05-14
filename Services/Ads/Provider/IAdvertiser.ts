import { RewardVideoCallBackMsg } from '../AdsManager';
export interface IAdProvider {

    showRewardVideo(): Promise<RewardVideoCallBackMsg>;
    showInterstitial();
    showBanner(style): Promise<boolean>;
    hideBanner();
    hasRewardVideo(): boolean;
    preloadRewardVideo(): Promise<boolean>;
    hasInterstitial(): boolean;
    preloadInterstitial(): Promise<boolean>;


}
