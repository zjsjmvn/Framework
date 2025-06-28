import { Node, _decorator, director, log, UITransform } from 'cc';
import { IAdProvider } from '../iad-provider';
import { InterstitialConfig, BannerConfig, GeZiAdConfig, ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg, RewardVideoConfig } from '../../ads-manager';
import DebugAdsView from './debug-ads-view';

export enum DebugAdsEnum {
    Banner = 0,
    Interstitial = 1,
    Reward = 2,
}


const { ccclass, property } = _decorator;
@ccclass

export default class DebugAds implements IAdProvider {
    name: string;
    isShowingRewardVideo: boolean;
    isShowingInterstitial: boolean;
    private banner: Node = null;
    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiConfigArr: Array<GeZiAdConfig>) {

    }
    showInterstitial(): Promise<ShowInterstitialAdCallBackMsg> {
        return new Promise((resolve, reject) => {
            this.isShowingInterstitial = true;
            let node = new Node('DebugAds');
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result) => {
                this.isShowingInterstitial = false;
                resolve(result);
            }
            debugAdsView.initInterstitialAds(callback);
        })
    }
    showBanner(style: any): Promise<boolean> {

        return new Promise((resolve, reject) => {
            if (!this.banner) {
                this.banner = new Node('Banner');
                let debugAdsView = this.banner.addComponent(DebugAdsView);
                debugAdsView.initBanner();
            }

            resolve(true);
        })
    }
    hideBanner() {
        if (this.banner) {
            this.banner.removeFromParent();
        }
        this.banner = null;
    }
    hasRewardVideo(position: any): boolean {
        return true;
    }
    showRewardVideo(position: any): Promise<ShowRewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            log("DebugAds showVideo ")
            let node = new Node('DebugAdsView');
            node.addComponent(UITransform);
            this.isShowingRewardVideo = true;
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result: ShowRewardVideoCallBackMsg) => {
                this.isShowingRewardVideo = false;
                resolve(result);
            }
            debugAdsView.initRewardAds(callback);
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


