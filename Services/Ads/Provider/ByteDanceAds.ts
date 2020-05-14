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


    private bannerId: string = null;
    private bannerAd: tt.BannerAd = null;
    private interstitialId: string = null;
    private rewardedVideoAd: tt.RewardedVideoAd = null;
    private rewardCallBack: Function = null;
    private hasRewardAdInCache: boolean = false;
    private hasInterstitialAdInCache: boolean = false;
    private interstitialAd = null;


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
        if (!!window.tt && !!window.tt.createRewardedVideoAd) {
            this.interstitialId = interstitialId;
            const isToutiaio = tt.getSystemInfoSync().appName === "Toutiao";
            if (isToutiaio) {
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
    showInterstitial() {
        const isToutiaio = tt.getSystemInfoSync().appName === "Toutiao";
        // 插屏广告仅今日头条安卓客户端支持
        if (isToutiaio) {
            this.interstitialAd
                .load()
                .then(() => {
                    this.interstitialAd.show();
                })
                .catch(err => {
                    console.log(err);
                });
        }
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

//激励广告
let rewardedVideoAd;
let rewardAdIdx = 0;

/**
 * @param  {function} onCloseCallback
 * @param  {function} onErrorCallback
 * @param  {} thisTarget
 */
export function createRewardedVideoAd(onCloseCallback?: Function, onErrorCallback?: Function, thisTarget?) {
    if (Utils.isMiniGame() == false) return;

    //基础库版本号 >= 2.0.4
    let sdkVersion = platform.getSystemInfoSync().SDKVersion;
    if (!sdkVersion || parseInt(sdkVersion.replace(/\./g, '')) < 204) return;

    let adInfo = { adUnitId: "" };
    //轮换广告
    if (rewardAdIdx >= LocalConfig.RewardAdList.length)
        rewardAdIdx = 0;

    console.log('激励广告：', LocalConfig.RewardAdList[rewardAdIdx]);
    adInfo.adUnitId = LocalConfig.RewardAdList[rewardAdIdx];

    if (rewardedVideoAd == null) {
        rewardedVideoAd = platform.createRewardedVideoAd(adInfo);
    }
    if (rewardedVideoAd == null) return;

    rewardedVideoAd.load().then(() => {
        rewardedVideoAd.show().catch(err => {
            console.log('创建激励广告失败：', err);
            // rewardedVideoAd.load().then(() => rewardedVideoAd.show().catch(err => {
            //     //二次失败回调
            //     onErrorCallback.call(thisTarget);
            // }));

            onErrorCallback.call(thisTarget);
        });
    });

    rewardAdIdx++;

    rewardedVideoAd.onError(onRewardAdError);

    // if(typeof(onLoadCallback) == 'function'){
    //     // rewardedVideoAd.onLoad(()=>{
    //     //     onLoadCallback.call(thisTarget, true);
    //     //     // rewardedVideoAd.show().catch(err => {
    //     //     //     rewardedVideoAd.load()
    //     //     //       .then(() => rewardedVideoAd.show());
    //     //     // });
    //     // });
    // }

    //关闭回调参数 res.isEnded:boolean 视频是否是在用户完整观看的情况下被关闭的
    let closeFunc = function (res) {
        console.log('是否看完广告：', res);

        if (res.isEnded && typeof (onCloseCallback) == 'function') {
            onCloseCallback.call(thisTarget);
        }

        rewardedVideoAd.offClose(closeFunc);
    }

    rewardedVideoAd.onClose(closeFunc);
}

function onRewardAdError(err) {
    console.log(err);
    rewardedVideoAd.offError(onRewardAdError);
}

//Banner广告
let bannerAd;
let bannerIdx = 0;

export type bannerAdInfo = {
    adUnitId?: string,
    style?: {
        left: number,
        top: number,
        width?: number,
        height?: number
    }
}

/**
 * @param  {{adUnitId:string, style:{left:number, top:number, width:number, height:number}}} adInfo
 */
export function createBannerAd(adInfo?: bannerAdInfo) {
    if (Utils.isMiniGame() == false) return;

    // left: platform.getSystemInfoSync().windowWidth * 0.5 - 100,
    //         top: platform.getSystemInfoSync().windowHeight * 0.5 + 100,
    let sysInfo = platform.getSystemInfoSync();

    //基础库版本号 >= 2.0.4
    let sdkVersion = sysInfo.SDKVersion;
    if (!sdkVersion || parseInt(sdkVersion.replace(/\./g, '')) < 204) return;

    if (!adInfo)
        adInfo = {};
    //轮换广告
    if (bannerIdx >= LocalConfig.BannerAdList.length)
        bannerIdx = 0;

    console.log('Banner广告：', LocalConfig.BannerAdList[bannerIdx]);
    adInfo.adUnitId = LocalConfig.BannerAdList[bannerIdx];

    //位置
    adInfo.style = {
        left: 0,
        top: sysInfo.windowHeight - 100,
        width: sysInfo.windowWidth,
        // height:100
    }

    if (bannerAd == null) {
        bannerAd = platform.createBannerAd(adInfo);
    } else {
        bannerAd.destroy();
        bannerAd = platform.createBannerAd(adInfo);
    }
    if (bannerAd == null) return;

    //banner位置适配
    bannerAd.onResize(res => {
        bannerAd.style.top = sysInfo.windowHeight - res.height;
        if (sysInfo.model == 'iPhone X') {
            bannerAd.style.top -= 20;
        }
    });

    bannerAd.onError(onBannerAdError);

    bannerAd.show().catch(err => {
        console.log('创建Banner广告失败：', err);
    });

    bannerIdx++;
}

function onBannerAdError(err) {
    console.log(err);
    bannerAd.offError(onBannerAdError);
}

export function hideBannerAd() {
    if (Utils.isMiniGame() == false) return;
    if (bannerAd == null) return;

    bannerAd.hide();
}