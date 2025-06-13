import { ShowRewardVideoCallBackMsg, InterstitialAdBundle, BannerAdBundle, RewardVideoBundle, AdsManager, ShowInterstitialAdCallBackMsg, RewardVideoConfig, InterstitialConfig, BannerConfig, GeZiAdBundle, GeZiAdConfig } from '../ads-manager';
import { error, log, screen, view } from 'cc';
import { IAdProvider } from './iad-provider';
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
    private geZiInstanceMap: Map<string, GeZiAdBundle> = new Map();


    public isShowingRewardVideo: boolean = false;
    public isShowingInterstitial: boolean = false;

    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiAdsConfigArr: Array<GeZiAdConfig>) {
        this.initRewardVideos(rewardVideosConfigArr);
        this.initInterstitialAds(interstitialAdsConfigArr);
        this.initBanners(bannersConfigArr);
        this.initGeZi(geZiAdsConfigArr);

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
                if (bundle.bShow) return;
                this.isShowingInterstitial = true;
                bundle.bShow = true;
                this.createInterstitialAdsWithBundle(bundle);
                bundle.interstitialInstance
                    .load()
                    .then(() => {

                        bundle.interstitialInstance.show().then(() => {
                        }).catch(err => {
                            this.isShowingInterstitial = false;
                            bundle.bShow = false;
                            console.log('show', err);
                            let msg = new ShowInterstitialAdCallBackMsg();
                            msg.success = false;
                            msg.errMsg = "无可用广告";
                            resolve(msg);
                        })
                    })
                    .catch(err => {
                        this.isShowingInterstitial = false;
                        bundle.bShow = false;
                        console.log('load', err);
                        let msg = new ShowInterstitialAdCallBackMsg();
                        msg.success = false;
                        msg.errMsg = "无可用广告";
                        resolve(msg);
                    });
                let onCloseFunc = res => {
                    this.isShowingInterstitial = false;
                    bundle.bShow = false;
                    console.log('>> WeChatAds::插页广告关闭')
                    bundle.interstitialInstance.offClose(onCloseFunc);
                    let msg = new ShowInterstitialAdCallBackMsg();
                    msg.success = true;
                    resolve(msg);
                }
                bundle.interstitialInstance.onClose(onCloseFunc);
            } else {
                error(`>> WeChatAds::showInterstitial 无法找到posName=${posName}的广告`);
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
            rewardVideoBundle.rewardVideoInstance.onLoad((obj) => {
                console.log('激励视频 广告加载成功' + obj);

                rewardVideoBundle.hasRewardVideoInCache = true;
            });
            rewardVideoBundle.rewardVideoInstance.onError(err => {
                console.log('激励视频播放失败', err)
                rewardVideoBundle.hasRewardVideoInCache = false;
            });
        } else {
            console.error("ByteDanceAds：并不是头条平台，却引用了头条的广告组件");
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

    showRewardVideo(posName: string): Promise<ShowRewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            if (this.isShowingRewardVideo) {
                let msg = new ShowRewardVideoCallBackMsg();
                msg.success = false;
                msg.errMsg = "广告正在播放中";
                resolve(msg);
                return;
            }
            this.isShowingRewardVideo = true;

            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new ShowRewardVideoCallBackMsg();
            if (bundle) {
                console.log(">> WeChatAds::showRewardVideo");
                if (!!bundle.rewardVideoInstance) {
                    let onCloseFunc = (res) => {
                        // 用户点击了【关闭广告】按钮
                        if (!!res && res.isEnded) {
                            msg.success = true;
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
                        msg.success = false;
                        msg.errMsg = TTRewardVideoErrMsg[err.errCode] || '广告播放失败';
                        bundle.hasRewardVideoInCache = false;
                        bundle.rewardVideoInstance.load();
                        this.isShowingRewardVideo = false;
                        resolve(msg);
                    });
                } else {
                    error(`>> WeChatAds::rewardedVideoAd rewardVideoInstance为空`);
                    this.isShowingRewardVideo = false;
                    msg.success = false;
                    msg.errMsg = '广告初始化失败，实例为空';
                    resolve(msg);
                }
            }
            else {
                error(`>> WeChatAds::rewardedVideoAd 无法找到posName=${posName}的广告`);
                msg.success = false;
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

    public static getBannerStyleWithMinWidthAndBottom() {
        let screenWidth = screen.windowSize.width / screen.devicePixelRatio;
        let screenHeight = screen.windowSize.height / screen.devicePixelRatio;
        let bannerWidth = 300;//300是微信上最小的。
        let bannerHeight = bannerWidth / 20 * 7;// 长宽比是20：7
        let left = (screenWidth - bannerWidth) / 2;
        let top = screenHeight - bannerHeight;
        return {
            width: bannerWidth,
            height: bannerHeight,
            left: left,
            top: top
        }
    }
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
            if (bundle && !bundle.bShow) {
                bundle.bShow = true;

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
            bundle.bShow = false;
        }
    }

    //#endregion
    //#region 格子广告

    private initGeZi(geZiAdConfigArr: Array<GeZiAdConfig>) {
        console.log('>> WeChatAds::initGeZi', geZiAdConfigArr);
        geZiAdConfigArr?.forEach((value) => {
            let bundle = new GeZiAdBundle();
            bundle.geZiId = value.id;
            bundle.style = value.style;
            bundle.geZiInstance = null;
            this.geZiInstanceMap.set(value.posName, bundle);
        });
    }


    public showGeZi(posName: string) {
        console.log('>> WeChatAds::showGeZi', posName);
        let bundle = this.geZiInstanceMap.get(posName);
        if (bundle) {
            if (window.wx && window.wx.createCustomAd) {
                bundle?.geZiInstance?.destroy();
                let param = {
                    adUnitId: bundle.geZiId,
                    style: bundle.style,
                    adIntervals: 60,
                };
                bundle.geZiInstance = window.wx.createCustomAd(param);
                bundle.geZiInstance.onError(err => {
                    console.log("WeChat ge zi error: ", err)
                });
                bundle.geZiInstance.onClose(() => {
                    console.log("WeChat ge zi close: ")
                });
                bundle.geZiInstance.onResize(size => {
                    console.log("WeChat ge zi resize: ", size)
                });

                bundle.geZiInstance.show();
            };
        } else {
            error(`>> WeChatAds::showGeZi 无法找到posName=${posName}的广告`);
        }
    }
    public closeGeZi(posName: string) {
        let bundle = this.geZiInstanceMap.get(posName);
        bundle?.geZiInstance?.destroy();
        bundle.geZiInstance = null;

    }



    //#endregion


}




