// import { screen } from 'cc';
// import { RewardVideoCallBackMsg } from '../ads-manager';
// import { IAdProvider } from './iad-provider';

// export const QQRewardVideoErrMsg = {
//     1000: '后端接口调用失败',
//     1001: '参数错误',
//     1002: '广告单元无效',
//     1003: '内部错误',
//     1004: '今日广告已达上限',//无合适广告
//     1005: '广告组件审核中',
//     1006: '广告组件被驳回',
//     1007: '广告组件被封禁',
//     1008: '广告单元已关闭',
// };


// export default class QQAds implements IAdProvider {


//     private bannerAd: qq.BannerAd = null;
//     private rewardedVideoAd: qq.RewardedVideoAd = null;
//     private rewardCallBack: Function = null;
//     private hasRewardAdInCache: boolean = false;
//     private bannerId: string = null;
//     private interstitialId: string = null;
//     private interstitialAd = null;
//     private interstitialAdCallBack: Function = null;


//     /**
//      *Creates an instance of QQAds.
//      * @param {*} rewardVideoId
//      * @param {*} bannerId
//      * @memberof QQAds
//      */
//     constructor(rewardVideoId, bannerId, interstitialId) {
//         this.initRewardVideo(rewardVideoId);
//         this.initBanner(bannerId)
//         this.initInterstitial(interstitialId)
//     }

//     private initRewardVideo(rewardVideoId) {
//         if (!!window.qq && !!window.qq.createRewardedVideoAd) {
//             //视频
//             let adInfo = {
//                 adUnitId: rewardVideoId
//             };

//             this.rewardedVideoAd = window.qq.createRewardedVideoAd(adInfo);
//             this.rewardedVideoAd.onLoad(() => {
//                 console.log('激励视频 广告加载成功')
//                 this.hasRewardAdInCache = true;

//             });
//             this.rewardedVideoAd.onError(err => {
//                 console.log('激励视频播放失败', err)
//                 this.hasRewardAdInCache = false;

//             });
//             this.rewardedVideoAd.onClose(res => {
//                 if (!!res && res.isEnded || res === undefined) {
//                     log('qq rewardvideo success', JSON.stringify(res));
//                     if (!!this.rewardCallBack) {
//                         this.rewardCallBack(true);
//                     }
//                 } else {
//                     if (!!this.rewardCallBack) {
//                         this.rewardCallBack(false);
//                     }
//                 }
//             });

//             this.preloadRewardVideo();
//         } else {
//             console.error("ByteDanceAds：并不是qq平台，却引用了qq的广告组件");
//         }
//     }
//     private initBanner(bannerId) {
//         this.bannerId = bannerId;
//     }
//     private initInterstitial(interstitialId) {
//         if (!!window.qq && !!window.qq.createRewardedVideoAd) {
//             this.interstitialId = interstitialId;
//             this.createInterstitialAds();
//         }
//     }
//     //------------------------ banner
//     showBanner(style: qq.RectanbleStyle): Promise<boolean> {
//         return new Promise((resolve, reject) => {
//             if (window.qq && window.qq.createBannerAd) {
//                 log(JSON.stringify(style));
//                 let param = {
//                     adUnitId: this.bannerId,
//                     style: style
//                 };
//                 this.bannerAd = window.qq.createBannerAd(param);
//                 this.bannerAd.onError(err => {
//                     console.log("QQ banner error: ", err);
//                     resolve(false)
//                 });
//                 this.bannerAd.onLoad(() => {
//                     console.log('QQ banner 加载成功')
//                     this.bannerAd.show();
//                     resolve(true);

//                     // this.bannerAd.style.width = style.width + 1;
//                 });
//                 this.bannerAd.onResize(size => {
//                     console.log('Resize后正式宽高:', size.width, size.height);
//                     let width = screen.windowSize.width;
//                     let height = screen.windowSize.height;
//                     this.bannerAd.style.top = height - size.height;
//                     this.bannerAd.style.left = (width - size.width) / 2;
//                 });
//             };
//         })

//     }
//     hideBanner() {
//         if (!!this.bannerAd) {
//             this.bannerAd.destroy();
//         }
//     }


//     //------------------------ interstitial
//     private createInterstitialAds() {

//         // if (this.interstitialAd) {
//         //     this.interstitialAd.destroy();
//         //     this.interstitialAd = null;
//         // }
//         this.interstitialAd = qq.createInterstitialAd({
//             adUnitId: this.interstitialId
//         });
//         this.interstitialAd.onLoad(() => {
//             console.log('插页广告加载成功')

//         });
//         this.interstitialAd.onError(err => {
//             console.log('插页广告 播放失败', err)

//         });
//         this.interstitialAd.onClose(res => {
//             console.log('插页广告关闭')
//             this.interstitialAdCallBack(true);
//             this.interstitialAdCallBack = null;
//         });

//     }

//     preloadInterstitial(): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }

//     hasInterstitial(): boolean {
//         return true;
//     }
//     showInterstitial(): Promise<boolean> {
//         // this.createInterstitialAds();
//         return new Promise((resolve, reject) => {
//             // 插屏广告仅今日头条安卓客户端支持
//             this.interstitialAd
//                 .load()
//                 .then(() => {
//                     this.interstitialAd.show().then(() => {
//                         this.interstitialAdCallBack = (result) => {
//                             resolve(result);
//                         }
//                     }).catch(err => {
//                         console.log('show', err);
//                         resolve(false);
//                     })
//                 })
//                 .catch(err => {
//                     console.log('load', err);
//                     resolve(false);
//                 });
//         })
//     }

//     //------------------------ reward

//     /**
//      * @description 预加载广告
//      * @date 2019-09-09
//      * @returns {Promise<boolean>}
//      * @memberof QQAds
//      */
//     preloadRewardVideo(): Promise<boolean> {
//         return new Promise((resolve, reject) => {
//             if (!!this.rewardedVideoAd) {
//                 this.rewardedVideoAd.load()
//                     // todo

//                     .then(() => {
//                         console.log('QQAds 拉取视频广告成功');
//                         this.hasRewardAdInCache = true;
//                         resolve(true);
//                     })
//                     .catch(() => {
//                         console.log('QQAds 拉取视频广告失败');
//                         this.hasRewardAdInCache = false;
//                         resolve(false);
//                     })
//             } else {
//                 // 广告组件无效则直接返回false
//                 resolve(false);
//             }
//         })
//     }

//     hasRewardVideo(): boolean {
//         return this.hasRewardAdInCache;
//     }

//     showRewardVideo(): Promise<RewardVideoCallBackMsg> {
//         return new Promise((resolve, reject) => {
//             log("QQ showRewardVideo");
//             this.rewardCallBack = (result: boolean) => {
//                 let msg = new RewardVideoCallBackMsg();
//                 if (result == true) {
//                     msg.result = true;
//                 } else {
//                     msg.errMsg = "广告被关闭，奖励失败";
//                 }
//                 log("showRewardVideo msg", msg.errMsg);
//                 resolve(msg);
//                 this.rewardCallBack = null;
//             }
//             if (!!this.rewardedVideoAd) {
//                 this.rewardedVideoAd.show().then(() => {
//                     console.log('广告显示成功');
//                 }).catch((err) => {
//                     console.log('广告组件出现问题', err);
//                     let msg = new RewardVideoCallBackMsg();
//                     msg.result = false;
//                     msg.errMsg = QQRewardVideoErrMsg[err.errCode] || '广告播放失败';
//                     resolve(msg);
//                 });
//             } else {
//                 error("rewardedVideoAd 无效");
//             }

//         })
//     }
// }
