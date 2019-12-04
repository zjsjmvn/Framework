import ByteDanceAds from './Advertiser/ByteDanceAds';
import { IAdvertiser } from './Advertiser/IAdvertiser';
import DebugAds from './QingYouAds/DebugAds';
//非通用型 无QY广告
var Base64 = require("./Base64Tools");


/**
 *  TODO: 在adsmanagernew的时候，遍历自己所有的组件，执行他们的init方法。
 *  需要处理的事情。
 * 1.显示广告
 *  奖励视频
 *  插页
 *  banner
 * 
 *  1.考虑播放的时候的事情。
 *  2.考虑平台生效的问题
 *  生效某个平台的
 * 
 * 1. 首先要判断平台吗？然后根据平台添加广告组件？ 可行
 * 2. 播放的时候，设定好规则。1.轮询。2.
 * 
 * 
 * 封装广告商的能力
 * 1.播放视频广告
 * 2.播放插页广告
 * 3.播放横幅广告
 * 
 */


/**
 * @description 视频广告播放回调，如果失败就读取errMsg
 * @date 2019-09-09
 * @export
 * @class RewardVideoCallBackMsg
 */
export class RewardVideoCallBackMsg {
    result: boolean = false;
    errMsg: string = "";
}


export class AdsManager {
    /**
     * @description 单例
     * @private
     * @static
     * @type {AdsManager}
     * @memberof AdsManager
     */
    private static _instance: AdsManager = null
    public static get instance() {
        if (!AdsManager._instance) AdsManager._instance = new AdsManager();
        return AdsManager._instance;
    }


    /**
     * @description 是否已经移除广告
     * @private
     * @type {boolean}
     * @memberof AdsManager
     */
    private alreadyRemovedAds: boolean = false;
    /**
     * @description 最后一次展示插页的时间
     * @private
     * @type {number}
     * @memberof AdsManager
     */
    private _last_show_interstitial_milsec: number = 0;

    /**
     * @description 是否正在展示banner
     * @private
     * @type {boolean}
     * @memberof AdsManager
     */
    private isShowingBanner: boolean = false;



    /**
     * @description 加入的广告组件都会存在这里。
     * @private
     * @type {Array<IAdvertiser>}
     * @memberof AdsManager
     */
    private adComponentsArr: Array<IAdvertiser> = new Array<IAdvertiser>();

    constructor() {
        if (this.isNoAds()) {
            return;
        }

        // this.adComponentsArr.push(new ByteDanceAds)

    }

    public addAdvertiser(advertiser: IAdvertiser) {
        this.adComponentsArr.push(advertiser);
    }
    public removeAdvertiser(advertiser: IAdvertiser) {

    }

    /**
     * @description 去除广告
     * @date 2019-09-06
     * @memberof AdsManager
     * 
     *      */
    public removeAds() {
        this.alreadyRemovedAds = true;
        // TODO:存档
    }
    //是否无广告
    isNoAds() {
        return this.alreadyRemovedAds;
        //return true;
    }


    //#region 



    /**
     * 显示横幅
     * @returns 无
     */
    showBanner(style?) {
        if (this.isNoAds()) return;
        if (CC_PREVIEW) {
            DebugAds.showBanner();
            return
        }
        style = style || this.defaultBannerStyle();
        // 也需要判断广告商是否有banner广告，并不是所有广告商都有banner
        for (let i of this.adComponentsArr) {
            if (!!i.showBanner(style)) {
                return;
            }
        }
    }

    hideBanner() {
        if (CC_PREVIEW) {
            DebugAds.hideBanner();
            return
        }
        // 也需要判断广告商是否有banner广告，并不是所有广告商都有banner
        for (let i of this.adComponentsArr) {
            i.hideBanner();
        }
    }

    _checkInterstitialIntervalTimeValid() {
        // 显示插页要控制时间。在制定时间内。只显示一次广告//
        // 目前设置两分钟只显示一次广告
        // let show_interstitial_interval = window.show_interstitial_interval || 1;
        // let milsec = Date.now() / 1000;

        // if (milsec - this._last_show_interstitial_milsec < show_interstitial_interval * 60) {
        //     return false;
        // }

        return true;
    }
    _resetIntersitialIntervalTime() {
        let milsec = Date.now() / 1000;
        this._last_show_interstitial_milsec = milsec;
    }

    /**当前有插页能显示 */
    hasInterstitial() {
        if (this.isNoAds()) return false;

        if (!this._checkInterstitialIntervalTimeValid()) {
            return false;
        }

        //
        if (!this._isNative() || !this._isSdkboxValid()) {

            return false;
        }

        let showIndex = -1;
        //上个显示插页的id
        this.lastShowInterstitial = this.lastShowInterstitial || 0;
        let showArr = [0, 1, 2, 3, 0, 1, 2, 3];
        for (let i = 0; i < 4; i++) {
            let index = showArr[this.lastShowInterstitial + i];
            if (index == 0) {
                if (sdkbox.PluginAdMob && sdkbox.PluginAdMob.isAvailable("interstitial") && this.enable_admob_interstitial) {

                    showIndex = showArr[index];
                    break;
                }
            }
            else if (index == 1) {

                if (sdkbox.PluginChartboost && sdkbox.PluginChartboost.isAvailable("Default") && this.enable_chartboost_interstitial) {

                    showIndex = showArr[index];
                    break;
                }
            }
            else if (index == 2) {
                if (sdkbox.PluginUnityAds && sdkbox.PluginUnityAds.isReady("video") && this.enable_unity_interstitial) {

                    showIndex = showArr[index];
                    break;
                }
            }
            else if (index == 3) {

                if (this.enable_qy_interstitial) {
                    showIndex = showArr[index];
                    break;
                }
            }
        }

        //显示成功
        if (showIndex >= 0) {
            return true;
        }

        return false;
    }
    /**
     * 显示插屏
     *
     * @param {*} [callback=null] 成功关闭回调
     * @returns 成功
     */
    showInterstitial(callback = null) {

        this.interstitial_callback = callback;
        if (this.isNoAds()) return false;

        cc.log("QYAdsManager showInterstitial");

        if (!this._checkInterstitialIntervalTimeValid()) {
            return false;
        }

        if (CC_PREVIEW && plug && plug.DebugAds) {
            plug.DebugAds.showInterstitial(this, this._interstitialEnd);
            return;
        }

        //
        if (!this._isNative() || !this._isSdkboxValid()) {
            if (this.enable_qy_interstitial) {
                this._stopMusic();
                this.showQYInterstitial();
                return true;
            }
            return false;
        }

        let showIndex = -1;
        //上个显示插页的id
        this.lastShowInterstitial = this.lastShowInterstitial || 0;
        let showArr = [0, 1, 2, 3, 0, 1, 2, 3];
        for (let i = 0; i < 4; i++) {
            let index = showArr[this.lastShowInterstitial + i];
            if (index == 0) {
                if (sdkbox.PluginAdMob && sdkbox.PluginAdMob.isAvailable("interstitial") && this.enable_admob_interstitial) {
                    this._stopMusic();
                    sdkbox.PluginAdMob.show('interstitial');
                    setTimeout(() => {
                        cc.log('adcache admob interstitial2');
                        sdkbox.PluginAdMob.cache("interstitial");
                    }, 50000);

                    showIndex = showArr[index];
                    break;
                } else if (this.enable_admob_interstitial) {

                    cc.log('adcache admob interstitial3');
                    sdkbox.PluginAdMob.cache("interstitial");
                }
            }
            else if (index == 1) {

                if (sdkbox.PluginChartboost && sdkbox.PluginChartboost.isAvailable("Default") && this.enable_chartboost_interstitial) {
                    cc.log("show Chartboost interstitial");
                    this._stopMusic();
                    sdkbox.PluginChartboost.show("Default");

                    showIndex = showArr[index];
                    break;
                }
            }
            else if (index == 2) {
                if (sdkbox.PluginUnityAds && sdkbox.PluginUnityAds.isReady("video") && this.enable_unity_interstitial) {
                    cc.log("show Unity interstitial");
                    this._stopMusic();
                    sdkbox.PluginUnityAds.show("video");

                    showIndex = showArr[index];
                    break;
                }
            }
            else if (index == 3) {

                if (this.enable_qy_interstitial) {
                    this.showQYInterstitial();

                    showIndex = showArr[index];
                    break;
                }
            }
        }

        //显示成功
        if (showIndex >= 0) {
            this._resetIntersitialIntervalTime();
            this.lastShowInterstitial = showIndex + 1;

            this._stopMusic();
            return true;
        }


        return false;
    }
    //#endregion
    //------control all

    /**
     * @description 是否有奖励视频。
     * @date 2019-09-09
     * @returns {boolean}
     * @memberof AdsManager
     */
    get hasRewardVideo() {
        if (CC_PREVIEW) {
            return true;
        }
        for (let i of this.adComponentsArr) {
            if (i.hasRewardVideo()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description TODO: 有问题，单个组件返回的false会有问题。比如admob没有广告，那么是返回false，那应该是继续播放下一个的。但是呢，用户关闭的话，也是false。这样在请求就是错的。
     * 
     * @date 2019-09-09
     * @returns {Promise<RewardVideoCallBackMsg>}
     * @memberof AdsManager
     */
    showRewardVideo(): Promise<RewardVideoCallBackMsg> {
        try {
            cc.log("AdsManager showRewardVideo");

            if (CC_PREVIEW) {
                return DebugAds.showVideo();
            }

            // TODO: 需要处理好头条视频广告的预加载问题。
            for (let i of this.adComponentsArr) {
                if (i.hasRewardVideo() || true) {
                    return i.showRewardVideo();
                }
            }
            return new Promise<RewardVideoCallBackMsg>((resolve, reject) => {
                let msg = new RewardVideoCallBackMsg();
                msg.result = false;
                msg.errMsg = "无可用广告";
                resolve(msg);
            })
        } catch (e) {
            console.error(`showRewardVideo: ${e}`);
        }
    }
    /**
     * @description 预加载广告
     * @date 2019-09-09
     * @param {boolean} [parallel] 是否并行加载，并行可能会导致卡顿。但是会调用所有广告平台的预加载功能。
     * @returns 
     * @memberof AdsManager
     */
    public async preloadRewardVideo(parallel?: boolean) {
        try {
            if (!!parallel) {
                // 并行加载
                let promiseArr = new Array<Promise<boolean>>();
                for (let i of this.adComponentsArr) {
                    let promise = i.preloadRewardVideo();
                    promiseArr.push(promise);
                }
                await Promise.all(promiseArr);
            } else {
                // 按顺序预加载，只要有一个加载到就结束。
                for (let i of this.adComponentsArr) {
                    if (await i.preloadRewardVideo() == true) {
                        return;
                    }
                }
            }
        } catch (e) {
            console.log("preloadRewardVideo error: ", e);
        }
    }


    defaultBannerStyle() {
        let width = cc.view.getFrameSize().width;
        let height = cc.view.getFrameSize().height;

        let style = null;
        if (width > height) {
            // 广告高度是屏幕高度的一半。
            let adWidth = height / 2;
            //横屏 
            //居中下面
            style = { left: width / 2 - adWidth / 2, top: height - (adWidth * 9 / 16), width: adWidth };
            //左下角
            //window.wxStyle = {left: 0, top: 0, width: adWidth};
        }
        else {
            //竖屏
            //屏幕中间底部位置
            style = { left: width / 4, top: height - (width / 2 * 9 / 16), width: width / 2 };
        }
        return style;
    };


}

