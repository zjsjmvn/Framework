import { ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../ads-manager';
export interface IAdProvider {
    isShowingRewardVideo?: boolean;
    isShowingInterstitial?: boolean;
    showInterstitial(posName: string): Promise<ShowInterstitialAdCallBackMsg>;
    showBanner(posName: string): Promise<boolean>;
    hideBanner(posName: string);
    hasRewardVideo(posName: string): boolean;
    showRewardVideo(posName: string): Promise<ShowRewardVideoCallBackMsg>;
    preloadRewardVideo(): Promise<boolean>;
    hasInterstitial(posName: string): boolean;
    preloadInterstitial(): Promise<boolean>;


    haveCacheVideo?(posName: string): boolean;
}

