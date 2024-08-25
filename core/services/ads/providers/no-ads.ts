import { Node, _decorator, director, log, UITransform } from 'cc';
import { ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../ads-manager';
import { IAdProvider } from './iad-provider';

export enum DebugAdsEnum {
    Banner = 0,
    Interstitial = 1,
    Reward = 2,
}


const { ccclass, property } = _decorator;
@ccclass

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
    showRewardVideo(position: any): Promise<ShowRewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            let result = new ShowRewardVideoCallBackMsg();
            result.success = true;
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


