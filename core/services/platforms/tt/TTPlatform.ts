import { View, log, sys, view, warn } from 'cc';
import { IAdProvider } from '../../Ads/Provider/IAdProvider';
import BasePlatform from '../BasePlatform';
import { TTCanIUse, TT_onTouchEnd } from './TTDecorators';
import { BYTEDANCE } from '../../../../../../temp/declarations/cc.env';
import { versionCompare } from '../../../utils/VersionUtil';
export default class TTPlatform extends BasePlatform {

    init() {
        super.init();
        // 添加默认的广告provider
    }

    // public addAdProvider(adProvider: IAdProvider) {
    //     super.addAdProvider(adProvider);
    //     return this;
    // }
    // public removeAdProvider(providerName: string) {
    // }



    /**
     * @description  长震动
     * @memberof TTPlatform
     */
    @TTCanIUse
    public vibrateLong() {
        tt.vibrateLong(null);
    }

    /**
     * @description 短震动
     * @memberof TTPlatform
     */
    @TTCanIUse
    public vibrateShort() {
        tt?.vibrateShort(null);
    }

    /**
      * @description 可以将小游戏快捷方式添加到手机桌面上。
      * @memberof TTPlatform
      */
    // @TT_onTouchEnd
    // @TTCanIUse
    public static addShortcut(verifyFunc, callback) {
        let func = (touches: []) => {
            if (verifyFunc(touches)) {
                log('在点击范围内');
                tt.addShortcut({
                    success() {
                        console.log("添加桌面成功");
                        callback && callback(0);
                    },
                    fail(err) {
                        console.log("添加桌面失败", err.errMsg);
                        callback && callback(-1)
                    },
                    complete(sss) {
                        console.log("添加桌面完成", sss);
                        // tt.offTouchEnd(func)
                    }
                });
            }
        }
        this.addTouchEndListener(func);
    }

    private static touchListener = null;
    public static addTouchEndListener(callFunc: Function) {
        this.touchListener = (event: { touches: [], changedTouches: [], timeStamp: number }) => {
            // log('tt.onTouchEnd', event, view.getFrameSize());
            let touches = [];
            for (var i = 0; i < event.changedTouches.length; i++) {
                let touch_event = event.changedTouches[i];
                let ps = view.convertToLocationInView(touch_event.clientX, touch_event.clientY, { top: 0, left: 0, width: view.getFrameSize().width, height: view.getFrameSize().height })
                view._convertPointWithScale(ps);
                touches.push(ps);
            }
            callFunc(touches);
        }
        tt.onTouchEnd(this.touchListener);
    }

    public static removeTouchEndListener() {
        if (this.touchListener) {
            tt.offTouchEnd(this.touchListener);
        }
    }
    public static removeAddShortcutTouchEndListener() { }
    /**
     * @description 检查快捷方式
     * @param {(res: { status: { exist: boolean, needUpdate: boolean }, errMsg: string }) => void} successCallback
     * @param {({ errMsg: string }) => void} failCallback
     * @memberof TTPlatform
     */
    public static checkShortcut(successCallback: (res: { status: { exist: boolean, needUpdate: boolean }, errMsg: string }) => void, failCallback: ({ errMsg: string }) => void) {
        tt.checkShortcut({
            success(res) {
                console.log("检查快捷方式", res.status);
                successCallback && successCallback(res)
            },
            fail(res) {
                console.log("检查快捷方式失败", res.errMsg);
                failCallback && failCallback(res);
            },
        });
    }





    /**
     * @description 收藏小程序
     * @memberof TTPlatform
     */
    @TTCanIUse
    public static showFavoriteGuide(callback) {
        tt?.showFavoriteGuide({
            type: "bar",
            content: "一键添加到我的小程序",
            position: "bottom",
            success(res) {
                console.log("引导组件展示成功");
                callback && callback(0);
            },
            fail(res) {
                console.log("引导组件展示失败");
                callback && callback(-1);
            },
        });

    }


    // @TTCanIUse
    public static setImRankData(dataType: number, value: string, priority: number = 0, extra?) {
        if (this.canIUseImRankList) {
            tt.setImRankData({
                dataType: dataType,
                value: value,
                priority: priority,
                extra: "extra",
                success(res) {
                    console.log(`setImRankData success res: ${res}`);
                },
                fail(res) {
                    console.log(`setImRankData fail res: ${res.errMsg}`);
                },
            });
        }
    }

    // @TTCanIUse
    public static getImRankList(relationType, dataType, rankType, suffix, rankTitle) {
        if (this.canIUseImRankList) {
            tt.getImRankList({
                relationType: relationType, //只展示好友榜
                dataType: dataType, //只圈选type为数字类型的数据进行排序
                rankType: rankType, //每月1号更新，只对当月1号到现在写入的数据进行排序
                suffix: suffix, //数据后缀，成绩后续默认带上 “分”
                rankTitle: rankTitle, //标题
                success(res) {
                    console.log(`getImRankData success res: ${res}`);
                },
                fail(res) {
                    console.log(`getImRankData fail res: ${res.errMsg}`);
                },
            });
        } else {
            warn("app版本不够，无法使用排行榜");
        }
    }

    public static get canIUseImRankList() {
        if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
            let systemInfos = tt.getSystemInfoSync();
            if (systemInfos.appName = "Douyin" || systemInfos.appName == "douyin_lite") {
                let sdkVersion = systemInfos.SDKVersion;
                if (versionCompare(sdkVersion, '2.70.0', true)) {
                    return true;
                }
                return false;
            }
        }
        return false;
    }







}

// let t = new TTPlatform();
// t.addShortcut();
