import { RewardVideoCallBackMsg, AdsManager } from '../../AdsManager';
import DebugAdsView from './DebugAdsUI';
import { IAdProvider } from '../IAdProvider';

export enum DebugAdsEnum {
    Banner = 0,
    Interstitial = 1,
    Reward = 2,
}


const { ccclass, property } = cc._decorator;
@ccclass

export default class DebugAds implements IAdProvider {
    name: string;
    showInterstitial() {
        return new Promise((resolve, reject) => {
            let node = new cc.Node('DebugAds');
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result) => {
                resolve(result);
            }
            debugAdsView.initInterstitialAds(callback);
        })
    }
    showBanner(style: any): Promise<boolean> {
        if (cc.director.getScene()) {
            let banner = cc.director.getScene().getChildByName('Banner');
            if (!banner) {
                let node = new cc.Node('Banner');
                let debugAdsView = node.addComponent(DebugAdsView);
                debugAdsView.initBanner();
                cc.log('showBanner', node.parent);
                cc.director.getScene().addChild(node);
                return Promise.resolve(true);
            }
        }
    }
    hideBanner() {
        if (cc.director.getScene()) {
            let banner = cc.director.getScene().getChildByName('Banner');
            if (banner) {
                banner.getComponent(DebugAdsView).close();
            }
        }
    }
    hasRewardVideo(position: any): boolean {
        return true;
    }
    showRewardVideo(position: any): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log("DebugAds showVideo ")
            let node = new cc.Node('DebugAdsView');
            let debugAdsView: DebugAdsView = node.addComponent(DebugAdsView);
            let callback = (result: RewardVideoCallBackMsg) => {
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
