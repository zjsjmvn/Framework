import { ImageAsset, SpriteFrame, Texture2D, log, sys, view, warn } from 'cc';
import { TTCanIUse } from './tt-decorators';
import { versionCompare } from '../../../utils/version-util';
import BasePlatform from '../base-platform';
import { ViewModel } from '../../../ui/mvvm/view-model';

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
    @TTCanIUse()
    public vibrateLong() {
        tt.vibrateLong(null);
    }

    /**
     * @description 短震动
     * @memberof TTPlatform
     */
    @TTCanIUse()
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
    @TTCanIUse()
    public static showFavoriteGuide(callback) {
        // 需要promise
        // tt?.showFavoriteGuide({
        //     type: "bar",
        //     content: "一键添加到我的小程序",
        //     position: "bottom",
        //     success(res) {
        //         console.log("引导组件展示成功");
        //         callback && callback(0);
        //     },
        //     fail(res) {
        //         console.log("引导组件展示失败");
        //         callback && callback(-1);
        //     },
        // });
    }

    @TTCanIUse()
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

    public static loadAvatar(url: string, width: number = 100, height: number = 100): Promise<SpriteFrame> {
        return new Promise<SpriteFrame>((resolve, reject) => {
            const image = tt.createImage();
            image.src = url;
            image.width = width;
            image.height = height;
            image.addEventListener('load', res => {
                console.log("tt load remote image success: ", res);
                let imageAsset = new ImageAsset(image);
                let texture = new Texture2D();
                texture.image = imageAsset;

                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                spriteFrame.packable = false;

                resolve(spriteFrame);
            });
            image.addEventListener('error', error => {
                console.log("tt load remote image error: ", error);
                reject(error);
            });
        });
    }

    public static ttLogin(force = true): Promise<{ errMsg: string, code: string, anonymousCode: string, isLogin: boolean }> {
        return new Promise((resolve, reject) => {
            tt.login({
                force: force, success: async (res: { errMsg: string, code: string, anonymousCode: string, isLogin: boolean }) => {
                    console.log('success', res.errMsg, res.code, res.anonymousCode, res.isLogin);
                    resolve(res);
                }, fail: (res) => {
                    resolve(null);
                    console.log('fail')
                }
            })
        })
    }
    // getUserInfo
    public static getUserInfo(): Promise<{ avatarUrl: string, nickName: string }> {
        return new Promise((resolve, reject) => {
            tt.getUserInfo({
                withCredentials: true,
                withRealNameAuthenticationInfo: false,
                success(res) {
                    console.log(`getUserInfo 调用成功`, res.userInfo, res.rawData);
                    resolve(res.userInfo);
                },
                fail(res) {
                    console.log(`getUserInfo 调用失败`, res.errMsg);
                    resolve(null);
                },
            });
        })
    }

    public static getUserProfile(force = true): Promise<{ avatarUrl: string, nickName: string }> {
        return new Promise((resolve, reject) => {
            tt.getUserProfile({
                force: force,
                success(res) {
                    console.log(`getUserInfo 调用成功`, res.userInfo, res.rawData);
                    console.log(`res`, res);
                    resolve(res.userInfo);
                },
                fail(res) {
                    console.log(`getUserInfo 调用失败`, res.errMsg);
                    resolve(null);
                },
            });
        })
    }

    public static openSetting(): Promise<any> {
        return new Promise((resolve, reject) => {
            tt.openSetting({
                withSubscriptions: true,
                success(res) {
                    console.log(`openSetting 调用success`);
                    console.log(`res`, res);
                    resolve(res);
                },
                fail(res) {
                    console.log(`openSetting 调用失败`, res.errMsg);
                    resolve(null);
                },
            });
        })
    }

    public static authToGetUserInfo() {
        tt.authorize({
            scope: 'scope.userInfo',
            success: () => {
                tt.showToast({
                    title: '授权成功'
                });

            },
            fail: (res) => {
                tt.showToast({
                    title: `授权失败 : ${res.errMsg}`
                });
            }
        });
    }

    public static getLaunchOptionsSync() {
        var options = tt.getLaunchOptionsSync();
        console.log(options);
    }

    public static shareAppMessage(shareParams: ShareParam, isShowToast: boolean, shareSuccessCallback: (errCode: number) => void) {
        tt.shareAppMessage({
            channel: shareParams.channel,
            templateId: shareParams.templateId,
            desc: shareParams.desc,
            title: shareParams.title,
            imageUrl: shareParams.imageUrl,
            query: shareParams.query,
            success: (res) => {
                console.log("shareAppMessage success" + JSON.stringify(res));
                shareSuccessCallback && shareSuccessCallback(0);
            },
            fail: (e) => {
                console.log("分享视频失败:'" + e.errMsg + "'", e);
                shareSuccessCallback && shareSuccessCallback(-1);
            }
        });
    }

    public static shareAppMessageWithVideo(shareParams: ShareParam, extra: VideoShareExtra, isShowToast: boolean, shareSuccessCallback: (errCode: number) => void) {
        tt.shareAppMessage({
            channel: ShareAppChannel.video,
            templateId: shareParams.templateId,
            desc: shareParams.desc,
            title: shareParams.title,
            imageUrl: shareParams.imageUrl,
            query: shareParams.query,
            extra,
            success: (res) => {
                console.log("分享视频成功" + JSON.stringify(res));
                shareSuccessCallback && shareSuccessCallback(0);
            },
            fail: (e) => {
                console.log("分享视频失败:'" + e.errMsg + "'", e);
                switch (e.errMsg) {
                    case "shareAppMessage:fail video file is too short":
                        isShowToast && this.showToast(`录制时间太短~`);
                        break;
                    case "shareAppMessage:cancel":
                    case "shareAppMessage:fail publish fail":
                        // isShowToast && this.showToast(`分享取消`);
                        break;
                    default:
                        if (e.errMsg.match(`shareAppMessage:fail unknown error on method onFail`)) {
                            //    this.showToast(`录制时间太短~`);
                        } else {
                            isShowToast && this.showToast(`录制时间太短~`);
                        }
                        break;
                }
                shareSuccessCallback && shareSuccessCallback(-1);
            }
        });
    }

    public static shareAppMessageWithPicture(shareParams: ShareParam, extra: PictureShareExtra, isShowToast: boolean, shareSuccessCallback: (errCode: number) => void) {
        tt.shareAppMessage({
            channel: ShareAppChannel.picture,
            templateId: shareParams.templateId,
            desc: shareParams.desc,
            title: shareParams.title,
            imageUrl: shareParams.imageUrl,
            query: shareParams.query,
            extra,
            success: () => {
                console.log("分享视频成功");
                shareSuccessCallback && shareSuccessCallback(0);
            },
            fail: (e) => {
                console.log("分享视频失败:'" + e.errMsg + "'", e);
                switch (e.errMsg) {
                    case "shareAppMessage:fail video file is too short":
                        isShowToast && this.showToast(`录制时间太短~`);
                        break;
                    case "shareAppMessage:cancel":
                    case "shareAppMessage:fail publish fail":
                        // isShowToast && this.showToast(`分享取消`);
                        break;
                    default:
                        if (e.errMsg.match(`shareAppMessage:fail unknown error on method onFail`)) {
                            //    this.showToast(`录制时间太短~`);
                        } else {
                            isShowToast && this.showToast(`录制时间太短~`);
                        }
                        break;
                }
                shareSuccessCallback && shareSuccessCallback(-1);
            }
        });
    }

    public static showToast(title: string, duration: number = 2000) {
        tt.showToast({
            icon: 'none',
            title: title,
            duration: duration,
            success(res) {
                console.log(`${res}`);
            },
            fail(res) {
                console.log(`showToast调用失败`);
            }
        });
    }
}






export class ShareParam {
    channel: string;
    templateId: string;
    desc: string;
    title: string;
    imageUrl: string;
    query: string;
    extra: string;
    success: Function;
    fail: Function;
    complete: Function;
}

export class VideoShareExtra {
    withVideoId: string;
    videoPath: string;
    videoTopics: string;
    createChallenge: boolean;
    video_title: string;
    hashtag_list: string;
    videoTag: string;
    defaultBgm: string;
    cutTemplateId: string;
    abortWhenCutTemplateUnavailable: boolean;
}
export class PictureShareExtra {
    picturePath: string;
    contentTitle: string;
    contentDescription: string;
    hashtag_list: boolean;
}

export enum ShareAppChannel {
    default = "",
    invite = "invite",
    video = "video",
    token = "token",
    article = "article",
    picture = "picture",
}