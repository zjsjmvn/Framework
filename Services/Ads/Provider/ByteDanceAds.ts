import { RewardVideoCallBackMsg } from '../AdsManager';
import { IAdProvider } from './IAdvertiser';
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

    name
    private bannerId: string = null;
    private bannerAd: tt.BannerAd = null;
    private interstitialId: string = null;
    private interstitialAd = null;

    private rewardedVideoAd: tt.RewardedVideoAd = null;
    private rewardCallBack: Function = null;
    private interstitialAdCallBack: Function = null;
    private hasRewardAdInCache: boolean = false;
    private hasInterstitialAdInCache: boolean = false;


    /**
     *Creates an instance of ByteDanceAds.
     * @param {*} rewardVideoId
     * @param {*} bannerId
     * @memberof ByteDanceAds
     */
    constructor(rewardVideoId, bannerId, interstitialID) {
        this.initRewardVideo(rewardVideoId);
        this.initBanner(bannerId)
        this.initInterstitial(interstitialID);
    }
    hasInterstitial(): boolean {
        return true;
    }
    preloadInterstitial(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    private initRewardVideo(rewardVideoId) {
        if (!!window.tt && !!window.tt.createRewardedVideoAd) {
            let self = this;
            //视频
            let adInfo = {
                adUnitId: rewardVideoId
            };

            this.rewardedVideoAd = window.tt.createRewardedVideoAd(adInfo);
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
                this.hasRewardAdInCache = true;

            });
            this.rewardedVideoAd.onError(err => {
                console.log('激励视频播放失败', err)
                this.hasRewardAdInCache = false;

            });
            this.rewardedVideoAd.onClose(res => {
                // 用户点击了【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是一个 undefined
                if (!!res && res.isEnded || res === undefined) {
                    cc.log('tt rewardvideo success', JSON.stringify(res));
                    if (!!this.rewardCallBack) {
                        this.rewardCallBack(true);
                    }
                } else {
                    if (!!this.rewardCallBack) {
                        this.rewardCallBack(false);
                    }
                }
            });

            this.preloadRewardVideo();
        } else {
            console.error("ByteDanceAds：并不是头条平台，却引用了头条的广告组件");
        }
    }
    private initBanner(bannerId) {
        this.bannerId = bannerId;
    }

    private initInterstitial(interstitialId) {
        if (!!window.tt && !!window.tt.createInterstitialAd) {
            this.interstitialId = interstitialId;
            this.createInterstitialAds();
        }
    }
    private createInterstitialAds() {
        if (!!window.tt && !!window.tt.createInterstitialAd) {
            const isDouyin = tt.getSystemInfoSync().appName === "Douyin";
            if (isDouyin) {
                if (this.interstitialAd) {
                    this.interstitialAd.destroy();
                    this.interstitialAd = null;
                }
                this.interstitialAd = tt.createInterstitialAd({
                    adUnitId: this.interstitialId
                });
                this.interstitialAd.onLoad(() => {
                    console.log('插页广告加载成功')
                    this.hasInterstitialAdInCache = true;

                });
                this.interstitialAd.onError(err => {
                    console.log('插页广告 播放失败', err)
                    this.hasInterstitialAdInCache = false;

                });
                this.interstitialAd.onClose(res => {
                    console.log('插页广告关闭')
                    this.interstitialAdCallBack(true);
                    this.interstitialAdCallBack = null;

                });
            }
        }
    }
    showBanner(style: tt.RectanbleStyle): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (window.tt && window.tt.createBannerAd) {
                console.log(JSON.stringify(style));
                let param = {
                    adUnitId: this.bannerId,
                    style: style
                };
                this.bannerAd = window.tt.createBannerAd(param);
                this.bannerAd.onError(err => {
                    console.log("ByteDance banner error: ", err)
                    resolve(false)
                });

                this.bannerAd.onLoad(() => {
                    console.log('tt banner 广告加载成功')
                    resolve(true);
                    this.bannerAd.show();
                });
                //TODO: 这个地方会让广告在屏幕最下居中。
                this.bannerAd.onResize(size => {
                    // good
                    console.log(size.width, size.height);
                    let width = cc.view.getFrameSize().width;
                    let height = cc.view.getFrameSize().height;

                    this.bannerAd.style.top = height - size.height;
                    this.bannerAd.style.left = (width - size.width) / 2;

                });
            };
        })
    }

    showInterstitial(): Promise<boolean> {
        this.createInterstitialAds();
        return new Promise((resolve, reject) => {
            const isDouyin = tt.getSystemInfoSync().appName === "Douyin";
            // 插屏广告仅今日头条安卓客户端支持
            if (isDouyin) {
                this.interstitialAd
                    .load()
                    .then(() => {
                        this.interstitialAd.show().then(() => {
                            this.interstitialAdCallBack = (result) => {
                                resolve(result);
                            }
                        }).catch(err => {
                            console.log('show', err);
                            resolve(false);
                        })
                    })
                    .catch(err => {
                        console.log('load', err);
                        resolve(false);
                    });
            } else {
                resolve(false);
            }
        })
    }
    showRewardVideo(): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log("ByteDanceAds showRewardVideo");
            this.rewardCallBack = (result: boolean) => {
                let msg = new RewardVideoCallBackMsg();
                if (result == true) {
                    msg.result = true;
                } else {
                    msg.errMsg = "广告被关闭，奖励失败";
                }
                cc.log("showRewardVideo msg", msg.errMsg);
                resolve(msg);
                this.rewardCallBack = null;
            }
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.show().then(() => {
                    console.log('广告显示成功');
                }).catch((err) => {
                    console.log('广告组件出现问题', err);
                    let msg = new RewardVideoCallBackMsg();
                    msg.result = false;
                    msg.errMsg = TTRewardVideoErrMsg[err.errCode] || '广告播放失败';
                    resolve(msg);
                });
            } else {
                cc.error("rewardedVideoAd 无效");
            }

        })
    }
    hideBanner() {
        if (!!this.bannerAd) {
            this.bannerAd.destroy();
        }
    }

    /**
     * @description 预加载广告
     * @date 2019-09-09
     * @returns {Promise<boolean>}
     * @memberof ByteDanceAds
     */
    preloadRewardVideo(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.load()
                    .then(() => {
                        console.log('ByteDanceAds 拉取视频广告成功');
                        this.hasRewardAdInCache = true;
                        resolve(true);
                    })
                    .catch(() => {
                        console.log('ByteDanceAds 拉取视频广告失败');
                        this.hasRewardAdInCache = false;
                        resolve(false);
                    })
            } else {
                // 广告组件无效则直接返回false
                resolve(false);
            }
        })
    }


    hasRewardVideo(): boolean {
        return this.hasRewardAdInCache;
    }

}
