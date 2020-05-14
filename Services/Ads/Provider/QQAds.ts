import { RewardVideoCallBackMsg } from '../AdsManager';
import { IAdProvider } from './IAdvertiser';

export const QQRewardVideoErrMsg = {
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


export default class QQAds implements IAdProvider {


    private bannerAd: qq.BannerAd = null;
    private rewardedVideoAd: qq.RewardedVideoAd = null;
    private rewardCallBack: Function = null;
    private hasRewardAdInCache: boolean = false;
    private bannerId: string = null;


    /**
     *Creates an instance of QQAds.
     * @param {*} rewardVideoId
     * @param {*} bannerId
     * @memberof QQAds
     */
    constructor(rewardVideoId, bannerId) {
        this.initRewardVideo(rewardVideoId);
        this.initBanner(bannerId)
    }
    hasInterstitial(): boolean {
        throw new Error("Method not implemented.");
    }
    preloadInterstitial(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    private initRewardVideo(rewardVideoId) {
        if (!!window.qq && !!window.qq.createRewardedVideoAd) {
            //视频
            let adInfo = {
                adUnitId: rewardVideoId
            };

            this.rewardedVideoAd = window.qq.createRewardedVideoAd(adInfo);
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
                this.hasRewardAdInCache = true;

            });
            this.rewardedVideoAd.onError(err => {
                console.log('激励视频播放失败', err)
                this.hasRewardAdInCache = false;

            });
            this.rewardedVideoAd.onClose(res => {
                if (!!res && res.isEnded || res === undefined) {
                    cc.log('qq rewardvideo success', JSON.stringify(res));
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
            console.error("ByteDanceAds：并不是qq平台，却引用了qq的广告组件");
        }
    }
    private initBanner(bannerId) {
        this.bannerId = bannerId;
    }

    showBanner(style: qq.RectanbleStyle): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (window.qq && window.qq.createBannerAd) {
                cc.log(JSON.stringify(style));
                let param = {
                    adUnitId: this.bannerId,
                    style: style
                };
                this.bannerAd = window.qq.createBannerAd(param);
                this.bannerAd.style.left = style.left;
                this.bannerAd.style.top = style.top;
                this.bannerAd.style.width = style.width;

                this.bannerAd.onError(err => {
                    console.log("QQ banner error: ", err);
                    resolve(false)
                });
                this.bannerAd.onLoad(() => {
                    console.log('QQ banner 加载成功')
                    resolve(true);
                    this.bannerAd.show();
                    this.bannerAd.style.width = style.width + 1;
                });
            };
        })

    }
    showInterstitial() {

    }
    showRewardVideo(): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log("QQ showRewardVideo");
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
                    msg.errMsg = QQRewardVideoErrMsg[err.errCode] || '广告播放失败';
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
     * @memberof QQAds
     */
    preloadRewardVideo(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.load()
                    // todo

                    .then(() => {
                        console.log('QQAds 拉取视频广告成功');
                        this.hasRewardAdInCache = true;
                        resolve(true);
                    })
                    .catch(() => {
                        console.log('QQAds 拉取视频广告失败');
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
