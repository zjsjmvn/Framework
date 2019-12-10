import { RewardVideoCallBackMsg } from '../AdsManager';
import { IAdProvider } from './IAdvertiser';

export const OPPORewardVideoErrMsg = {
    10000: '参数错误',
    10001: '广告服务未初始化',
    10002: '相应的广告位对象未创建或已经过期	同类型广告有多个 id，在初始化同一类型的两个广告位之间，隔 1s 再初始化',
    10003: '环境检测失败',
    10004: '不支持的方法操作	',
    /**
     * 1. 频繁拉取广告，是会拉取不到广告，因为我们对拉取频次作了限制。
     * 2. 是否对广告代码进行了限制 如防抖等
     * 3. 广告如果一次都拉取不到 可能是广告资源还没有申请的缘故
     */
    20000: '调用操作太频繁',
    /**    
     * 1. qg 开放平台查看广告是否异常，异常则重新申请',
     * 2. 手机设置的时间是不是晚于现在实际时间，设置到与北京时间同时'
     */
    20001: '广告信息已过期',

    /**
     * 1. errMsg 为 'ad list is null'，核对是否有在 onLoad 里面调用 show
     * 2. 核对游戏包名是否正确；
     * 3. 在包名正确情况下，概率性弹出 20003 报错属于正常现象，报错与广告填充率/ 短时间内频繁拉取广告有关，请上架后前往 qg 广告联盟后台，查看广告数据是否正常（填充率是否正常）；频繁拉取广告，是会拉取不到广告，因为我们对拉取频次作了限制。
     * 4. 广告点击后，不能立刻重复拉取
     * 5. errMsg 里面含有 1029 是 广告位 ID 填错, 或者是广告位与请求的广告类型不匹配
     * 6. errMsg 里面含有 1016 一般是广告位 ID 无效 / 不存在 / 审核未通过 
     * */
    20003: '未知错误或者网络出错',
    20005: '视频播放失败	errMsg 里面含有 10402 基本上是没有主动 load',
    20009: '视频文件缓存失败',
    20010: '视频文件不存在',
    20011: '未支持的视频文件格式',
    20012: '广告未加载成功的情况下，调用广告展示，展示失败',
};


export default class OPPOAds implements IAdProvider {


    private bannerAd: qg.BannerAd = null;
    private rewardedVideoAd: qg.RewardedVideoAd = null;
    private rewardCallBack: Function = null;
    private hasRewardAdInCache: boolean = false;
    private bannerId: string = null;


    /**
     *Creates an instance of OPPOAds.
     * @param {*} rewardVideoId
     * @param {*} bannerId
     * @memberof OPPOAds
     */
    constructor(rewardVideoId, bannerId) {
        this.initRewardVideo(rewardVideoId);
        this.initBanner(bannerId)
    }
    private initRewardVideo(rewardVideoId) {
        if (!!window.qg && !!window.qg.createRewardedVideoAd) {
            //视频
            let adInfo = {
                adUnitId: rewardVideoId
            };

            this.rewardedVideoAd = window.qg.createRewardedVideoAd(adInfo);
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
                this.hasRewardAdInCache = true;

            });
            this.rewardedVideoAd.onError(err => {
                console.log('激励视频播放失败', err)
                this.hasRewardAdInCache = false;

            });
            this.rewardedVideoAd.onClose(res => {
                if (!!res && res.isEnded || res === undefined) {
                    cc.log('qg rewardvideo success', JSON.stringify(res));
                    if (!!this.rewardCallBack) {
                        this.rewardCallBack(true);
                    }
                } else {
                    if (!!this.rewardCallBack) {
                        this.rewardCallBack(false);
                    }
                }
            });

            this.preloadRewardVideo();
        } else {
            console.error("ByteDanceAds：并不是qq平台，却引用了qq的广告组件");
        }
    }
    private initBanner(bannerId) {
        this.bannerId = bannerId;
    }

    showBanner(style: qg.RectanbleStyle): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (window.qg && window.qg.createBannerAd) {
                cc.log(JSON.stringify(style));
                let param = {
                    adUnitId: this.bannerId,
                    style: style
                };
                this.bannerAd = window.qg.createBannerAd(param);
                this.bannerAd.style.left = style.left;
                this.bannerAd.style.top = style.top;
                this.bannerAd.style.width = style.width;

                this.bannerAd.onError(err => {
                    console.log("OPPO banner error: ", err);
                    resolve(false)
                });
                this.bannerAd.onLoad(() => {
                    console.log('OPPO banner 加载成功')
                    resolve(true);
                    this.bannerAd.show();
                    this.bannerAd.style.width = style.width + 1;
                });
            };
        })

    }
    showInterstitial() {

    }
    showRewardVideo(): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log("OPPO showRewardVideo");
            this.rewardCallBack = (result: boolean) => {
                let msg = new RewardVideoCallBackMsg();
                if (result == true) {
                    msg.result = true;
                } else {
                    msg.errMsg = "广告被关闭，奖励失败";
                }
                cc.log("showRewardVideo msg", msg.errMsg);
                resolve(msg);
                this.rewardCallBack = null;
            }
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.show().then(() => {
                    console.log('广告显示成功');
                }).catch((err) => {
                    console.log('广告组件出现问题', err);
                    let msg = new RewardVideoCallBackMsg();
                    msg.result = false;
                    msg.errMsg = OPPORewardVideoErrMsg[err.errCode] || '广告播放失败';
                    resolve(msg);
                });
            } else {
                cc.error("rewardedVideoAd 无效");
            }

        })
    }
    hideBanner() {
        if (!!this.bannerAd) {
            this.bannerAd.destroy();
        }
    }

    /**
     * @description 预加载广告
     * @date 2019-09-09
     * @returns {Promise<boolean>}
     * @memberof OPPOAds
     */
    preloadRewardVideo(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!!this.rewardedVideoAd) {
                this.rewardedVideoAd.load()
                    .then(() => {
                        console.log('OPPOAds 拉取视频广告成功');
                        this.hasRewardAdInCache = true;
                        resolve(true);
                    })
                    .catch(() => {
                        console.log('OPPOAds 拉取视频广告失败');
                        this.hasRewardAdInCache = false;
                        resolve(false);
                    })
            } else {
                // 广告组件无效则直接返回false
                resolve(false);
            }
        })
    }


    hasRewardVideo(): boolean {
        return this.hasRewardAdInCache;
    }

}
