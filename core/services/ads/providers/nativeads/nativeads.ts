import { error, log, native } from 'cc';
import { RewardedAdClient } from './ads/client/RewardedAdClient';
import { IAdProvider } from '../iad-provider';
import { BannerAdBundle, BannerConfig, GeZiAdBundle, GeZiAdConfig, InterstitialAdBundle, InterstitialConfig, RewardVideoBundle, RewardVideoConfig, ShowInterstitialAdCallBackMsg, ShowRewardVideoCallBackMsg } from '../../ads-manager';
import { BannerClient } from './ads/client/BannerClient';
import { LoadAdError } from './ads/alias/TypeAlias';
import { BannerSize } from './misc/BannerSize';
import { BottomCenter } from './misc/BannerAlignment';
import { BannerSizeType } from './misc/BannerSizeType';
import { AdsBannerPaidEventNotification } from './proto/PaidEventNTF';
import { InterstitialAdClient } from './ads/client/InterstitialAdClient';
import { NativeAdsEvents } from './ads/client/AdClient';

export default class NativeAdsProvider implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private interstitialLoadingMap: Map<string, boolean> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();
    private geZiInstanceMap: Map<string, GeZiAdBundle> = new Map();

    public isShowingRewardVideo: boolean = false;
    public isShowingInterstitial: boolean = false;

    private logTag: string = "[NativeAdsProviderTS]";

    // 保存当前激励广告的 resolver
    private currentRewardVideoResolver: ((value: ShowRewardVideoCallBackMsg) => void) | null = null;
    // 保存当前插屏广告的 resolver
    private currentInterstitialResolver: ((value: ShowInterstitialAdCallBackMsg) => void) | null = null;
    private currentInterstitialTimeout: ReturnType<typeof setTimeout> | null = null;

    init(rewardVideosConfigArr: Array<RewardVideoConfig>, interstitialAdsConfigArr: Array<InterstitialConfig>, bannersConfigArr: Array<BannerConfig>, geZiAdsConfigArr: Array<GeZiAdConfig>) {
        log(this.logTag, `初始化广告`);

        this.initRewardVideos(rewardVideosConfigArr);
        this.initInterstitialAds(interstitialAdsConfigArr);
        this.initBanners(bannersConfigArr);
        this.initGeZiAds(geZiAdsConfigArr);

        if (native && native.jsbBridgeWrapper) {
            native.jsbBridgeWrapper.addNativeEventListener(NativeAdsEvents.READY, (arg?: any) => {
                log(this.logTag, "Ads.ready");
                // 预加载广告
                this.preloadRewardVideo();
                this.preloadInterstitial();
            });
        }
    }

    //#region 视频激励广告
    private initRewardVideo(rewardVideoId: string, rewardVideoBundle: RewardVideoBundle, posName: string) {
        log(this.logTag, `初始化激励广告: posName=${posName}, unitId=${rewardVideoId}`);
        const rewardedAdClient = new RewardedAdClient();
        rewardVideoBundle.rewardVideoInstance = rewardedAdClient;
        rewardVideoBundle.rewardAdId = rewardVideoId;
        rewardVideoBundle.hasRewardVideoInCache = false;
        rewardVideoBundle.isPreloading = false;
        rewardVideoBundle.loadPromise = null;
        rewardVideoBundle.loadResolver = null;

        log(this.logTag, `设置激励广告监听器: posName=${posName}`);
        rewardedAdClient.init(rewardVideoId, {
            onAdLoaded: () => {
                log(this.logTag, `激励广告加载成功: ${posName}`);
                rewardVideoBundle.hasRewardVideoInCache = true;
                rewardVideoBundle.isPreloading = false;
                rewardVideoBundle.loadResolver?.(true);
                rewardVideoBundle.loadResolver = null;
                rewardVideoBundle.loadPromise = null;
            },
            onAdFailedToLoad: (loadAdError) => {
                log(this.logTag, `激励广告加载失败: ${posName}`, loadAdError);
                rewardVideoBundle.hasRewardVideoInCache = false;
                rewardVideoBundle.isPreloading = false;
                rewardVideoBundle.loadResolver?.(false);
                rewardVideoBundle.loadResolver = null;
                rewardVideoBundle.loadPromise = null;
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
        });

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
        log(this.logTag, `请求加载激励广告: posName=${posName}`);
        const bundle = this.rewardVideoInstanceMap.get(posName);
        if (!bundle) {
            log(this.logTag, `加载失败: 未找到bundle, posName=${posName}`);
            return Promise.resolve(false);
        }

        if (bundle.hasRewardVideoInCache) {
            return Promise.resolve(true);
        }

        if (bundle.isPreloading) {
            log(this.logTag, `加载跳过: 广告正在加载中, posName=${posName}`);
            return bundle.loadPromise ?? Promise.resolve(false);
        }

        log(this.logTag, `开始加载激励广告: posName=${posName}`);
        bundle.isPreloading = true;
        bundle.hasRewardVideoInCache = false;
        bundle.loadPromise = new Promise((resolve) => {
            bundle.loadResolver = resolve;
        });
        log(this.logTag, `调用原生加载方法: posName=${posName}, unitId=${bundle.rewardAdId}`);
        (bundle.rewardVideoInstance as RewardedAdClient).load();
        return bundle.loadPromise;
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
        interstitialAdsConfigArr?.forEach((value) => {
            const bundle = new InterstitialAdBundle();
            bundle.interstitialId = value.id;
            bundle.hasInterstitialInCache = false;
            bundle.bShow = false;

            const interstitialClient = new InterstitialAdClient();
            bundle.interstitialInstance = interstitialClient;
            this.interstitialLoadingMap.set(value.posName, false);

            interstitialClient.init(value.id, {
                onAdLoaded: () => {
                    log(this.logTag, `插屏广告加载成功: ${value.posName}`);
                    bundle.hasInterstitialInCache = true;
                    this.interstitialLoadingMap.set(value.posName, false);
                },
                onAdFailedToLoad: (loadAdError) => {
                    log(this.logTag, `插屏广告加载失败: ${value.posName}`, loadAdError);
                    bundle.hasInterstitialInCache = false;
                    this.interstitialLoadingMap.set(value.posName, false);
                },
                onAdImpression: () => {
                    log(this.logTag, `插屏广告展示曝光: ${value.posName}`);
                },
                onAdDismissedFullScreenContent: () => {
                    log(this.logTag, `插屏广告关闭: ${value.posName}`);
                    this.isShowingInterstitial = false;
                    bundle.bShow = false;
                    bundle.hasInterstitialInCache = false;
                    this.loadInterstitial(value.posName);

                    const msg = new ShowInterstitialAdCallBackMsg();
                    msg.success = true;
                    this.resolveCurrentInterstitial(msg);
                },
                onAdFailedToShowFullScreenContent: (adError) => {
                    log(this.logTag, `插屏广告展示失败: ${value.posName}`, adError);
                    this.isShowingInterstitial = false;
                    bundle.bShow = false;
                    bundle.hasInterstitialInCache = false;
                    this.loadInterstitial(value.posName);

                    const msg = new ShowInterstitialAdCallBackMsg();
                    msg.success = false;
                    msg.errMsg = "广告展示失败";
                    this.resolveCurrentInterstitial(msg);
                }
            });

            this.interstitialInstanceMap.set(value.posName, bundle);
            log(this.logTag, `初始化插屏广告: posName=${value.posName}, unitId=${value.id}`);
        });
    }

    showInterstitial(posName: string): Promise<ShowInterstitialAdCallBackMsg> {
        return new Promise(async (resolve) => {
            if (this.isShowingInterstitial) {
                const msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = "广告正在播放中";
                resolve(msg);
                return;
            }

            const bundle = this.interstitialInstanceMap.get(posName);
            if (!bundle) {
                const msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = `无法找到posName=${posName}的插屏广告`;
                resolve(msg);
                return;
            }

            if (!bundle.hasInterstitialInCache) {
                const loaded = await this.loadInterstitial(posName);
                if (!loaded) {
                    const msg = new ShowInterstitialAdCallBackMsg();
                    msg.success = false;
                    msg.errMsg = "广告加载失败";
                    resolve(msg);
                    return;
                }
            }

            this.isShowingInterstitial = true;
            bundle.bShow = true;
            this.currentInterstitialResolver = resolve;
            this.startInterstitialTimeout(posName);

            try {
                (bundle.interstitialInstance as InterstitialAdClient).show();
            } catch (e) {
                this.isShowingInterstitial = false;
                bundle.bShow = false;
                const msg = new ShowInterstitialAdCallBackMsg();
                msg.success = false;
                msg.errMsg = "展示广告时发生错误";
                this.resolveCurrentInterstitial(msg);
            }
        });
    }

    hasInterstitial(posName: string): boolean {
        const bundle = this.interstitialInstanceMap.get(posName);
        if (!bundle) {
            return false;
        }
        // 允许“已配置但未缓存”的广告位参与 show 流程，show 时会即时 load。
        return true;
    }

    preloadInterstitial(posName?: string): Promise<boolean> {
        if (posName) {
            return this.loadInterstitial(posName);
        }

        const tasks: Promise<boolean>[] = [];
        this.interstitialInstanceMap.forEach((_, key) => {
            tasks.push(this.loadInterstitial(key));
        });
        if (tasks.length === 0) {
            return Promise.resolve(false);
        }
        return Promise.all(tasks).then(results => results.some(Boolean));
    }

    private loadInterstitial(posName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const bundle = this.interstitialInstanceMap.get(posName);
            if (!bundle) {
                resolve(false);
                return;
            }

            if (bundle.hasInterstitialInCache) {
                resolve(true);
                return;
            }

            if (this.interstitialLoadingMap.get(posName)) {
                let waitCount = 0;
                const timer = setInterval(() => {
                    waitCount++;
                    if (!this.interstitialLoadingMap.get(posName)) {
                        clearInterval(timer);
                        resolve(!!bundle.hasInterstitialInCache);
                        return;
                    }
                    if (waitCount >= 100) {
                        clearInterval(timer);
                        resolve(false);
                    }
                }, 100);
                return;
            }

            this.interstitialLoadingMap.set(posName, true);
            bundle.hasInterstitialInCache = false;

            try {
                (bundle.interstitialInstance as InterstitialAdClient).loadInterstitial();
            } catch (e) {
                this.interstitialLoadingMap.set(posName, false);
                resolve(false);
                return;
            }

            let waitCount = 0;
            const timer = setInterval(() => {
                waitCount++;
                if (!this.interstitialLoadingMap.get(posName)) {
                    clearInterval(timer);
                    resolve(!!bundle.hasInterstitialInCache);
                    return;
                }
                if (waitCount >= 100) {
                    clearInterval(timer);
                    this.interstitialLoadingMap.set(posName, false);
                    resolve(false);
                }
            }, 100);
        });
    }

    private startInterstitialTimeout(posName: string, timeoutMs: number = 20000) {
        this.clearInterstitialTimeout();
        this.currentInterstitialTimeout = setTimeout(() => {
            log(this.logTag, `插屏广告展示超时: posName=${posName}`);
            this.isShowingInterstitial = false;
            const bundle = this.interstitialInstanceMap.get(posName);
            if (bundle) {
                bundle.bShow = false;
                bundle.hasInterstitialInCache = false;
            }
            const msg = new ShowInterstitialAdCallBackMsg();
            msg.success = false;
            msg.errMsg = "广告展示超时";
            this.resolveCurrentInterstitial(msg);
        }, timeoutMs);
    }

    private clearInterstitialTimeout() {
        if (this.currentInterstitialTimeout) {
            clearTimeout(this.currentInterstitialTimeout);
            this.currentInterstitialTimeout = null;
        }
    }

    private resolveCurrentInterstitial(msg: ShowInterstitialAdCallBackMsg) {
        this.clearInterstitialTimeout();
        if (this.currentInterstitialResolver) {
            this.currentInterstitialResolver(msg);
            this.currentInterstitialResolver = null;
        }
    }
    //#endregion

    //#region Banner广告
    private initBanners(bannersConfigArr: Array<BannerConfig>) {
        bannersConfigArr?.forEach((value) => {
            const bundle = new BannerAdBundle();
            bundle.bannerId = value.id;
            bundle.style = value.style;
            bundle.hasBannerInCache = false;
            bundle.isLoading = false;
            bundle.pendingShow = false;
            bundle.bShow = false;

            const client = new BannerClient();
            client.init(value.id, {
                onAdImpression: () => {
                    log(this.logTag, "Banner onAdImpression", value.posName);
                },

                onAdClicked: () => {
                    log(this.logTag, "Banner onAdClicked", value.posName);
                },

                onAdLoaded: () => {
                    log(this.logTag, "Banner 加载成功", value.posName);
                    bundle.hasBannerInCache = true;
                    bundle.isLoading = false;

                    const shouldShow = bundle.pendingShow && bundle.bShow;
                    if (shouldShow) {
                        client.show(true);
                    }
                    bundle.pendingShow = false;

                    bundle.loadResolver?.(shouldShow);
                    bundle.loadResolver = null;
                    bundle.loadPromise = null;
                },

                onAdFailedToLoad: (loadError: LoadAdError) => {
                    log(this.logTag, "Banner 加载失败", value.posName, `${loadError}`);
                    bundle.hasBannerInCache = false;
                    bundle.isLoading = false;
                    bundle.pendingShow = false;
                    bundle.bShow = false;

                    bundle.loadResolver?.(false);
                    bundle.loadResolver = null;
                    bundle.loadPromise = null;
                },

                onAdClosed: () => {
                    log(this.logTag, "Banner 已关闭", value.posName);
                    bundle.bShow = false;
                },

                onPaidEvent: (paidNTF: AdsBannerPaidEventNotification) => {
                    log("[NativeAdsProvider]", "Banner onPaidEvent", paidNTF);
                },
            });

            bundle.bannerInstance = client;
            this.bannerInstanceMap.set(value.posName, bundle);
        });
    }

    showBanner(posName: string): Promise<boolean> {
        log(this.logTag, `展示Banner广告: ${posName}`);
        const bundle = this.bannerInstanceMap.get(posName);
        if (!bundle || !bundle.bannerInstance) {
            error(`>> NativeAdsProvider::showBanner 无法找到posName=${posName}的广告`);
            return Promise.resolve(false);
        }
        const bannerClient = bundle.bannerInstance as BannerClient;

        bundle.bShow = true;

        if (bundle.hasBannerInCache) {
            bannerClient.show(true);
            return Promise.resolve(true);
        }

        bundle.pendingShow = true;

        if (bundle.isLoading) {
            return bundle.loadPromise ?? Promise.resolve(false);
        }

        bundle.isLoading = true;
        bundle.loadPromise = new Promise((resolve) => {
            bundle.loadResolver = resolve;
        });
        bannerClient.loadBanner(BannerSize.SMART_BANNER, BannerSizeType.Portrait, BottomCenter);
        return bundle.loadPromise;
    }

    hideBanner(posName: string) {
        log(this.logTag, `隐藏Banner广告: ${posName}`);
        const bundle = this.bannerInstanceMap.get(posName);
        if (!bundle || !bundle.bannerInstance) {
            error(`>> NativeAdsProvider::hideBanner 无法找到posName=${posName}的广告`);
            return;
        }
        const bannerClient = bundle.bannerInstance as BannerClient;

        bundle.pendingShow = false;
        bundle.bShow = false;
        bannerClient.show(false);
        log(this.logTag, `Banner已隐藏: ${posName}`);

    }
    //#endregion

    //#region 格子广告
    private initGeZiAds(geZiAdsConfigArr: Array<GeZiAdConfig>) {
        log(this.logTag, "格子广告初始化待实现");
    }
    //#endregion


}
