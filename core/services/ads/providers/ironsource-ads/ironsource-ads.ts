import { error, log, native } from 'cc';
import { RewardedAdClient } from './ads/client/RewardedAdClient';
import { IAdProvider } from '../iad-provider';
import { BannerAdBundle, BannerConfig, GeZiAdBundle, GeZiAdConfig, InterstitialAdBundle, InterstitialConfig, RewardVideoBundle, RewardVideoConfig, ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../../ads-manager';
import { BannerClient } from './ads/client/BannerClient';
import { LoadAdError } from './ads/alias/TypeAlias';
import { BannerSize } from './misc/BannerSize';
import { BottomCenter } from './misc/BannerAlignment';
import { BannerSizeType } from './misc/BannerSizeType';
import { BannerPaidEventNotification } from './proto/PaidEventNTF';

export default class IronSourceAds implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();
    private geZiInstanceMap: Map<string, GeZiAdBundle> = new Map();

    public isShowingRewardVideo: boolean = false;
    public isShowingInterstitial: boolean = false;

    private logTag: string = "[IronSourceAdsTS]";

    // 保存当前激励广告的 resolver
    private currentRewardVideoResolver: ((value: ShowRewardVideoCallBackMsg) => void) | null = null;

    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiAdsConfigArr: Array<GeZiAdConfig>) {
        this.initRewardVideos(rewardVideosConfigArr);
        this.initInterstitialAds(interstitialAdsConfigArr);
        this.initBanners(bannersConfigArr);
        this.initGeZiAds(geZiAdsConfigArr);

        if (native && native.jsbBridgeWrapper) {
            native.jsbBridgeWrapper.addNativeEventListener("IronSourceAdsJavaSideInitSuccess", (arg?: any) => {
                log(this.logTag, "IronSourceAdsJavaSideInitSuccess");
                // 预加载广告
                this.preloadRewardVideo();
            });
        }
    }

    //#region 视频激励广告
    private initRewardVideo(rewardVideoId: string, rewardVideoBundle: RewardVideoBundle, posName: string) {
        log(this.logTag, `初始化激励广告: posName=${posName}, unitId=${rewardVideoId}`);
        let rewardedAdClient = new RewardedAdClient(rewardVideoId);
        rewardVideoBundle.rewardVideoInstance = rewardedAdClient;
        rewardVideoBundle.rewardAdId = rewardVideoId;
        rewardVideoBundle.hasRewardVideoInCache = false;
        rewardVideoBundle.isPreloading = false;

        // 在初始化时设置监听器
        log(this.logTag, `设置激励广告监听器: posName=${posName}`);
        rewardedAdClient.rewardedListener = {
            onAdLoaded: () => {
                log(this.logTag, `激励广告加载成功: ${posName}`);
                rewardVideoBundle.hasRewardVideoInCache = true;
                rewardVideoBundle.isPreloading = false;
            },
            onAdFailedToLoad: (loadAdError) => {
                log(this.logTag, `激励广告加载失败: ${posName}`, loadAdError);
                rewardVideoBundle.hasRewardVideoInCache = false;
                rewardVideoBundle.isPreloading = false;
            },
            onEarn: (rewardType, amount) => {
                log(this.logTag, `获得奖励: ${posName}, rewardType = ${rewardType}, amount = ${amount}`);
            },
            onPaidEvent: (paidNTF) => {
                log(this.logTag, "付费事件", paidNTF);
            },
            onAdDismissedFullScreenContent: () => {
                log(this.logTag, `激励广告播放完成: ${posName}`);
                rewardVideoBundle.hasRewardVideoInCache = false;
                rewardVideoBundle.isPreloading = false;
                this.isShowingRewardVideo = false;

                // 播放完成后预加载下一个广告
                this.loadRewardVideo(posName);

                // 通知展示成功
                if (this.currentRewardVideoResolver) {
                    const msg = new ShowRewardVideoCallBackMsg();
                    msg.success = true;
                    this.currentRewardVideoResolver(msg);
                    this.currentRewardVideoResolver = null;
                }
            },
            onAdFailedToShowFullScreenContent: (adError) => {
                log(this.logTag, `激励广告展示失败: ${posName}`, adError);
                rewardVideoBundle.hasRewardVideoInCache = false;
                rewardVideoBundle.isPreloading = false;
                this.isShowingRewardVideo = false;

                // 展示失败后也预加载下一个广告
                this.loadRewardVideo(posName);

                // 通知展示失败
                if (this.currentRewardVideoResolver) {
                    const msg = new ShowRewardVideoCallBackMsg();
                    msg.success = false;
                    msg.errMsg = "广告展示失败";
                    this.currentRewardVideoResolver(msg);
                    this.currentRewardVideoResolver = null;
                }
            }
        };

    }

    private initRewardVideos(rewardVideosConfigArr: Array<RewardVideoConfig
    >) {
        rewardVideosConfigArr?.forEach((value) => {
            let bundle = new RewardVideoBundle();
            bundle.rewardAdId = value.id;
            this.initRewardVideo(value.id, bundle, value.posName);
            this.rewardVideoInstanceMap.set(value.posName, bundle);
        });
    }

    private loadRewardVideo(posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            log(this.logTag, `请求加载激励广告: posName=${posName}`);
            const bundle = this.rewardVideoInstanceMap.get(posName);
            if (!bundle) {
                log(this.logTag, `加载失败: 未找到bundle, posName=${posName}`);
                resolve(false);
                return;
            }

            if (bundle.isPreloading) {
                log(this.logTag, `加载跳过: 广告正在加载中, posName=${posName}`);
                resolve(false);
                return;
            }

            log(this.logTag, `开始加载激励广告: posName=${posName}`);
            bundle.isPreloading = true;
            bundle.hasRewardVideoInCache = false;

            // 保存当前加载的 resolve，以便在监听器回调中使用
            const listener = (bundle.rewardVideoInstance as RewardedAdClient).rewardedListener as any;
            const originalOnAdLoaded = listener?.onAdLoaded;
            const originalOnAdFailedToLoad = listener?.onAdFailedToLoad;

            // 临时包装加载回调以处理 Promise
            if (listener) {
                listener.onAdLoaded = () => {
                    log(this.logTag, `激励广告加载完成回调: posName=${posName}`);
                    if (originalOnAdLoaded) {
                        originalOnAdLoaded();
                    }
                    resolve(true);
                };

                listener.onAdFailedToLoad = (loadAdError: any) => {
                    log(this.logTag, `激励广告加载失败回调: posName=${posName}`);
                    if (originalOnAdFailedToLoad) {
                        originalOnAdFailedToLoad(loadAdError);
                    }
                    resolve(false);
                };
            }

            log(this.logTag, `调用原生加载方法: posName=${posName}, unitId=${bundle.rewardAdId}`);
            (bundle.rewardVideoInstance as RewardedAdClient).load();
        });
    }

    showRewardVideo(posName: string): Promise<ShowRewardVideoCallBackMsg> {
        log(this.logTag, `请求展示激励广告: posName=${posName}`);
        return new Promise(async (resolve, reject) => {
            if (this.isShowingRewardVideo) {
                log(this.logTag, `展示失败: 广告正在播放中, posName=${posName}`);
                let msg = new ShowRewardVideoCallBackMsg();
                msg.success = false;
                msg.errMsg = "广告正在播放中";
                resolve(msg);
                return;
            }

            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new ShowRewardVideoCallBackMsg();

            if (!bundle) {
                error(this.logTag, `展示失败: 无法找到bundle, posName=${posName}`);
                msg.success = false;
                msg.errMsg = `无法找到posName=${posName}的广告`;
                resolve(msg);
                return;
            }

            // 如果没有预加载的广告，先尝试加载
            if (!bundle.hasRewardVideoInCache && !bundle.isPreloading) {
                log(this.logTag, `没有预加载的广告，尝试即时加载: posName=${posName}`);
                const loadSuccess = await this.loadRewardVideo(posName);
                if (!loadSuccess) {
                    log(this.logTag, `即时加载失败: posName=${posName}`);
                    msg.success = false;
                    msg.errMsg = "广告加载失败";
                    resolve(msg);
                    return;
                }
                log(this.logTag, `即时加载成功: posName=${posName}`);
            }

            // 如果正在加载中，等待加载完成
            if (bundle.isPreloading) {
                log(this.logTag, `广告正在加载中，等待完成: posName=${posName}`);
                let waitCount = 0;
                // 等待加载完成
                while (bundle.isPreloading) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitCount++;
                    if (waitCount % 10 === 0) {
                        log(this.logTag, `等待加载中: posName=${posName}, 已等待${waitCount * 100}ms`);
                    }
                }

                if (!bundle.hasRewardVideoInCache) {
                    log(this.logTag, `等待加载完成，但广告不可用: posName=${posName}`);
                    msg.success = false;
                    msg.errMsg = "广告加载失败";
                    resolve(msg);
                    return;
                }
                log(this.logTag, `等待加载完成，广告可用: posName=${posName}`);
            }

            // 展示广告
            this.isShowingRewardVideo = true;
            this.currentRewardVideoResolver = resolve;
            log(this.logTag, `调用原生展示方法: posName=${posName}, unitId=${bundle.rewardAdId}`);

            try {
                bundle.rewardVideoInstance.show();
            } catch (error) {
                error(this.logTag, `展示广告时发生错误: posName=${posName}`, error);
                this.isShowingRewardVideo = false;
                this.currentRewardVideoResolver = null;
                msg.success = false;
                msg.errMsg = "展示广告时发生错误";
                resolve(msg);
            }
        });
    }

    preloadRewardVideo(): Promise<boolean> {
        log(this.logTag, "开始预加载所有激励广告");
        const promises: Promise<boolean>[] = [];

        this.rewardVideoInstanceMap.forEach((value, key) => {
            log(this.logTag, `检查预加载: posName=${key}, hasCache=${value.hasRewardVideoInCache}, isPreloading=${value.isPreloading}`);
            if (value && !value.hasRewardVideoInCache && !value.isPreloading) {
                log(this.logTag, `添加到预加载队列: posName=${key}`);
                promises.push(this.loadRewardVideo(key));
            }
        });

        if (promises.length === 0) {
            log(this.logTag, "没有需要预加载的广告");
            return Promise.resolve(true);
        }

        log(this.logTag, `开始预加载 ${promises.length} 个广告`);
        return Promise.all(promises).then(results => {
            const successCount = results.filter(result => result).length;
            log(this.logTag, `预加载完成，成功加载 ${successCount}/${promises.length} 个广告`);
            return successCount > 0;
        });
    }

    hasRewardVideo(posName: string): boolean {
        // const bundle = this.rewardVideoInstanceMap.get(posName);
        // const hasCache = bundle ? bundle.hasRewardVideoInCache : false;
        // log(this.logTag, `检查激励广告缓存: posName=${posName}, hasCache=${hasCache}`);
        // return hasCache;
        return true;
    }

    haveCacheVideo?(posName: string): boolean {
        return true;
    }
    //#endregion

    //#region 插屏广告
    private initInterstitialAds(interstitialAdsConfigArr: Array<InterstitialConfig
    >) {
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

    //#region Banner广告
    private initBanners(bannersConfigArr: Array<BannerConfig>) {
        // TODO: 实现Banner广告初始化
        bannersConfigArr?.forEach((value) => {
            let bundle = new BannerAdBundle();
            bundle.bannerId = value.id;
            bundle.style = value.style;
            bundle.bannerInstance = null;
            this.bannerInstanceMap.set(value.posName, bundle);
        });
    }

    showBanner(posName: string): Promise<boolean> {
        // TODO: 实现Banner广告展示
        log(this.logTag, `Banner广告展示待实现: ${posName}`);
        // return Promise.resolve(false);
        return new Promise((resolve) => {
            let bundle = this.bannerInstanceMap.get(posName);
            if (!bundle) {
                error(`>> IronSourceAds::showBanner 无法找到posName=${posName}的广告`);
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

                onPaidEvent(paidNTF: BannerPaidEventNotification) {
                    log("[IronSourceAds]", "Banner onPaidEvent", paidNTF);
                },

            }, { size: BannerSize.BANNER, alignments: BottomCenter, type: BannerSizeType.Portrait });
        });




    }

    hideBanner(posName: string) {
        // TODO: 实现Banner广告隐藏
        log(this.logTag, `Banner广告隐藏待实现: ${posName}`);
    }
    //#endregion

    //#region 格子广告
    private initGeZiAds(geZiAdsConfigArr: Array<GeZiAdConfig>) {
        // TODO: 实现格子广告初始化
        log(this.logTag, "格子广告初始化待实现");
    }
    //#endregion
}




