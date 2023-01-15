import { RewardVideoCallBackMsg } from '../AdsManager';
export interface IAdProvider {
    showInterstitial(posName: string);
    showBanner(style, posName: string): Promise<boolean>;
    hideBanner(posName: string);
    hasRewardVideo(posName: string): boolean;
    showRewardVideo(posName: string): Promise<RewardVideoCallBackMsg>;
    preloadRewardVideo(): Promise<boolean>;
    hasInterstitial(posName: string): boolean;
    preloadInterstitial(): Promise<boolean>;
    hasMultitonRewardVideo(posName: string): boolean;

}
