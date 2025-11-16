import { log, screen, view, director } from 'cc';
import { IAdProvider } from './providers/iad-provider';
import WeChatAds from './providers/wechat-ads';

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
    public style: { width?: number, height?: number, left: number, top: number, fixed?: boolean };
}

//#region define interface
export interface AdsConfig {
    /**
     * @description 广告提供商
     * @type {Array<{ new(): IAdProvider }>}
     */
    adsProviders: Array<{ new(rewardVideosMap?: Map<string, string>, interstitialAdsMap?: Map<string, string>, bannersMap?: Map<string, string>): IAdProvider }>
    /**
     * @description 一般广告会创建多个广告位，所以是 Map<string, string>
     * @type {Map<IAdProvider, Map<string, string>>}
     */
    rewardVideoProviderAndPosIdsMap?: Map<{ new(): IAdProvider }, Array<RewardVideoConfig>>,
    interstitialProviderAndPosIdsMap?: Map<{ new(): IAdProvider }, Array<InterstitialConfig>>,
    bannerProviderAndPosIdsMap?: Map<{ new(): IAdProvider }, Array<BannerConfig>>,
    geZiProviderAndPosIdsMap?: Map<{ new(): IAdProvider }, Array<GeZiAdConfig>>,
    /**
     * @description 插页广告展示间隔时间
     * @type {number}
     */
    interstitialIntervalSeconds?: number,

}

/**
 * @description 视频广告播放回调，如果失败就读取errMsg
 * @date 2019-09-09
 * @export
 * @class RewardVideoCallBackMsg
 */
export class ShowRewardVideoCallBackMsg {
    /**
     * @description 成功或失败
     * @type {boolean}
     * @memberof ShowRewardVideoCallBackMsg
     */
    success: boolean = false;

    /**
     * @description 失败描述
     * @type {string}
     * @memberof ShowRewardVideoCallBackMsg
     */
    errMsg: string = "";

    skip: boolean = false;
}

/**
 * @description 插页广告播放回调
 * @date 2024-07-02
 */
export class ShowInterstitialAdCallBackMsg {
    success: boolean = false;
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

    /** 是否预加载中 */
    public isPreloading: boolean = false;
    rewardAdId
}

export class InterstitialAdBundle {
    public interstitialInstance;
    public interstitialId;
    public hasInterstitialInCache: boolean = false;

    public bShow = false;
}

export class BannerAdBundle {
    public bannerInstance;
    public bannerId;

    public bShow;
    public style: { width: number, height: number, left: number, top: number };
}
export class GeZiAdBundle {
    public geZiInstance;
    public geZiId;
    public style: { width: number, height?: number, left: number, top: number };
}
export class AdsManager {
    public static ModEvent = {
        /** 视频成功 */
        adVideoSuccess: "adVideoSuccess",
        /** 视频失败 */
        adVideoFail: "adVideoFail",
    }

    private static _instance: AdsManager;
    public static get instance() {
        return this._instance || (this._instance = new AdsManager());
    }


    /**
     * @description 最后一次展示插页的时间
     * @private
     * @type {number}
     * @memberof AdsManager
     */
    private _last_show_interstitial_timestamp: number = 0;
    // 插页广告展示间隔时间
    private interstitialIntervalSeconds: number = 0 * 60;

    /**
     * @description 加入的广告提供商都会存在这里。
     * @private
     * @type {Array<IAdProvider>}
     * @memberof AdsManager
     */
    private adProviderArr: Array<IAdProvider> = new Array<IAdProvider>();

    private initialized: boolean = false;
    private isShowingRewardVideo: boolean = false;

    constructor() {

    }
    public init(config: AdsConfig) {
        console.log(" ads init")
        if (!this.initialized) {
            this.initialized = true;
            for (let adProvider of config.adsProviders) {
                let rewardVideosConfigArr = config.rewardVideoProviderAndPosIdsMap?.get(adProvider);
                let interstitialAdsConfigArr = config.interstitialProviderAndPosIdsMap?.get(adProvider);
                let bannersConfigArr = config.bannerProviderAndPosIdsMap?.get(adProvider);
                let provider = new adProvider();
                let geZiConfigArr = config.geZiProviderAndPosIdsMap?.get(adProvider);
                provider.init(rewardVideosConfigArr, interstitialAdsConfigArr, bannersConfigArr, geZiConfigArr);
                this.addAdProvider(provider);
                this.interstitialIntervalSeconds = config.interstitialIntervalSeconds ?? 0;
            }
        }
    }

    public addAdProvider(advertiser: IAdProvider) {
        this.adProviderArr.push(advertiser);
    }
    public removeAdvertiser(advertiser: IAdProvider) {

    }

    public removeAllAdvertiser() {
        this.adProviderArr = [];
    }

    /**
     * @description 如果想直接使用provider 那么可以通过这个方法获取。
     * @template T
     * @param {{ new(): T; }} provider
     * @return {*}  {T}
     * @memberof AdsManager
     */
    public getProvider<T extends IAdProvider>(provider: { new(): T; }): T {
        for (let i of this.adProviderArr) {
            if (i instanceof provider) {
                return i as T;
            }
        }
        return null;
    }


    /**
     * 显示横幅
     * @returns 无
     */
    async showBanner(posName: string = "Default") {
        if (this.isNoAds()) return;
        for (let i of this.adProviderArr) {
            if (!!await i.showBanner(posName)) {
                return;
            }
        }
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
            console.log("AdsManager showInterstitial");
            // 
            if (Date.now() - this._last_show_interstitial_timestamp > this.interstitialIntervalSeconds * 1000) {
                for (let i of this.adProviderArr) {
                    if (i.hasInterstitial(posName)) {
                        this._last_show_interstitial_timestamp = Date.now();
                        return i.showInterstitial(posName);
                    }
                }
                let msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = "无可用广告";
                return Promise.resolve(msg);
            } else {
                console.log("AdsManager showInterstitial: 时间间隔不够");
                let msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = "时间间隔不够";
                return Promise.resolve(msg);
            }

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

    haveCacheVideo(posName: string = "Default") {
        for (let i of this.adProviderArr) {
            if (i.haveCacheVideo) {
                return i.haveCacheVideo(posName);
            }
        }
        return true;
    }

    /** 是否正在显示广告 */
    isShowingVideo() {
        for (let i of this.adProviderArr) {
            if (i.isShowingRewardVideo) {
                return true;
            }
        }

        return false;
    }

    /** 是否正在显示广告 */
    isShowingInterstitial() {
        for (let i of this.adProviderArr) {
            if (i.isShowingInterstitial) {
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
    showRewardVideo(posName: string = "Default"): Promise<ShowRewardVideoCallBackMsg> {

        // wx测试改分享
        // return new Promise((resolve, reject) => {
        //     let result = RecordVideoManager.instance.shareAppMessage(() => {
        //         let msg = new ShowRewardVideoCallBackMsg();
        //         msg.success = true;
        //         resolve(msg);
        //     }, () => {
        //         let msg = new ShowRewardVideoCallBackMsg();
        //         msg.success = false;
        //         resolve(msg);
        //     });

        //     if (!result) {
        //         let msg = new ShowRewardVideoCallBackMsg();
        //         msg.success = false;
        //         resolve(msg);
        //     }
        // })

        log("AdsManager showRewardVideo");
        if (this.isShowingRewardVideo) {
            let msg = new ShowRewardVideoCallBackMsg();
            msg.success = false;
            msg.errMsg = "广告正在播放中";
            return Promise.resolve(msg);
        }

        for (let i of this.adProviderArr) {
            if (i.hasRewardVideo(posName)) {
                this.isShowingRewardVideo = true;
                let result = i.showRewardVideo(posName);
                this.isShowingRewardVideo = false;
                return result;
            }
        }
        let msg = new ShowRewardVideoCallBackMsg();
        msg.success = false;
        msg.errMsg = "无可用广告";
        return Promise.resolve(msg);
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
     * @description 默认广告为屏幕居中最下铺满
     * @returns 
     * @memberof AdsManager
     */
    public static defaultBannerStyle() {
        let screenWidth = screen.windowSize.width / screen.devicePixelRatio;
        let screenHeight = screen.windowSize.height / screen.devicePixelRatio;
        let bannerWidth = screenWidth;
        let bannerHeight = bannerWidth / 360 * 118.56;
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
    public isNoAds() {
        return false;
    }

    // 目前只有微信有格子广告
    showGeZiAd(posName: string = 'Default') {
        this.adProviderArr.find((adProvider) => {
            if (adProvider instanceof WeChatAds) {
                (adProvider as WeChatAds).showGeZi(posName);
            }
        });
    }
    closeGeZiAd(posName: string = 'Default') {
        this.adProviderArr.find((adProvider) => {
            if (adProvider instanceof WeChatAds) {
                (adProvider as WeChatAds).closeGeZi(posName);
            }
        });
    }
}

