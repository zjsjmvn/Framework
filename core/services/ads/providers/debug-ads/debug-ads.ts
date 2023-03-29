import { ShowRewardVideoCallBackMsg, AdsManager } from '../../ads-manager';
import { IAdProvider } from '../iad-provider';
import { Node, _decorator, director, log, UITransform } from 'cc';
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
    private banner: Node = null;
    showInterstitial() {
        return new Promise((resolve, reject) => {
            let node = new Node('DebugAds');
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result) => {
                resolve(result);
            }
            debugAdsView.initInterstitialAds(callback);
        })
    }
    showBanner(style: any): Promise<boolean> {
        if (!this.banner) {
            this.banner = new Node('Banner');
            let debugAdsView = this.banner.addComponent(DebugAdsView);
            debugAdsView.initBanner();
        }
        return Promise.resolve(true);
    }
    hideBanner() {
        this.banner.removeFromParent();
    }
    hasRewardVideo(position: any): boolean {
        return true;
    }
    showRewardVideo(position: any): Promise<ShowRewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            log("DebugAds showVideo ")
            let node = new Node('DebugAdsView');
            node.addComponent(UITransform);
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result: ShowRewardVideoCallBackMsg) => {
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


