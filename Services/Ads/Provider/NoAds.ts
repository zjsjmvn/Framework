import { RewardVideoCallBackMsg, ShowInterstitialAdCallBackMsg } from "../AdsManager";
import { IAdProvider } from "./IAdProvider";



export default class NoAds implements IAdProvider {
    name: string;
    isShowingRewardVideo: boolean;
    isShowingInterstitial: boolean;
    private banner: Node = null;
    init() {

    }
    showInterstitial(): Promise<ShowInterstitialAdCallBackMsg> {
        return new Promise((resolve, reject) => {
            let result = new ShowInterstitialAdCallBackMsg();
            result.success = true;
            resolve(result);
        })
    }
    showBanner(style: any): Promise<boolean> {

        return new Promise((resolve, reject) => {
            resolve(true);
        })
    }
    hideBanner() {

    }
    hasRewardVideo(position: any): boolean {
        return true;
    }
    showRewardVideo(position: any): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            let result = new RewardVideoCallBackMsg();
            result.result = true;
            resolve(result);
        })
    }
    preloadRewardVideo(): Promise<boolean> {
        return Promise.resolve(true);
    }
    hasInterstitial(): boolean {
        return true;
    }
    preloadInterstitial(): Promise<boolean> {
        return Promise.resolve(true);
    }



}

