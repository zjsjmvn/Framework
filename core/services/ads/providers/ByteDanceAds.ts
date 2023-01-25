import { RewardVideoCallBackMsg, InterstitialAdBundle, BannerAdBundle, RewardVideoBundle } from '../AdsManager';
import { IAdProvider } from './IAdProvider';
import { error, log, screen, view } from 'cc';
/**
 * 激励广告播放失败代码翻译
 */
export const TTRewardVideoErrMsg = {
    1000: '后端接口调用失败',
    1001: '参数错误',
    1002: '广告单元无效',
    1003: '内部错误',
    1004: '今日广告已达上限',//无合适广告
    1005: '广告组件审核中',
    1006: '广告组件被驳回',
    1007: '广告组件被封禁',
    1008: '广告单元已关闭',
};



export default class ByteDanceAds implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();

    constructor(rewardVideosMap: Map<string, string>, interstitialAdsMap: Map<string, string>, bannersMap: Map<string, string>) {
        this.initRewardVideos(rewardVideosMap);
        this.initInterstitialAds(interstitialAdsMap);
        this.initBanners(bannersMap);
    }


    //#region 插屏广告
    hasInterstitial(): boolean {
        return true;
    }
    preloadInterstitial(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    private initInterstitialAds(interstitialAdsMap: Map<string, string>) {
        interstitialAdsMap?.forEach((value, key) => {
            let bundle = new InterstitialAdBundle();
            bundle.interstitialId = value;
            this.interstitialInstanceMap.set(key, bundle);
        });
    }
    public showInterstitial(posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let bundle = this.interstitialInstanceMap.get(posName);
            if (!!bundle) {
                this.createInterstitialAdsWithBundle(bundle);
                const isDouyin = tt.getSystemInfoSync().appName === "Douyin";
                // 插屏广告仅今日头条安卓客户端支持
                if (isDouyin) {
                    bundle.interstitialInstance
                        .load()
                        .then(() => {
                            bundle.interstitialInstance.show().then(() => {
                            }).catch(err => {
                                console.log('show', err);
                                resolve(false);
                            })
                        })
                        .catch(err => {
                            console.log('load', err);
                            resolve(false);
                        });
                    let onCloseFunc = res => {
                        console.log('>> ByteDanceAds::插页广告关闭')
                        bundle.interstitialInstance.offClose(onCloseFunc);
                        resolve(true);
                    }
                    bundle.interstitialInstance.onClose(onCloseFunc);
                } else {
                    resolve(false);
                }
            } else {
                error(`>> ByteDanceAds::showInterstitial 无法找到posName=${posName}的广告`);
                return Promise.reject(false);
            }
        });
    }

    private createInterstitialAdsWithBundle(bundle: InterstitialAdBundle) {
        if (!!window.tt && !!window.tt.createInterstitialAd) {
            const isDouyin = tt.getSystemInfoSync().appName === "Douyin";
            if (isDouyin) {
                if (bundle.interstitialInstance) {
                    bundle.interstitialInstance.destroy();
                    bundle.interstitialInstance = null;
                }
                bundle.interstitialInstance = tt.createInterstitialAd({
                    adUnitId: bundle.interstitialId
                });
                bundle.interstitialInstance.onLoad(() => {
                    console.log('插页广告加载成功')
                    bundle.hasInterstitialInCache = true;
                });
                bundle.interstitialInstance.onError(err => {
                    console.log('插页广告 播放失败', err)
                    bundle.hasInterstitialInCache = false;
                });
            }
        }
    }

    //#endregion


    //#region 视频激励广告
    private initRewardVideo(rewardVideoId, rewardVideoBundle: RewardVideoBundle) {
        if (!!window.tt && !!window.tt.createRewardedVideoAd) {
            //视频
            let adInfo = {
                adUnitId: rewardVideoId
            };
            rewardVideoBundle.rewardVideoInstance = window.tt.createRewardedVideoAd(adInfo);
            rewardVideoBundle.rewardVideoInstance.onLoad(() => {
                console.log('激励视频 广告加载成功')
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

    private initRewardVideos(rewardVideosMap: Map<string, string>) {
        rewardVideosMap?.forEach((value, key) => {
            let bundle = new RewardVideoBundle();
            this.initRewardVideo(value, bundle);
            this.rewardVideoInstanceMap.set(key, bundle);
        });
        this.preloadRewardVideo()
    }

    showRewardVideo(posName: string): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new RewardVideoCallBackMsg();
            if (bundle) {
                log(">> ByteDanceAds::showRewardVideo");
                if (!!bundle.rewardVideoInstance) {
                    let onCloseFunc = (res) => {
                        // 用户点击了【关闭广告】按钮
                        if (!!res && res.isEnded) {
                            msg.result = true;
                        } else {
                            msg.errMsg = "广告被关闭，奖励失败";
                        }
                        resolve(msg);
                        bundle.rewardVideoInstance.load();
                        // 取消
                        bundle.rewardVideoInstance.offClose(onCloseFunc);
                    }
                    bundle.rewardVideoInstance.onClose(onCloseFunc);
                    bundle.rewardVideoInstance.show().then(() => {
                        console.log('>> ByteDanceAds 广告显示成功');
                        bundle.hasRewardVideoInCache = false;
                    }).catch((err) => {
                        console.error('>> ByteDanceAds::showRewardVideo 广告组件出现问题', JSON.stringify(err));
                        msg.result = false;
                        msg.errMsg = TTRewardVideoErrMsg[err.errCode] || '广告播放失败';
                        bundle.hasRewardVideoInCache = false;
                        bundle.rewardVideoInstance.load();
                        resolve(msg);
                    });
                } else {
                    error(`>> ByteDanceAds::rewardedVideoAd rewardVideoInstance为空`);
                    msg.result = false;
                    msg.errMsg = '广告初始化失败，实例为空';
                    resolve(msg);
                }
            }
            else {
                error(`>> ByteDanceAds::rewardedVideoAd 无法找到posName=${posName}的广告`);
                msg.result = false;
                msg.errMsg = `无法找到posName=${posName}的广告`;
                resolve(msg);
            }
        })
    }
    /**
     * @description 预加载广告
     * @date 2019-09-09
     * @returns {Promise<boolean>}
     * @memberof ByteDanceAds
     */
    preloadRewardVideo(): Promise<boolean> {
        this.rewardVideoInstanceMap.forEach((value, key) => {
            if (!!value) {
                value.rewardVideoInstance.load()
                    .then(() => {
                        console.log(`ByteDanceAds ${key}拉取视频广告成功`);
                        value.hasRewardVideoInCache = true;
                    })
                    .catch(() => {
                        console.log(`ByteDanceAds ${key}拉取视频广告失败`);
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

    private initBanners(bannersMap: Map<string, string>) {
        bannersMap?.forEach((value, key) => {
            let bundle = new BannerAdBundle();
            bundle.bannerId = value;
            this.bannerInstanceMap.set(key, bundle);
        });
    }


    showBanner(style: tt.RectanbleStyle, posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let bundle = this.bannerInstanceMap.get(posName);
            if (bundle) {
                if (window.tt && window.tt.createBannerAd) {
                    console.log(JSON.stringify(style));
                    let param = {
                        adUnitId: bundle.bannerId,
                        style: style
                    };
                    bundle.bannerInstance = window.tt.createBannerAd(param);
                    bundle.bannerInstance.onError(err => {
                        console.log("ByteDance banner error: ", err)
                        resolve(false)
                    });
                    bundle.bannerInstance.onLoad(() => {
                        console.log('tt banner 广告加载成功')
                        resolve(true);
                        bundle.bannerInstance.show();
                    });
                    //TODO: 这个地方会让广告在屏幕最下居中，被写死，需要修改
                    bundle.bannerInstance.onResize(size => {
                        console.log(size.width, size.height);
                        let width = screen.windowSize.width;
                        let height = screen.windowSize.height;
                        bundle.bannerInstance.style.top = height - size.height;
                        bundle.bannerInstance.style.left = (width - size.width) / 2;
                    });
                };
            }
        })
    }

    hideBanner(posName: string) {
        let bundle = this.bannerInstanceMap.get(posName);
        bundle?.bannerInstance.destroy();
    }

    //#endregion


}




