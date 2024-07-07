import { InterstitialAdBundle, BannerAdBundle, RewardVideoBundle, AdsManager, ShowInterstitialAdCallBackMsg, RewardVideoConfig, InterstitialConfig, BannerConfig, RewardVideoCallBackMsg } from '../AdsManager';
import { IAdProvider } from './IAdProvider';
/**
 * 激励广告播放失败代码翻译
 */
export const TTRewardVideoErrMsg = {
    1000: '后端接口调用失败',
    1001: '参数错误',
    1002: '广告单元无效',
    1003: '内部错误',
    1004: '无合适广告',//无合适广告
    1005: '广告组件审核中',
    1006: '广告组件被驳回',
    1007: '广告组件被封禁',
    1008: '广告单元已关闭',
};



export default class WeChatAds implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();


    public isShowingRewardVideo: boolean = false;

    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>) {
        this.initRewardVideos(rewardVideosConfigArr);
        this.initInterstitialAds(interstitialAdsConfigArr);
        this.initBanners(bannersConfigArr);
    }


    //#region 插屏广告
    hasInterstitial(): boolean {
        return true;
    }
    preloadInterstitial(): Promise<boolean> {
        return Promise.resolve(true);
    }
    private initInterstitialAds(interstitialAdsConfigArr: Array<InterstitialConfig>) {
        interstitialAdsConfigArr?.forEach((value) => {
            let bundle = new InterstitialAdBundle();
            bundle.interstitialId = value.id;
            this.interstitialInstanceMap.set(value.posName, bundle);
        });
    }
    public showInterstitial(posName: string): Promise<ShowInterstitialAdCallBackMsg> {
        return new Promise((resolve, reject) => {
            let bundle = this.interstitialInstanceMap.get(posName);
            if (!!bundle) {
                this.createInterstitialAdsWithBundle(bundle);
                bundle.interstitialInstance
                    .load()
                    .then(() => {
                        bundle.interstitialInstance.show().then(() => {
                        }).catch(err => {
                            console.log('show', err);
                            let msg = new ShowInterstitialAdCallBackMsg();
                            msg.success = false;
                            msg.errMsg = "无可用广告";
                            resolve(msg);
                        })
                    })
                    .catch(err => {
                        console.log('load', err);
                        let msg = new ShowInterstitialAdCallBackMsg();
                        msg.success = false;
                        msg.errMsg = "无可用广告";
                        resolve(msg);
                    });
                let onCloseFunc = res => {
                    console.log('>> WeChatAds::插页广告关闭')
                    bundle.interstitialInstance.offClose(onCloseFunc);
                    let msg = new ShowInterstitialAdCallBackMsg();
                    msg.success = true;
                    resolve(msg);
                }
                bundle.interstitialInstance.onClose(onCloseFunc);
            } else {
                cc.error(`>> WeChatAds::showInterstitial 无法找到posName=${posName}的广告`);
                let msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = `无法找到posName=${posName}的广告`;
                return Promise.reject(msg);
            }
        });
    }

    private createInterstitialAdsWithBundle(bundle: InterstitialAdBundle) {
        if (!!window.wx && !!window.wx.createInterstitialAd) {
            if (bundle.interstitialInstance) {
                bundle.interstitialInstance.destroy();
                bundle.interstitialInstance = null;
            }
            bundle.interstitialInstance = wx.createInterstitialAd({
                adUnitId: bundle.interstitialId
            });
            bundle.interstitialInstance.onLoad(() => {
                console.log('插页广告加载成功')
            });
            bundle.interstitialInstance.onError(err => {
                console.log('插页广告 播放失败', err)
                bundle.hasInterstitialInCache = false;
            });
        }
    }

    //#endregion


    //#region 视频激励广告
    private initRewardVideo(rewardVideoId, rewardVideoBundle: RewardVideoBundle) {
        if (!!window.wx && !!window.wx.createRewardedVideoAd) {
            //视频
            let adInfo = {
                adUnitId: rewardVideoId
            };
            rewardVideoBundle.rewardVideoInstance = window.wx.createRewardedVideoAd(adInfo);
            rewardVideoBundle.rewardVideoInstance.onLoad(() => {
                console.log('激励视频 广告加载成功')
                rewardVideoBundle.hasRewardVideoInCache = true;
            });
            rewardVideoBundle.rewardVideoInstance.onError(err => {
                console.log('激励视频播放失败', err)
                rewardVideoBundle.hasRewardVideoInCache = false;
            });
        } else {
            console.error("WeChatAds：并不是微信平台，却引用了微信的广告组件");
            return null;
        }

    }

    private initRewardVideos(rewardVideosConfigArr: Array<RewardVideoConfig>) {
        rewardVideosConfigArr?.forEach((value) => {
            let bundle = new RewardVideoBundle();
            this.initRewardVideo(value.id, bundle);
            this.rewardVideoInstanceMap.set(value.posName, bundle);
        });
        this.preloadRewardVideo()
    }

    showRewardVideo(posName: string): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            if (this.isShowingRewardVideo) {
                let msg = new RewardVideoCallBackMsg();
                msg.result = false;
                msg.errMsg = "广告正在播放中";
                resolve(msg);
                return;
            }
            this.isShowingRewardVideo = true;

            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new RewardVideoCallBackMsg();
            if (bundle) {
                console.log(">> WeChatAds::showRewardVideo");
                if (!!bundle.rewardVideoInstance) {
                    let onCloseFunc = (res) => {
                        // 用户点击了【关闭广告】按钮
                        if (!!res && res.isEnded) {
                            msg.result = true;
                        } else {
                            msg.errMsg = "广告被关闭，奖励失败";
                        }
                        this.isShowingRewardVideo = false;
                        console.log(">> WeChatAds::onClose");
                        resolve(msg);
                        bundle.rewardVideoInstance.load();
                        // 取消
                        bundle.rewardVideoInstance.offClose(onCloseFunc);
                    }
                    bundle.rewardVideoInstance.onClose(onCloseFunc);
                    bundle.rewardVideoInstance.show().then(() => {
                        console.log('>> WeChatAds 广告显示成功');
                        bundle.hasRewardVideoInCache = false;
                    }).catch((err) => {
                        console.error('>> WeChatAds::showRewardVideo 广告组件出现问题', JSON.stringify(err));
                        msg.result = false;
                        msg.errMsg = TTRewardVideoErrMsg[err.errCode] || '广告播放失败';
                        bundle.hasRewardVideoInCache = false;
                        bundle.rewardVideoInstance.load();
                        this.isShowingRewardVideo = false;
                        resolve(msg);
                    });
                } else {
                    cc.error(`>> WeChatAds::rewardedVideoAd rewardVideoInstance为空`);
                    this.isShowingRewardVideo = false;
                    msg.result = false;
                    msg.errMsg = '广告初始化失败，实例为空';
                    resolve(msg);
                }
            }
            else {
                cc.error(`>> WeChatAds::rewardedVideoAd 无法找到posName=${posName}的广告`);
                msg.result = false;
                this.isShowingRewardVideo = false;
                msg.errMsg = `无法找到posName=${posName}的广告`;
                resolve(msg);
            }
        })
    }
    /**
     * @description 预加载广告
     * @date 2019-09-09
     * @returns {Promise<boolean>}
     * @memberof WeChatAds
     */
    preloadRewardVideo(): Promise<boolean> {
        this.rewardVideoInstanceMap.forEach((value, key) => {
            if (!!value) {
                value.rewardVideoInstance.load()
                    .then(() => {
                        console.log(`WeChatAds ${key}拉取视频广告成功`);
                        value.hasRewardVideoInCache = true;
                    })
                    .catch(() => {
                        console.log(`WeChatAds ${key}拉取视频广告失败`);
                        value.hasRewardVideoInCache = false;
                    })
            }
        })
        return Promise.resolve(true);
    }

    hasRewardVideo(posName: string): boolean {
        let bundle = this.rewardVideoInstanceMap.get(posName);
        return bundle.hasRewardVideoInCache;
    }





    //#endregion


    //#region  banner广告

    private initBanners(bannersConfigArr: Array<BannerConfig>) {
        bannersConfigArr?.forEach((value) => {
            let bundle = new BannerAdBundle();
            bundle.bannerId = value.id;
            bundle.style = value.style;
            bundle.bannerInstance = null;
            this.bannerInstanceMap.set(value.posName, bundle);
        });
    }


    showBanner(posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let bundle = this.bannerInstanceMap.get(posName);
            if (bundle) {
                if (window.wx && window.wx.createBannerAd) {
                    let param = {
                        adUnitId: bundle.bannerId,
                        style: bundle.style || AdsManager.defaultBannerStyle(),
                        adIntervals: 50,
                    };
                    bundle.bannerInstance = window.wx.createBannerAd(param);
                    bundle.bannerInstance.onError(err => {
                        console.log("ByteDance banner error: ", err)
                        resolve(false)
                    });
                    bundle.bannerInstance.onLoad(() => {
                        console.log('wx banner 广告加载成功')
                        resolve(true);
                        bundle.bannerInstance.show();
                    });
                    bundle.bannerInstance.onResize(size => {
                        console.log(size.width, size.height);
                        // let width = screen.windowSize.width / screen.devicePixelRatio;
                        // let height = screen.windowSize.height;
                        // bundle.bannerInstance.style.top = height - size.height;
                        // bundle.bannerInstance.style.left = (width - size.width) / 2;
                    });
                };
            }
        })
    }

    hideBanner(posName: string) {
        let bundle = this.bannerInstanceMap.get(posName);
        bundle?.bannerInstance?.destroy();
        if (bundle) {
            bundle.bannerInstance = null;
        }
    }

    //#endregion


}




