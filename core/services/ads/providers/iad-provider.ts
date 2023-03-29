import { ShowRewardVideoCallBackMsg } from '../ads-manager';
export interface IAdProvider {
    showInterstitial(posName: string);
    showBanner(style, posName: string): Promise<boolean>;
    hideBanner(posName: string);
    hasRewardVideo(posName: string): boolean;
    showRewardVideo(posName: string): Promise<ShowRewardVideoCallBackMsg>;
    preloadRewardVideo(): Promise<boolean>;
    hasInterstitial(posName: string): boolean;
    preloadInterstitial(): Promise<boolean>;


}
