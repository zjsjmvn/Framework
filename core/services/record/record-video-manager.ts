import { Game, game } from 'cc';
/**
 * 分享参数
 */
interface ShareParams {
    templateId?: string,
    title?: string,
    desc?: string,
    query?: string,
    extra?: ShareExtraParams,
}

export interface ShareExtraParams {
    //是否支持跳转到播放页， 以及支持获取视频信息等接口 （为 true 时会在 success 回调中带上 videoId）
    withVideoId?: boolean,
    //视频地址 ，分享一个本地视频
    videoPath?: string,
    //视频话题(仅抖音支持) ，目前由 hashtag_list 代替，为保证兼容性，建议同时填写两个。
    videoTopics?: Array<string>
    //是否分享为挑战视频 ( 仅头条支持 )
    createChallenge?: boolean
    //生成输入的默认文案
    video_title?: string,
    //视频话题(仅抖音支持)
    hashtag_list?: Array<string>,
    // /分享视频的标签，可以结合获取抖音视频排行榜使用
    videoTag?: string,
    //抖音 pgc 音乐的短链(仅抖音支持，需要基础库版本大于 1.90) 。形如https://v.douyin.com/JmcxWo8/， 参考 抖音小游戏录屏带配乐能力
    defaultBgm?: string,
    //抖音上可用的剪映模板 ID， 参考 录屏添加剪映视频模板能力
    cutTemplateId?: string,
    //剪映模板不可用或者剪映模板 ID 无效的时候是否直接回调失败。
    abortWhenCutTemplateUnavailable?: boolean
}


/**
 * 录屏工具类
 * 支持 百度/头条
 */
export default class RecordVideoManager {

    private static _instance: RecordVideoManager;
    public static get instance() {
        return this._instance || (this._instance = new RecordVideoManager());
    }

    private _recorder = null;
    private _videoPath: string = null;

    get videoPath() {
        return this._videoPath;
    }

    get recording() {
        return this._recorder._recording;
    }

    get recorder() {
        return this._recorder;
    }

    get platform(): any {
        // 头条/百度
        return window[`tt`] || window[`swan`];
    }


    private constructor() {
        // 今日头条/百度
        if (this.platform) {
            // 初始化 recorder
            if (this.platform.getVideoRecorderManager) {
                this._recorder = this.platform.getVideoRecorderManager();
            } else if (this.platform.getGameRecorderManager) {
                this._recorder = this.platform.getGameRecorderManager();
            }
            if (!this._recorder) {
                return;
            }
            // 错误打印
            this._recorder.onError(errMsg => {
                console.error(errMsg);
            });
            // 退到后台
            game.on(Game.EVENT_HIDE, () => {
                this.recording && this.recorder.pause();
            }, this);
            // 回到前台
            game.on(Game.EVENT_HIDE, () => {
                this.recording && this.recorder.resume();
            }, this);
        }
    }


    /**
     * 开始录屏
     * @param callback 开始录屏回调
     * @param stopCallback 自动结束录屏时回调
     */
    startRecord(duration?: number, callback?: (res) => void, stopCallback?: (res) => void) {
        console.warn("调用开始录屏");
        this.recorder?.onStart(res => {
            console.warn("录屏开始", res);
            this.recorder._recording = true;
            this.recorder._st = new Date().getTime();
            callback && callback(res);
            this.recorder.resume();
        });
        // 需要考虑录屏超时自动结束的问题
        this.recorder?.onStop(res => {
            console.warn("录屏结束(自动)", res);
            this.recorder._recording = false;
            this.recorder._st = 0;
            this._videoPath = res.videoPath;
            // fix 头条上recoder._recording状态不对！！
            stopCallback && setTimeout(() => {
                stopCallback(res);
            });
        });
        // 默认使用最大支持时长 300s
        this.recorder?.start({ duration: duration || 300 });
    }


    /**
     * 结束录屏
     * @param callback 结束录屏时回调
     */
    stopRecord(callback?: (res) => void) {
        console.warn("调用结束录屏");
        if (this.recorder) {
            this.recorder.resume();
            if (!this.recorder._recording) {
                console.warn("当前录制器不处于录制中...");
                callback && callback(null);
                return;
            }
            this.recorder.onStop(res => {
                console.warn("录屏结束", res);
                this._videoPath = res.videoPath;
                this.recorder._recording = false;
                this.recorder._st = 0;
                // fix 头条上recoder._recording状态不对！！
                callback && setTimeout(() => {
                    callback(res);
                });
            });
            this.recorder.stop();
        } else {
            callback && callback(null);
        }
    }


    /**
     * @description 在录屏开启后可以剪切
     * @param {*} timeRangeStart
     * @param {*} timeRangeEnd
     * @memberof RecordVideoManager
     */
    public recordClip(timeRangeStart, timeRangeEnd) {
        this.recorder?.recordClip({ timeRange: [timeRangeStart, timeRangeEnd] })
    }
    /**
     * 分享录屏
     * @param isShowToast 是否展示toast
     * @param shareSuccessCallback 分享结果回调
     * errCode 0成功 -1失败
     */
    shareVideo(shareParams: ShareParams, isShowToast: boolean, shareSuccessCallback: (errCode: number) => void) {
        if (this.platform && this._videoPath && this._videoPath.length > 0) {
            this.platform.shareAppMessage({
                channel: "video",
                templateId: shareParams.templateId,
                title: shareParams.title,
                desc: shareParams.desc,
                extra: {
                    videoPath: this._videoPath, // 可替换成录屏得到的视频地址
                    videoTopics: shareParams.extra.videoTopics,
                    video_title: shareParams.extra.video_title,
                    hashtag_list: shareParams.extra.hashtag_list,
                    defaultBgm: shareParams.extra.defaultBgm,
                },
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
        } else {
            this.showToast("录制时间太短~");
        }
    }


    showToast(title: string, duration: number = 2000) {
        this.platform && this.platform.showToast({
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



