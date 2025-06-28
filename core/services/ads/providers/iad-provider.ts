import { RewardVideoConfig, InterstitialConfig, BannerConfig, GeZiAdConfig, ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../ads-manager';
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
    preloadInterstitial(posName: string): Promise<boolean>;
    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiConfigArr: Array<GeZiAdConfig>);

    haveCacheVideo?(posName: string): boolean;
}

