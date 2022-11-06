import { RewardVideoCallBackMsg, RewardVideoBundle, InterstitialAdBundle, BannerAdBundle } from '../AdsManager';
import { IAdProvider } from './IAdProvider';
export const VivoRewardVideoErrMsg = {
    // "-1": "未知原因	联系技术对接",
    // "-2": "外部SDK错误	联系技术对接",
    // "-3": "广告拉取太频繁	广告拉取时间间隔建议在1s以上",
    // "-100": "网络超时，广告加载不出来	换个手机换个网络试试",
    // 1: "应用id或者广告位id配置信息不存在	检查对应ID是否正确填写，确认已申请广告位",
    // 2: "无效的广告位id	如果应用本身线上没什么流量多请求几次，如果应用本身在线上有一定的请求量级就咨询广告联盟客服。",
    // 3: "广告位被冻结	咨询广告联盟客服冻结原因",
    // 4: "没有对应的广告	检查posId参数与申请的一致，并确认申请了对应广告位",
    // 5: "异常	联系技术对接",
    // 101: "网络异常	检查是否可以正常上网",
    // 102: "本地JSON解析异常	联系技术对接",
    // 103: "服务器返回错误	联系技术对接",
    // 104: "解密失败	联系技术对接",
    // 105: "素材加载失败	联系技术对接",
    // 106: "广告参数错误	检查广告参数是否填写正确",
    // 107: "广告信息加载超时（开屏有时间限制）	延时再次加载",
    // 108: "不存在广告	广告填充率问题，开发者忽略即可",
    // 1000: "错误码同103 服务器返回错误	联系技术对接",
    // 1001: "错误码同106 参数错误	检查广告参数是否填写正确 / 将手机时间调成一天之后",
    // 1002: "错误码同1 应用id或者广告位id配置信息不存在	检查对应ID是否正确填写，确认已申请广告位",
    // 1003: "错误码同 - 1 内部错误 - ",
    // 1004: "错误码同108 不存在广告	广告填充率问题，开发者忽略即可",
    // 1007: "错误码同2 无效的广告位id	如果应用本身线上没什么流量多请求几次，如果应用本身在线上有一定的请求量级就咨询广告联盟客服。",
    // 1008: "错误码同3 广告位被冻结	咨询广告联盟客服冻结原因",
    // 200: "200不需要处理，忽略即可",
    // 500: "网络问题（1052引擎版本是调用频率过高参见30009）	该问题是由于网络问题导致，部分CP会遇到，可以试试4G或者换个网络测试",
    // 20000: "广告加载失败	检查posId是否正确填写",
    // 30000: "广告对象长时间不用会被回收导致或者是创建初始化未完成或未初始化(等待初始化首次加载完成)	重新创建或者是等待加载完成在onload里面去show广告",
    // 30002: "加载广告失败	banner、插屏广告重新create然后show，激励视频可以直接去load，需要等到1秒之后调用；上述操作后依旧不行，请参考问题排查步骤",
    // 30003: "新手广告保护	测试时可以将手机时间调成一天之后",
    // 30004: "小游戏启动一定时间内不允许展示广告",
    // 30005: "距离上次广告展示时间间隔不足",
    // 30006: "新安装用户若干天后才允许展示广告",
    // 30007: "单进程内广告播放次数已达限制",
    // 30008: "启动来源不支持展示广告	检查启动来源是否在申请广告位ID时填写的信息范围内",
    // 30009: "1秒内调用广告次数超过1次	降低广告展示频率，建议最少间隔1s",
    // 30010: "检测到用户频繁关闭广告，暂时不展示",
    // 30011: "用户第几次启动游戏才可出现广告",
    // 30012: "该广告一天内最大曝光次数已到",
    // 30013: "单个游戏启动次数过少，不允许请求广告",
    // 30014: "免广告特权保护中",
    // 30015: "盒子广告限制触发，九宫格和banner样式只能同时展示一个广告",
    // 40200: "加载广告失败	请参考问题排查步骤",
    // 40218: "错误码同30002 加载广告失败	请参考问题排查步骤",
    // 100000: "请求格式错误	检查请求代码格式是否与示例一致",
    // 100125: "广告位宽高无效	联系技术对接",
    // 101000: "请求 ID 信息缺失	联系技术对接",
    // 102006: "无广告	联系技术对接",
    // 103050: "应用操作系统信息错误	联系技术对接",
    // 103060: "应用包名和注册包名不一致	检查包名是否和申请广告位时填写的一致",
    // 104000: "设备信息缺失	联系技术对接",
    // 104010: "设备类型缺失	联系技术对接",
    // 104011: "设备类型信息错误	联系技术对接",
    // 104020: "操作系统信息缺失	联系技术对接",
    // 104021: "操作系统信息错误	联系技术对接",
    // 104030: "操作系统版本信息缺失	联系技术对接",
    // 104040: "操作系统主版本信息缺失	联系技术对接",
    // 104050: "厂商信息缺失	联系技术对接",
    // 104060: "设备型号信息缺失	联系技术对接",
    // 104070: "设备唯一标识符缺失	联系技术对接",
    // 104071: "设备唯一标识符错误	联系技术对接",
    // 104080: "android id缺失	联系技术对接",
    // 104081: "android id错误	联系技术对接",
    // 104090: "屏幕尺寸信息缺失	联系技术对接",
    // 104100: "屏幕尺寸宽度缺失	联系技术对接",
    // 104110: "屏幕尺寸高度缺失	联系技术对接",
    // 105000: "网络环境信息缺失	联系技术对接",
    // 105010: "网络地址信息缺失	联系技术对接",
    // 105011: "网络地址信息格式错误	联系技术对接",
    // 105020: "网络连接类型缺失	联系技术对接",
    // 105021: "网络连接类型错误	联系技术对接",
    // 105030: "运营商类型缺失	联系技术对接",
    // 105031: "运营商类型错误	联系技术对接",
    // 105040: "Wi - Fi热点地址信息缺失	联系技术对接",
    // 107000: "广告位ID缺失	确认posId参数正确填写",
    // 107010: "广告尺寸信息缺失	联系技术对接",
    // 107020: "广告位尺寸宽度缺失	联系技术对接",
    // 107030: "广告位尺寸高度缺失	联系技术对接",
    // 107040: "广告位信息缺失	联系技术对接",
    // 200000: "无广告返回	检查posId是否正确填写",
    // 201000: "广告无数据	联系技术对接 ",
}
export default class VivoAds implements IAdProvider {
    private rewardVideoInstanceMap: Map<string, RewardVideoBundle> = new Map();
    private interstitialInstanceMap: Map<string, InterstitialAdBundle> = new Map();
    private bannerInstanceMap: Map<string, BannerAdBundle> = new Map();

    constructor(rewardVideosMap: Map<string, string>, interstitialAdsMap: Map<string, string>, bannersMap: Map<string, string>) {
        this.initRewardVideos(rewardVideosMap);
        this.initInterstitialAds(interstitialAdsMap);
        this.initBanners(bannersMap);
    }


    //#region 插屏广告
    hasInterstitial(): boolean {
        return true;
    }
    preloadInterstitial(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    private initInterstitialAds(interstitialAdsMap: Map<string, string>) {
        interstitialAdsMap?.forEach((value, key) => {
            let bundle = new InterstitialAdBundle();
            bundle.interstitialId = value;
            this.interstitialInstanceMap.set(key, bundle);
        });
    }
    public showInterstitial(posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let bundle = this.interstitialInstanceMap.get(posName);
            if (!!bundle) {
                this.createInterstitialAdsWithBundle(bundle);
                bundle.interstitialInstance
                    .load()
                    .then(() => {
                        bundle.interstitialInstance.show().then(() => {
                        }).catch(err => {
                            console.log('show', err);
                            resolve(false);
                        })
                    })
                    .catch(err => {
                        console.log('load', err);
                        resolve(false);
                    });
                let onCloseFunc = res => {
                    console.log('>> VivoAds::插页广告关闭')
                    bundle.interstitialInstance.offClose(onCloseFunc);
                    resolve(true);
                }
                bundle.interstitialInstance.onClose(onCloseFunc);
            } else {
                cc.error(`>> VivoAds::showInterstitial 无法找到posName=${posName}的广告`);
                return Promise.reject(false);
            }
        });



    }

    private createInterstitialAdsWithBundle(bundle: InterstitialAdBundle) {
        if (!!window['qg'] && !!window['qg'].createInterstitialAd) {
            if (bundle.interstitialInstance) {
                bundle.interstitialInstance.destroy();
                bundle.interstitialInstance = null;
            }
            bundle.interstitialInstance = window['qg'].createInterstitialAd({
                posId: bundle.interstitialId
            });
            bundle.interstitialInstance.onLoad(() => {
                console.log('>> VivoAds::插页广告加载成功')
                bundle.hasInterstitialInCache = true;
            });
            bundle.interstitialInstance.onError(err => {
                console.log('>> VivoAds::插页广告 播放失败', err)
                bundle.hasInterstitialInCache = false;
            });
        }
    }

    //#endregion


    //#region 视频激励广告
    private initRewardVideo(rewardVideoId, rewardVideoBundle: RewardVideoBundle) {
        if (window['qg'].getSystemInfoSync().platformVersionCode >= 1041) {
            if (!!window['qg'] && !!window['qg'].createRewardedVideoAd) {
                //视频
                let adInfo = {
                    posId: rewardVideoId
                };
                rewardVideoBundle.rewardVideoInstance = window['qg'].createRewardedVideoAd(adInfo);
                rewardVideoBundle.rewardVideoInstance.onLoad(() => {
                    console.log('激励视频 广告加载成功')
                    rewardVideoBundle.hasRewardVideoInCache = true;
                });
                rewardVideoBundle.rewardVideoInstance.onError(err => {
                    console.log('>> VivoAds::rewardedVideoAd::onError 激励视频播放失败', err)
                    rewardVideoBundle.hasRewardVideoInCache = false;
                });
            } else {
                console.error(">> VivoAds::initRewardVideo window.qg无效,");
                return null;
            }
        }
    }

    private initRewardVideos(rewardVideosMap: Map<string, string>) {
        if (window['qg'].getSystemInfoSync().platformVersionCode >= 1041) {
            rewardVideosMap?.forEach((value, key) => {
                let bundle = new RewardVideoBundle();
                this.initRewardVideo(value, bundle);
                this.rewardVideoInstanceMap.set(key, bundle);
            });
        }
    }

    showRewardVideo(posName: string): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            let bundle = this.rewardVideoInstanceMap.get(posName);
            let msg = new RewardVideoCallBackMsg();
            if (bundle) {
                cc.log(">> VivoAds::showRewardVideo");
                if (!!bundle.rewardVideoInstance) {
                    let onCloseFunc = (res) => {
                        // 用户点击了【关闭广告】按钮
                        if (!!res && res.isEnded) {
                            msg.result = true;
                        } else {
                            msg.errMsg = "广告被关闭，奖励失败";
                        }
                        resolve(msg);
                        bundle.rewardVideoInstance.load();
                        // 取消
                        bundle.rewardVideoInstance.offClose(onCloseFunc);
                    }
                    bundle.rewardVideoInstance.onClose(onCloseFunc);
                    bundle.rewardVideoInstance.show().then(() => {
                        console.log('>> VivoAds 广告显示成功');
                        bundle.hasRewardVideoInCache = false;
                    }).catch((err) => {
                        console.error('>> VivoAds::showRewardVideo 广告组件出现问题', JSON.stringify(err));
                        msg.result = false;
                        msg.errMsg = VivoRewardVideoErrMsg[err.errCode] || '广告播放失败';
                        bundle.hasRewardVideoInCache = false;
                        bundle.rewardVideoInstance.load();
                        resolve(msg);
                    });
                } else {
                    cc.error(`>> VivoAds::rewardedVideoAd rewardVideoInstance为空`);
                    msg.result = false;
                    msg.errMsg = '广告初始化失败，实例为空';
                    resolve(msg);
                }
            }
            else {
                if (window['qg'].getSystemInfoSync().platformVersionCode >= 1041) {
                    cc.error(`>> VivoAds::rewardedVideoAd 无法找到posName=${posName}的广告`);
                    msg.errMsg = `无法找到posName=${posName}的广告`;
                } else {
                    cc.error(`>> VivoAds::rewardedVideoAd 基础库版本不满足，无法展示`);
                    msg.errMsg = `基础库版本太低，需要更新`;
                }
                msg.result = false;
                resolve(msg);
            }
        })
    }

    preloadRewardVideo(): Promise<boolean> {
        this.rewardVideoInstanceMap.forEach((value, key) => {
            if (!!value) {
                value.rewardVideoInstance.load()
                    .then(() => {
                        console.log(`>> VivoAds ${key}拉取视频广告成功`);
                        value.hasRewardVideoInCache = true;
                    })
                    .catch(() => {
                        console.log(`>> VivoAds ${key}拉取视频广告失败`);
                        value.hasRewardVideoInCache = false;
                    })
            }
        })
        return Promise.resolve(true);
    }

    hasRewardVideo(posName: string): boolean {
        let bundle = this.rewardVideoInstanceMap.get(posName);
        return bundle.hasRewardVideoInCache;
    }





    //#endregion


    //#region  banner广告

    private initBanners(bannersMap: Map<string, string>) {
        bannersMap?.forEach((value, key) => {
            let bundle = new BannerAdBundle();
            bundle.bannerId = value;
            this.bannerInstanceMap.set(key, bundle);
        });
    }


    showBanner(style, posName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (window["qg"]?.getSystemInfoSync().platformVersionCode >= 1031) {
                let bundle = this.bannerInstanceMap.get(posName);
                if (bundle) {
                    if (window['qg'] && window['qg'].createBannerAd) {
                        let param = {
                            posId: bundle.bannerId,
                            style: {},
                        };
                        if (bundle.bannerInstance) {
                            bundle.bannerInstance.destroy();
                        }
                        bundle.bannerInstance = window['qg'].createBannerAd(param);
                        bundle.bannerInstance.onError(err => {
                            if (err.errCode == 30007) {
                                cc.log(">> VivoAds:: 系统banner广告播放次数已达限制");
                            } else {
                                cc.log(">> VivoAds::showBanner err", JSON.stringify(err));
                            }
                            resolve(false)
                        });
                        bundle.bannerInstance.onLoad(() => {
                            console.log('>> VivoAds:: banner 广告加载成功')
                            resolve(true);
                            bundle.bannerInstance.show();
                        });
                        bundle.bannerInstance.onResize(size => {

                        });
                    };
                }
            }
            resolve(false);
        })
    }

    hideBanner(posName: string) {
        let bundle = this.bannerInstanceMap.get(posName);
        bundle?.bannerInstance.destroy();
    }

    //#endregion


}




