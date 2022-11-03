import { RewardVideoCallBackMsg } from '../AdsManager';
import { IAdProvider } from './IAdvertiser';

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
    name: string;
    private bannerId: string = null;
    private bannerAd = null;
    private interstitialId: string = null;
    private interstitialAd = null;

    private rewardedVideoAd = null;
    private hasRewardAdInCache: boolean = false;

    constructor(rewardVideoId, bannerId, interstitialID) {
        this.initBanner(bannerId);
        this.initRewardVideo(rewardVideoId)
    }

    private initBanner(bannerId) {
        this.bannerId = bannerId;
    }

    showBanner(style, position?): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (window["qg"]?.getSystemInfoSync().platformVersionCode >= 1031) {
                //销毁旧实例
                if (this.bannerAd) {
                    this.bannerAd.destroy();
                }
                // vivo 文档写，banner广告实例不能复用，每次需要重新加载时要重新create
                //创建横幅实例
                this.bannerAd = window["qg"].createBannerAd({
                    posId: this.bannerId,
                    style: {} as any,//style内无需设置任何字段，banner会在屏幕底部居中显示，没有style字段，banner会在上边显示
                });

                //事件 - 加载成功
                this.bannerAd.onLoad(() => {
                    //标记为横幅广告载入成功成功
                    console.log('>> VivoAds:: banner 广告加载成功')
                    resolve(true);
                    this.bannerAd.show();
                });

                //事件 - 加载失败
                this.bannerAd.onError((err) => {
                    //调试日志
                    if (err.errCode == 30007) {
                        cc.log(">> VivoAds:: 系统banner广告播放次数已达限制");
                    } else {
                        cc.log(">> VivoAds::showBanner err", JSON.stringify(err));
                    }
                    resolve(false)
                });

                // 监听系统banner隐藏
                this.bannerAd.onClose(() => {
                });

                // 监听尺寸变化
                this.bannerAd.onResize(size => {
                    // good
                    console.log(size.width, size.height);
                    let width = cc.view.getFrameSize().width;
                    let height = cc.view.getFrameSize().height;

                    // this.bannerAd.style.top = height - size.height;
                    // this.bannerAd.style.left = (width - size.width) / 2;
                });
            }
        })
    }
    hideBanner() {
        if (!!this.bannerAd) {
            this.bannerAd.destroy();
        }
    }

    private initRewardVideo(rewardVideoId) {
        if (window['qg'].getSystemInfoSync().platformVersionCode >= 1041) {
            if (window['qg'].createRewardedVideoAd) {
                let self = this;
                //视频
                let adInfo = {
                    posId: rewardVideoId
                };

                this.rewardedVideoAd = window['qg'].createRewardedVideoAd(adInfo);
                this.rewardedVideoAd.onLoad(() => {
                    console.log('激励视频 广告加载成功')
                    this.hasRewardAdInCache = true;
                });
                this.rewardedVideoAd.onError(err => {
                    console.log('>> VivoAds::rewardedVideoAd::onError 激励视频播放失败', err)
                    this.hasRewardAdInCache = false;
                });
                this.preloadRewardVideo();
            } else {
                console.error(">> VivoAds::initRewardVideo window.qg无效,");
            }
        }
    }

    hasRewardVideo(position: any): boolean {
        return this.hasRewardAdInCache;
    }
    showRewardVideo(position: any): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log(">> VivoAds::showRewardVideo");
            if (!!this.rewardedVideoAd) {
                let onCloseFunc = (res) => {
                    // 用户点击了【关闭广告】按钮
                    let msg = new RewardVideoCallBackMsg();
                    if (res.isEnded) {
                        msg.result = true;
                    } else {
                        msg.errMsg = "广告被关闭，奖励失败";
                    }
                    resolve(msg);
                    this.rewardedVideoAd.load();
                    // 取消
                    this.rewardedVideoAd.offClose(onCloseFunc);
                }
                this.rewardedVideoAd.onClose(onCloseFunc);

                this.rewardedVideoAd.show().then(() => {
                    console.log('>> VivoAds 广告显示成功');
                }).catch((err) => {
                    console.error('>> VivoAds::showRewardVideo 广告组件出现问题', JSON.stringify(err));
                    let msg = new RewardVideoCallBackMsg();
                    msg.result = false;
                    msg.errMsg = VivoRewardVideoErrMsg[err.errCode] || '广告播放失败';
                    resolve(msg);
                    this.rewardedVideoAd.load();
                });
            } else {
                cc.error(">> VivoAds::rewardedVideoAd 无效");
            }
        })
    }
    preloadRewardVideo(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.load()
                    .then(() => {
                        console.log('>> VivoAds 拉取视频广告成功');
                        this.hasRewardAdInCache = true;
                        resolve(true);
                    })
                    .catch((err) => {
                        console.log('>> VivoAds 拉取视频广告失败');
                        this.hasRewardAdInCache = false;
                        resolve(false);
                    })
            } else {
                // 广告组件无效则直接返回false
                resolve(false);
            }
        })
    }

    private initInterstitial(interstitialId) {
        if (window['qg'].getSystemInfoSync().platformVersionCode >= 1031) {
            if (window['qg'].createInterstitialAd) {
                this.interstitialId = interstitialId;
                this.createInterstitialAds();
            }
        }
    }

    /**
     * @description 插屏广告实例不能复用，每次需要重新加载时要重新create
     * @private
     * @memberof VivoAds
     */
    private createInterstitialAds() {
        if (!!window["qg"] && !!window["qg"].createInterstitialAd) {
            if (this.interstitialAd) {
                this.interstitialAd.destroy();
                this.interstitialAd = null;
            }
            this.interstitialAd = window["qg"].createInterstitialAd({
                posId: this.interstitialId
            });
            this.interstitialAd.onLoad(() => {
                console.log('>> VivoAds::插页广告加载成功')
            });
            this.interstitialAd.onError(err => {
                console.log('>> VivoAds::插页广告 播放失败', err)
            });
            return true;
        }
        return false;
    }
    hasInterstitial(): boolean {
        return true;
    }

    preloadInterstitial(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    showInterstitial() {
        this.createInterstitialAds();
        return new Promise((resolve, reject) => {
            this.interstitialAd?.load()
                .then(() => {
                    this.interstitialAd.show().then(() => {
                        console.log('>> VivoAds::插页广告 播放成功')
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
                this.interstitialAd.offClose(onCloseFunc);
                resolve(true);
            }
            this.interstitialAd?.onClose(onCloseFunc);
        })
    }




}
