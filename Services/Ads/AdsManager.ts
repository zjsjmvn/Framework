import { IAdProvider } from './Provider/IAdProvider';
import { IConfig } from '../../../GamePlay/LaunchConfigs';
import { singleton } from '../../Utils/Decorator/Singleton';
import { find } from '../../../../../creator';
import WeChatAds from './Provider/WeChatAds';

export class BaseAdConfig {
    public posName: string;
    public id: string;
}
export class BannerConfig extends BaseAdConfig {

    public style: { width: number, height: number, left: number, top: number };
}
export class InterstitialConfig extends BaseAdConfig {

}
export class RewardVideoConfig extends BaseAdConfig {

}
export class GeZiAdConfig extends BaseAdConfig {

    public style: { width: number, height?: number, left: number, top: number };

}
/**
 * @description 视频广告播放回调，如果失败就读取errMsg
 * @date 2019-09-09
 * @export
 * @class RewardVideoCallBackMsg
 */
export class RewardVideoCallBackMsg {
    /**
     * @description 成功或失败
     * @type {boolean}
     * @memberof RewardVideoCallBackMsg
     */
    result: boolean = false;

    /**
     * @description 失败描述
     * @type {string}
     * @memberof RewardVideoCallBackMsg
     */
    errMsg: string = "";
}

export class RewardVideoBundle {
    /**
     * @description 广告实例
     * @memberof RewardVideoBundle
     */
    public rewardVideoInstance;
    /**
     * @description 是否有缓存的视频广告
     * @memberof RewardVideoBundle
     */
    public hasRewardVideoInCache: boolean = false;
}

export class InterstitialAdBundle {
    public interstitialInstance;
    public interstitialId;
    public hasInterstitialInCache: boolean = false;
}

export class BannerAdBundle {
    public bannerInstance;
    public bannerId;
    public style: { width: number, height: number, left: number, top: number };
}

export class GeZiAdBundle {
    public geZiInstance;
    public geZiId;
    public style: { width: number, height?: number, left: number, top: number };
}
export class ShowInterstitialAdCallBackMsg {
    success: boolean = false;
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
     * @description 加入的广告提供商都会存在这里。
     * @private
     * @type {Array<IAdProvider>}
     * @memberof AdsManager
     */
    private adProviderArr: Array<IAdProvider> = new Array<IAdProvider>();

    constructor() {

    }


    public init(config: any) {
        for (let adProvider of config.adsProviders) {
            let rewardVideosConfigArr = config.rewardVideoProviderAndPosIdsMap?.get(adProvider);
            let interstitialAdsConfigArr = config.interstitialProviderAndPosIdsMap?.get(adProvider);
            let bannersConfigArr = config.bannerProviderAndPosIdsMap?.get(adProvider);
            //geZiProviderAndPosIdsMap
            let geZiConfigArr = config.geZiProviderAndPosIdsMap?.get(adProvider);
            let provider = new adProvider();
            provider.init(rewardVideosConfigArr, interstitialAdsConfigArr, bannersConfigArr, geZiConfigArr);
            this.addAdProvider(provider);
        }
    }
    public addAdProvider(advertiser: IAdProvider) {
        this.adProviderArr.push(advertiser);
    }
    public removeAdvertiser(advertiser: IAdProvider) {

    }

    /**
     * 显示横幅
     * @returns 无
     */
    async showBanner(style?, posName: string = "Default") {
        if (this.isNoAds()) return;
        style = style || this.defaultBannerStyle();
        for (let i of this.adProviderArr) {
            if (!!await i.showBanner(style, posName)) {
                return;
            }
        }
    }
    // 目前只有微信有格子广告
    showGeZiAd(posName: string) {
        this.adProviderArr.find((adProvider) => {
            if (adProvider instanceof WeChatAds) {
                (adProvider as WeChatAds).showGeZi(posName);
            }
        });
    }
    closeGeZiAd(posName: string) {
        this.adProviderArr.find((adProvider) => {
            if (adProvider instanceof WeChatAds) {
                (adProvider as WeChatAds).closeGeZi(posName);
            }
        });
    }

    hideBanner(posName: string = "Default") {
        // 也需要判断广告商是否有banner广告，并不是所有广告商都有banner
        for (let i of this.adProviderArr) {
            i.hideBanner(posName);
        }
    }

    _checkInterstitialIntervalTimeValid() {
        // 显示插页要控制时间。在制定时间内。只显示一次广告//
        // 目前设置两分钟只显示一次广告
        return true;
    }


    hasInterstitial(posName: string) {
        if (this.isNoAds()) return false;
        if (!this._checkInterstitialIntervalTimeValid()) {
            return false;
        }
        return false;
    }


    /**
     * @description 展示插页广告
     * @param {string} posName 广告位名称
     * @return {*}  
     * @memberof AdsManager
     */
    showInterstitial(posName: string = "Default"): Promise<ShowInterstitialAdCallBackMsg> {
        try {
            cc.log("AdsManager showInterstitial");
            for (let i of this.adProviderArr) {
                if (i.hasInterstitial(posName)) {
                    return i.showInterstitial(posName);
                }
            }
            let msg = new ShowInterstitialAdCallBackMsg();
            msg.success = false;
            msg.errMsg = "无可用广告";
            return Promise.resolve(msg);
        } catch (e) {
            console.error(`showInterstitial: ${e}`);
        }
    }
    /**
     * @description 是否有奖励视频。
     * @returns {boolean}
     * @memberof AdsManager
     */
    hasRewardVideo(posName: string = "Default") {
        for (let i of this.adProviderArr) {
            if (i.hasRewardVideo(posName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description
     * @param {string} [position] 广告位
     * @return {*}  {Promise<RewardVideoCallBackMsg>}
     * @memberof AdsManager
     */
    showRewardVideo(posName: string = "Default"): Promise<RewardVideoCallBackMsg> {
        try {
            cc.log("AdsManager showRewardVideo");
            for (let i of this.adProviderArr) {
                if (i.hasRewardVideo(posName)) {
                    return i.showRewardVideo(posName);
                }
            }
            let msg = new RewardVideoCallBackMsg();
            msg.result = false;
            msg.errMsg = "无可用广告";
            return Promise.resolve(msg);
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
                for (let i of this.adProviderArr) {
                    let promise = i.preloadRewardVideo();
                    promiseArr.push(promise);
                }
                await Promise.all(promiseArr);
            } else {
                // 按顺序预加载，只要有一个加载到就结束。
                for (let i of this.adProviderArr) {
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

        let screenWidth = cc.view.getFrameSize().width / cc.view.getDevicePixelRatio();
        let screenHeight = cc.view.getFrameSize().height / cc.view.getDevicePixelRatio();
        let bannerWidth = screenWidth;
        let bannerHeight = bannerWidth / 20 * 7;
        let left = screenWidth - bannerWidth;
        let top = screenHeight - bannerHeight;
        return {
            width: bannerWidth,
            height: bannerHeight,
            left: left,
            top: top
        }
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

