import { IAdProvider } from './Provider/IAdvertiser';
import DebugAds from './DebugAds';
import { singleton } from '../../Tools/Decorator/Singleton';

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


@singleton
export class AdsManager {
    /**
     * @description 单例,只是为了智能提示。instance会被singleton装饰器赋值。
     * @private
     * @static
     * @type {AdsManager}
     * @memberof AdsManager
     */
    public static instance: AdsManager = null

    /**
     * @description 最后一次展示插页的时间
     * @private
     * @type {number}
     * @memberof AdsManager
     */
    private _last_show_interstitial_timestamp: number = 0;

    /**
     * @description 加入的广告组件都会存在这里。
     * @private
     * @type {Array<IAdProvider>}
     * @memberof AdsManager
     */
    private adComponentsArr: Array<IAdProvider> = new Array<IAdProvider>();

    constructor() {

    }

    public addAdvertiser(advertiser: IAdProvider) {
        this.adComponentsArr.push(advertiser);
    }
    public removeAdvertiser(advertiser: IAdProvider) {

    }

    /**
     * 显示横幅
     * @returns 无
     */
    async showBanner(style?) {
        if (this.isNoAds()) return;
        if (CC_PREVIEW) {
            DebugAds.showBanner();
            return
        }
        style = style || this.defaultBannerStyle();
        for (let i of this.adComponentsArr) {
            if (!!await i.showBanner(style)) {
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


        return true;
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

    /**
     * @description 是否有奖励视频。
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
     * @description 
     * @returns {Promise<RewardVideoCallBackMsg>}
     * @memberof AdsManager
     */
    showRewardVideo(): Promise<RewardVideoCallBackMsg> {
        try {
            cc.log("AdsManager showRewardVideo");
            if (CC_PREVIEW) {
                return DebugAds.showVideo();
            }
            for (let i of this.adComponentsArr) {
                if (i.hasRewardVideo()) {
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


    /**
     * @description 默认广告为屏幕 居中最下。
     * @returns 
     * @memberof AdsManager
     */
    defaultBannerStyle() {
        let width = cc.view.getFrameSize().width;
        let height = cc.view.getFrameSize().height;
        return { left: width / 4, top: height - (width / 2 * 9 / 16), width: width / 2 };
    }




    /**
     * @description 原生平台用到的。
     * @private
     * @returns {boolean}
     * @memberof AdsManager
     */
    private isNoAds() {
        return false;
    }


}

