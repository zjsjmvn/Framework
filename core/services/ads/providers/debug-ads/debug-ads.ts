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

/** 调试广告 provider：用本地 DebugAdsView 模拟插屏、banner 和激励视频流程。 */
export default class DebugAds implements IAdProvider {
    name: string;
    isShowingRewardVideo: boolean;
    isShowingInterstitial: boolean;
    private banner: Node = null;
    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiConfigArr: Array<GeZiAdConfig>) {

    }
    showInterstitial(): Promise<ShowInterstitialAdCallBackMsg> {
        return new Promise((resolve, reject) => {
            // 调试插屏通过临时节点展示，关闭后回调 AdsManager 期望的结果结构。
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
            // 激励视频调试视图负责模拟成功/失败/跳过，provider 只负责转成 Promise。
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

