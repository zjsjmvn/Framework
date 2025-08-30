import { error, log, screen, view } from 'cc';
import { RewardedAdClient } from 'db://admob/ads/client/RewardedAdClient';
import { IAdProvider } from './iad-provider';
import { BannerClient } from 'db://admob/ads/client/BannerClient';
import { BannerSize } from 'db://admob/misc/BannerSize';
import { LoadAdError } from 'db://admob/ads/alias/TypeAlias';
import { BannerPaidEventNTF } from 'db://admob/proto/PaidEventNTF';
import { BannerAdBundle, BannerConfig, GeZiAdBundle, GeZiAdConfig, InterstitialAdBundle, InterstitialConfig, RewardVideoBundle, RewardVideoConfig, ShowInterstitialAdCallBackMsg } from '../ads-manager';
import { BottomCenter, TopCenter } from 'db://admob/misc/BannerAlignment';
import { BannerSizeType } from 'db://admob/misc/BannerSizeType';

export default class AdmobAds implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();
    private geZiInstanceMap: Map<string, GeZiAdBundle> = new Map();

    public isShowingRewardVideo: boolean = false;
    public isShowingInterstitial: boolean = false;

    private logTag: string = "[AdmobAds]";

    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiAdsConfigArr: Array<GeZiAdConfig>) {
        this.initRewardVideos(rewardVideosConfigArr);
        this.initInterstitialAds(interstitialAdsConfigArr);
        this.initBanners(bannersConfigArr);
        this.initGeZiAds(geZiAdsConfigArr);

        // 初始化完成后预加载激励广告
        this.preloadRewardVideo();
    }

    //#region 视频激励广告
    private initRewardVideo(rewardVideoId: string, rewardVideoBundle: RewardVideoBundle) {
        let rewardedAdClient = new RewardedAdClient();
        rewardVideoBundle.rewardVideoInstance = rewardedAdClient;
        rewardVideoBundle.rewardAdId = rewardVideoId;
        rewardVideoBundle.hasRewardVideoInCache = false;
        rewardVideoBundle.isPreloading = false;
    }

    private initRewardVideos(rewardVideosConfigArr: Array<RewardVideoConfig>) {
        rewardVideosConfigArr?.forEach((value) => {
            let bundle = new RewardVideoBundle();
            bundle.rewardAdId = value.id;
            this.initRewardVideo(value.id, bundle);
            this.rewardVideoInstanceMap.set(value.posName, bundle);
        });
    }

    private loadRewardVideo(posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const bundle = this.rewardVideoInstanceMap.get(posName);
            if (!bundle) {
                resolve(false);
                return;
            }

            if (bundle.isPreloading) {
                resolve(false);
                return;
            }

            bundle.isPreloading = true;
            bundle.hasRewardVideoInCache = false;

            bundle.rewardVideoInstance.load(bundle.rewardAdId, {
                onAdLoaded: () => {
                    log(this.logTag, `激励广告加载成功: ${posName}`);
                    bundle.hasRewardVideoInCache = true;
                    bundle.isPreloading = false;
                    resolve(true);
                },
                onAdFailedToLoad: (loadAdError) => {
                    log(this.logTag, `激励广告加载失败: ${posName}`, loadAdError);
                    bundle.hasRewardVideoInCache = false;
                    bundle.isPreloading = false;
                    resolve(false);
                },
                onEarn: (rewardType, amount) => {
                    log(this.logTag, `获得奖励: ${posName}, rewardType = ${rewardType}, amount = ${amount}`);
                },
                onPaidEvent(paidNTF) {
                    log(this.logTag, "付费事件", paidNTF);
                },
            });
        });
    }

    showRewardVideo(posName: string): Promise<ShowRewardVideoCallBackMsg> {
        console.log(">> AdmobAds::showRewardVideo", posName);
        return new Promise(async (resolve, reject) => {
            if (this.isShowingRewardVideo) {
                let msg = new ShowRewardVideoCallBackMsg();
                msg.success = false;
                msg.errMsg = "广告正在播放中";
                resolve(msg);
                return;
            }

            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new ShowRewardVideoCallBackMsg();

            if (!bundle) {
                error(`>> AdmobAds::showRewardVideo 无法找到posName=${posName}的广告`);
                msg.success = false;
                msg.errMsg = `无法找到posName=${posName}的广告`;
                resolve(msg);
                return;
            }

            // 如果没有预加载的广告，先尝试加载
            if (!bundle.hasRewardVideoInCache && !bundle.isPreloading) {
                log(this.logTag, `没有预加载的广告，开始加载: ${posName}`);
                const loadSuccess = await this.loadRewardVideo(posName);
                if (!loadSuccess) {
                    msg.success = false;
                    msg.errMsg = "广告加载失败";
                    resolve(msg);
                    return;
                }
            }

            // 如果正在加载中，等待加载完成
            if (bundle.isPreloading) {
                log(this.logTag, `广告正在加载中，等待完成: ${posName}`);
                // 等待加载完成
                while (bundle.isPreloading) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (!bundle.hasRewardVideoInCache) {
                    msg.success = false;
                    msg.errMsg = "广告加载失败";
                    resolve(msg);
                    return;
                }
            }

            // 展示广告
            this.isShowingRewardVideo = true;
            log(this.logTag, `开始展示激励广告: ${posName}`);

            try {
                // 设置回调处理
                this.setupShowRewardVideoCallbacks(posName, resolve);
                bundle.rewardVideoInstance.show();
            } catch (error) {
                log(this.logTag, `展示广告时发生错误: ${posName}`, error);
                this.isShowingRewardVideo = false;
                msg.success = false;
                msg.errMsg = "展示广告时发生错误";
                resolve(msg);
            }
        });
    }

    private setupShowRewardVideoCallbacks(posName: string, resolve: (value: ShowRewardVideoCallBackMsg) => void) {
        const bundle = this.rewardVideoInstanceMap.get(posName);
        if (!bundle) return;

        // 设置新的回调
        bundle.rewardVideoInstance.rewardedListener = {
            ...bundle.rewardVideoInstance.rewardedListener,
            onAdDismissedFullScreenContent: () => {
                log(this.logTag, `激励广告播放完成: ${posName}`);
                bundle.hasRewardVideoInCache = false;
                bundle.isPreloading = false;
                this.isShowingRewardVideo = false;

                // 销毁旧的实例并创建新的实例
                bundle.rewardVideoInstance.destroy();
                bundle.rewardVideoInstance = new RewardedAdClient();

                // 播放完成后预加载下一个广告
                this.loadRewardVideo(posName);

                // 播放完成，resolve成功
                const msg = new ShowRewardVideoCallBackMsg();
                msg.success = true;
                resolve(msg);
            },
            onAdFailedToShowFullScreenContent: (adError) => {
                log(this.logTag, `激励广告展示失败: ${posName}`, adError);
                bundle.hasRewardVideoInCache = false;
                bundle.isPreloading = false;
                this.isShowingRewardVideo = false;

                // 销毁旧的实例并创建新的实例
                bundle.rewardVideoInstance.destroy();
                bundle.rewardVideoInstance = new RewardedAdClient();

                // 展示失败后也预加载下一个广告
                this.loadRewardVideo(posName);

                // 展示失败，resolve失败
                const msg = new ShowRewardVideoCallBackMsg();
                msg.success = false;
                msg.errMsg = "广告展示失败";
                resolve(msg);
            }
        };
    }

    preloadRewardVideo(): Promise<boolean> {
        log(this.logTag, "开始预加载所有激励广告");
        const promises: Promise<boolean>[] = [];

        this.rewardVideoInstanceMap.forEach((value, key) => {
            if (value && !value.hasRewardVideoInCache && !value.isPreloading) {
                promises.push(this.loadRewardVideo(key));
            }
        });

        return Promise.all(promises).then(results => {
            const successCount = results.filter(result => result).length;
            log(this.logTag, `预加载完成，成功加载 ${successCount}/${promises.length} 个广告`);
            return successCount > 0;
        });
    }

    hasRewardVideo(posName: string): boolean {
        // const bundle = this.rewardVideoInstanceMap.get(posName);
        // return bundle ? bundle.hasRewardVideoInCache : false;
        return true;

    }

    haveCacheVideo?(posName: string): boolean {
        return this.hasRewardVideo(posName);
    }
    //#endregion

    //#region 插屏广告

    private initInterstitialAds(interstitialAdsConfigArr: Array<InterstitialConfig>) {
        // TODO: 实现插屏广告初始化
        log(this.logTag, "插屏广告初始化待实现");
    }

    showInterstitial(posName: string): Promise<ShowInterstitialAdCallBackMsg> {
        // TODO: 实现插屏广告展示
        log(this.logTag, `插屏广告展示待实现: ${posName}`);
        return Promise.resolve(new ShowInterstitialAdCallBackMsg());
    }

    hasInterstitial(posName: string): boolean {
        // TODO: 实现插屏广告检查
        return false;
    }

    preloadInterstitial(): Promise<boolean> {
        // TODO: 实现插屏广告预加载
        log(this.logTag, "插屏广告预加载待实现");
        return Promise.resolve(false);
    }
    //#endregion
    bannerClient: BannerClient;

    //#region Banner广告
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


        return new Promise((resolve) => {
            let bundle = this.bannerInstanceMap.get(posName);
            if (!bundle) {
                error(`>> AdmobAds::showBanner 无法找到posName=${posName}的广告`);
                resolve(false);
                return;
            }

            if (bundle.bShow) {
                resolve(true);
                return;
            }

            bundle.bShow = true;

            // 如果已有实例，先销毁
            if (bundle.bannerInstance) {
                try { bundle.bannerInstance.destroy?.(); } catch (e) { }
                bundle.bannerInstance = null;
            }

            const client = new BannerClient();
            bundle.bannerInstance = client;

            client.load(bundle.bannerId, {
                onAdImpression: () => {
                    log(this.logTag, "Banner onAdImpression", posName);
                },

                onAdClicked: () => {
                    log(this.logTag, "Banner onAdClicked", posName);
                },

                onAdLoaded: () => {
                    log(this.logTag, "Banner 加载成功", posName);
                    resolve(true);
                },

                onAdFailedToLoad: (loadError: LoadAdError) => {
                    log(this.logTag, "Banner 加载失败", posName, `${loadError}`);
                    bundle.bShow = false;
                    resolve(false);
                },

                onPaidEvent(paidNTF: BannerPaidEventNTF) {
                    log("[AdmobAds]", "Banner onPaidEvent", paidNTF);
                },

            }, { size: BannerSize.BANNER, alignments: BottomCenter, type: BannerSizeType.Portrait });
        });

    }

    hideBanner(posName: string) {
        let bundle = this.bannerInstanceMap.get(posName);
        if (!bundle) {
            error(`>> AdmobAds::hideBanner 无法找到posName=${posName}的广告`);
            return;
        }

        if (bundle.bannerInstance) {
            try { bundle.bannerInstance.destroy?.(); } catch (e) { }
            bundle.bannerInstance = null;
        }
        bundle.bShow = false;
        log(this.logTag, `Banner已隐藏: ${posName}`);
    }
    //#endregion

    //#region 格子广告
    private initGeZiAds(geZiAdsConfigArr: Array<GeZiAdConfig>) {
        // TODO: 实现格子广告初始化
        log(this.logTag, "格子广告初始化待实现");
    }
    //#endregion
}




