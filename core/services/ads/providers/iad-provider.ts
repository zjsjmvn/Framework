import { RewardVideoConfig, InterstitialConfig, BannerConfig, GeZiAdConfig, ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../ads-manager';

/** 广告 provider 统一接口；不同平台只需要实现这些加载、展示、预载和缓存能力。 */
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
