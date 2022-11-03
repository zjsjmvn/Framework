import { RewardVideoCallBackMsg } from '../AdsManager';
export interface IAdProvider {

    name: string;
    showInterstitial();
    showBanner(style): Promise<boolean>;
    hideBanner();
    hasRewardVideo(position): boolean;
    showRewardVideo(position): Promise<RewardVideoCallBackMsg>;
    preloadRewardVideo(): Promise<boolean>;
    hasInterstitial(): boolean;
    preloadInterstitial(): Promise<boolean>;


}
