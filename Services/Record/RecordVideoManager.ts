
/**
 * 录屏管理 wx tt平台
 * https://microapp.bytedance.com/docs/game/media/gameRecorder/GameRecorderManager.html
 */

const Event_updateRecordState = 'Event_updateRecordState';
/**
 *  https://microapp.bytedance.com/docs/game/share/tt.shareAppMessage.html#tt-shareappmessage
 *  视频分享数据
 */
interface ShareAppMessageData {
    /** 
     * article	发布图文内容
     * video	发布视频内容
     * token	口令分享，生成一串特定的字符串文本，仅头条APP支持
     * 
     * 想要直接分享到头条 选article
     */
    channel?: string;
    /** 转发标题 配置 shareVideoTitle */
    title?: string;
    /** 分享图片 */
    imageUrl?: string;

    /** 查询字符串 */
    query?: string;
    extra?: {
        /** 视频地址 */
        videoPath: string;
        /** 视频话题(只在抖音可用) */
        videoTopics?: string[];
        /** 是否分享为挑战视频 (头条支持) */
        createChallenge?: boolean;
    };

    success?: Function;
    fail?: Function;
}

/** 百度视频分享数据 */
interface BaiDuVideoShareData extends ShareAppMessageData {
    /** 视频地址 */
    videoPath: string;
}

/** 截屏合辑数据 */
interface ClipVideoData {
    /** path的值为停止录屏拿到的视频地址 */
    path: string,
    /** 裁剪的范围 */
    timeRange?: number[],
    /** 指定要裁剪的范围，数组中每一项为调用 recordClip 得到返回值 */
    clipRange?: number[],

    success?: Function,
    fail?: Function
}

interface ClipVideoCallFunc {
    (clipData: ClipVideoData, clipHistory: ClipHistory[]): boolean;
}

/** 裁剪记录片段 */
interface ClipHistory {
    /** 剪辑id */
    recordId: number,
    /** 时间段编号 */
    timeIndex: number
        /** 时间 sec */,
    time: number,
}

//位运算判定
enum StatusType {
    /** 默认状态，可录制 */
    None = 0,
    /** 录制中 */
    InRecord = 1,
    /** 暂停  */
    IsPause = 3,
    /** 录制完成，可分享   */
    RecordDone = 4,
}

/** 
 * 录屏回调类型
 */
enum RecordCallEndType {
    onStart = 'onStart',
    onPause = 'onPause',
    onResume = 'onResume',
    onStop = 'onStop',

    onError = 'onError',

    onShareVideoEnd = 'onShareVideoEnd',

    onClipVideoEnd = 'onClipVideoEnd',
}

export default class RecordVideoManager {
    private static _instance: RecordVideoManager;
    public static get instance() {
        return this._instance || (this._instance = new RecordVideoManager());
    }
    /** 视频录制管理单例 */
    recorder: any;
    /** 音频录制管理 */
    audioRecorder: any;

    /** 录屏地址 */
    videoPath: string;

    isAutoDestroy = false;
    inRecording = false;
    isPause = false;
    // 是否停止
    inStopping = false;


    currentRecordTimeLength = 0;

    // 录制时间,暂停和重开时间记录
    recordTimeStartArr: number[] = [];
    recordTimeEndArr: number[] = [];
    recordTimeIndex = 0;
    // 切割历史 [{id:,time:}]
    clipHistory: ClipHistory[] = [];
    //自动剪切
    autoClipout = false;
    /** 最后追加剪辑片段时间 */
    clipVideoTime = 0;
    //剪辑回调 处理片段 clipCallFun
    clipVideoCallFunc: ClipVideoCallFunc = null;

    static RecordCallEndType: typeof RecordCallEndType;
    static StatusType: typeof StatusType;

    constructor() {
        if (window.swan) {
            if (!window.swan.getVideoRecorderManager) {
                // 如果希望用户在最新版本的客户端上体验您的小游戏，可以提示用户升级
                window.swan.showModal({
                    title: '提示',
                    content: '当前客户端版本过低，无法使用该功能，请升级到最新版本后重试。'
                })

                return;
            }
        }

        let self = this;
        if (this._isValid()) {

            // 视频录制
            this.recorder = null;
            if (window.swan && window.swan.getVideoRecorderManager) {
                this.recorder = window.swan.getVideoRecorderManager();
            }
            else if (window.wx && window.wx.getGameRecorderManager) {
                this.recorder = window.wx.getGameRecorderManager();
            }

            if (this.recorder) {
                let recorder = this.recorder;
                /**存储地址 用来记录是否有视频 */
                this.videoPath = null;

                recorder.onStop(res => {
                    console.log('结束录屏', res.videoPath);

                    self.videoPath = res.videoPath;
                    // do somethine;
                    self.inStopping = false;
                    self.inRecording = false;
                    if (self.isAutoDestroy) {
                        self.videoPath = null;
                        self.isAutoDestroy = false;
                        self.resetRecordTime();
                    }
                    else {
                        if (self.recordTimeEndArr[self.recordTimeIndex] === undefined) {
                            self.recordTimeEndArr[self.recordTimeIndex] = Date.now();
                        }
                    }


                    if (self.autoClipout) {
                        self.clipVideo(self.clipVideoTime);
                    }

                });

            }

            /** 音频录制 */
            this.audioRecorder = undefined;
            if (window.wx && window.wx.getRecorderManager) {
                this.audioRecorder = window.wx.getRecorderManager();
            }
            // this.audioRecorder.onStop(res=>{
            //   this.audioPath = res.tempFilePath;
            // });            
            this.init();
        }


        this.initShareMenu();
    };

    /**
     * 初始化shareMenu
     */
    initShareMenu() {
        if (window.qq) {
            window.qq.onShareAppMessage(() => ({
                title: window.qqShareTitle,
                imageUrl: window.qqShareImgUrl
            }));

            window.qq.showShareMenu();
        }
    };

    /** 重置录制时间 */
    resetRecordTime() {
        this.recordTimeStartArr.splice(0, this.recordTimeStartArr.length);
        this.recordTimeEndArr.splice(0, this.recordTimeEndArr.length);

        this.recordTimeIndex = 0;
        this.clipHistory.splice(0, this.clipHistory.length);

        this.clipVideoTime = 0;
    }

    reset() {
        this.videoPath = null;
        this.inRecording = false;
        this.isPause = false;
    }

    init() {
        if (!this._isValid() || !this.recorder) return false;

        let self = this;
        let recorder = this.recorder;
        recorder.onStart(res => {
            console.log('录屏开始', JSON.stringify(res));
            // do somethine;

            self.inStopping = false;
            self.inRecording = true;
            self.isPause = false;

            //重置时间
            self.resetRecordTime();
            self.recordTimeStartArr[self.recordTimeIndex] = Date.now();


        });
        recorder.onResume(res => {
            if (self.isPause == true) {
                console.log('录屏继续', JSON.stringify(res));
                // do somethine;
                self.isPause = false;

                //时间恢复         
                self.recordTimeIndex++;
                self.recordTimeStartArr[self.recordTimeIndex] = Date.now();

            }

        });
        recorder.onPause(res => {
            if (self.isPause == false) {
                console.log('录屏暂停', JSON.stringify(res));
                // do somethine;
                self.isPause = true;

                //时间暂停 
                self.recordTimeEndArr[self.recordTimeIndex] = Date.now();


            }
        });
        recorder.onError(res => {
            console.log('录屏错误', res.errMsg);
            // do somethine;
            self.inRecording = false;
            self.isPause = false;

        });

        if (recorder.onInterruptionBegin) recorder.onInterruptionBegin(res => {
            console.log('监听录屏中断开始', JSON.stringify(res));
            // do somethine;
        });
        if (recorder.onInterruptionEnd) recorder.onInterruptionEnd(res => {
            console.log('监听录屏中断结束', JSON.stringify(res));
            // do somethine;
        });
    }
    ///////////////////////////////////////////////////////////////
    /**	Event
    //////////////////////////////////////////////////////////////*/


    /**
     * 绑定截屏回调
     */
    bindClipVideoCallFun(func: ClipVideoCallFunc) {
        this.clipVideoCallFunc = func;
    }

    ///////////////////////////////////////////////////////////////
    /**	录屏处理
    //////////////////////////////////////////////////////////////*/


    //清理
    clearVideo() {
        this.videoPath = null;
    }
    hasVideo() {
        return this.videoPath != null;
    }

    /**
     * 有视频或正在录制
     */
    hasVideoOrInRecording() {
        return this.inRecording || this.videoPath != null;
    }


    getStatus() {
        if (this.videoPath != null) {
            return StatusType.RecordDone;
        }
        else if (this.isPause) {
            return StatusType.IsPause;
        }
        else if (this.inRecording) {
            return StatusType.InRecord;
        }

        return StatusType.None;
    }

    /** 获得录制时间 */
    getRecordTime() {
        return this.getRecordDuration();
    }

    /**
     * 获得总录制时间
     *
     * @returns time
     */
    getRecordDuration() {
        var time = 0;
        for (let i = 0; i <= this.recordTimeIndex; i++) {
            if (this.recordTimeStartArr.length > i) {
                if (this.recordTimeEndArr.length > i) {
                    time += this.recordTimeEndArr[i] - this.recordTimeStartArr[i];
                }
                else {
                    time += Date.now() - this.recordTimeStartArr[i];
                }
            }
        }

        return time / 1000;
    }

    /** 
     * 获得总剪切片段时间
     */
    getTotalClipTime() {
        var time = 0;
        for (let i = 0; i < this.clipHistory.length; i++) {
            var element = this.clipHistory[i];
            time += element.time;
        }

        return time;
    }
    /**
     * 有暂停恢复的时候会分多段时间
     * 获得当前段时间
     */
    getCurStagedDuration() {
        var time = 0;
        var i = this.recordTimeIndex;
        if (this.recordTimeStartArr.length > i) {
            if (this.recordTimeEndArr.length > i) {
                time += this.recordTimeEndArr[i] - this.recordTimeStartArr[i];
            }
            else {
                time += Date.now() - this.recordTimeStartArr[i];
            }
        }

        return time / 1000;
    }

    //分享录屏
    shareVideo(successCallFunc?: Function, failCallFunc?: Function, self?: cc.Component) {
        if (!this._isValid() || !this.recorder) return false;
        if (this.videoPath != null && this.videoPath != '') {

            console.log('shareVideo', this.videoPath);

            let data = <ShareAppMessageData>{
                success: () => {
                    console.log(`分享成功！`);
                    if (successCallFunc) {
                        successCallFunc.call(self);
                    }

                },
                fail: (e) => {
                    console.log(`分享失败！${JSON.stringify(e)},${this.getRecordDuration()}`);
                    if (failCallFunc) {
                        failCallFunc.call(self);
                    }

                }
            };


            if (window.swan) {
                (<BaiDuVideoShareData>data).videoPath = this.videoPath;
                window.swan.shareVideo(data);
            }
            else {
                data.channel = 'video';
                data.extra = {
                    videoPath: this.videoPath,
                };

                data.imageUrl = 'raw';
                if (window.shareVideoTitle && window.shareVideoTitle.length > 0) {
                    data.title = <string>window.shareVideoTitle;
                }

                window.wx.shareAppMessage(data);
            }


            return true;
        } else {
            cc.log("this.videoPath ==null ");
        }


        return false;
    }

    /**
     * 音频开始录制
     * 暂不可用
     * @param {*} duration
     */
    audioStart(duration) {
        if (!this._isValid() || !this.audioRecorder) return false;

        cc.log('audioStart start');
        const options = {
            duration: 60000,
            sampleRate: 44100,
            numberOfChannels: 1,
            encodeBitRate: 192000,
            format: 'aac',
            frameSize: 1
        };

        if (this.audioRecorder == undefined) {
            return cc.log('error');
        }
        this.audioRecorder.start(options);
        let recorderManager = this.audioRecorder;

        recorderManager.onStart(() => {
            console.log('audioRecord start')
        });
        recorderManager.onPause(() => {
            console.log('audioRecord pause')
        });
        recorderManager.onStop((res) => {
            console.log('audioRecord stop', res)
            const { tempFilePath } = res
        });

        this.audioRecorder.onFrameRecorded((res) => {

            console.log('frameBuffer.byteLength', JSON.stringify(res));
        });
        cc.log('audioStart end');
    }


    /**
     * @description 开始录屏
     * @param {number} duration 时长
     * @returns 
     * @memberof RecordVideoManager
     */
    start(duration: number = 300) {
        if (!this._isValid() || !this.recorder) return false;
        this.isAutoDestroy = false;
        this.recorder.start({
            duration: duration,
        });
    };


    /**
     * 暂停录屏
     */
    pause() {
        if (!this._isValid() || !this.recorder) return false;
        this.recorder.pause();
    }

    /**
      * 恢复录屏
      */
    resume() {
        if (!this._isValid() || !this.recorder) return false;
        this.recorder.resume();
    }
    /**
     * 结束录屏
     * 停止录屏。可以通过 onStop 接口监听录屏结束事件，获得录屏地址。
     */
    stop() {
        if (!this._isValid() || !this.recorder) return false;
        if (!this.inRecording || this.inStopping) return false;

        let recorder = this.recorder;
        if (this.getRecordDuration() < 4) {  // 防止在游戏即将结束的时候打开录制，录制时间不满 3 秒出现的问题
            this.reset();
            this.isAutoDestroy = true;
        }

        // 裁剪总时间
        // 如果裁剪时间不足会导致ios生成失败

        let sysInfo = window.wx.getSystemInfoSync();
        if (sysInfo.system.indexOf('iOS') !== -1) {
            let clipTime = this.getTotalClipTime();
            if (clipTime > 0 && clipTime < 4) {
                this.recordClip(4, 0);
                setTimeout(() => {
                    recorder.stop();
                }, 0.03);
                return;
            }
        }

        this.isPause = false;
        this.inStopping = true;
        recorder.stop();

        //this.audioRecorder.stop();
    }
    /**
     * 删除视频
     *
     */
    destroyVideo() {
        this.stop();
        this.inRecording = false;
        this.isAutoDestroy = true;
        this.videoPath = null;
    }

    /**
     * 记录精彩的视频片段，
     * 调用时必须是正在录屏，可以多次调用，记录不同时刻。在结束录屏时，可以调用 clipVideo 接口剪辑并合成记录的片段。
     * timeRange  lastTimeRange 3,3 否 数组的值表示记录这一时刻的前后时间段内的视频，单位是s
     */
    recordClip(timeRange, lastTimeRange) {
        if (!this._isValid() || !this.recorder) return false;

        if (this.inRecording) {

            let recorder = this.recorder;
            let id = recorder.recordClip({
                timeRange: [timeRange, lastTimeRange],
            });

            /** 切割记录 */
            this.clipHistory.push(<ClipHistory>{
                recordId: id,//剪辑id
                timeIndex: this.recordTimeIndex, //时间段编号
                time: timeRange + lastTimeRange, //时间        
            });
        }

    }
    // btnRecordClip() {
    //     if (!this._isValid()) return false;

    //     this.recordClip(3, 3);
    // }

    /**
     * 合并剪辑 
     * 在stop之后
     */
    clipVideo(clipTime = 0, clipTimeEnd = 0) {
        if (!this._isValid() || !this.recorder) return false;

        let recorder = this.recorder;
        let videoPath = this.videoPath;

        this.clipVideoTime = clipTime;

        //还在录制中
        if (this.inRecording) {
            //等待结束再来裁剪
            this.autoClipout = true;
            return;
        }

        if (videoPath != null) {

            let data = <ClipVideoData>{
                path: videoPath,
                success: (res) => {
                    console.log('clip Video', res.videoPath);

                    this.videoPath = res.videoPath;

                }
            };

            if (clipTime != undefined) {
                data.timeRange = [clipTime, clipTimeEnd];
            }

            //剪辑回调
            if (this.clipVideoCallFunc) {
                /**
                 * data:clipData,
                 * clipHistory: history
                 */
                if (this.clipVideoCallFunc(data, this.clipHistory) === false) {
                    return;
                }
            }

            recorder.clipVideo(data);
        }
    }

    /**
     * 分享app信息
     *
     * @param {*} successCallFunc
     * @param {*} failCallFunc
     * @param {cc.Component} [self] 
     * @param {boolean} [isQuickShare=false] 是否快速分享
     * @returns
     * @memberof RecordVideoManager
     */
    shareAppMessage(successCallFunc, failCallFunc, self?: cc.Component, isQuickShare: boolean = false): void {
        // 模拟器处理w
        if (CC_PREVIEW && !window.wx && successCallFunc) successCallFunc();
        if (window.wx == null) return;

        let data = <ShareAppMessageData>{
            success() {
                console.log(`图文 分享成功！`);
                if (successCallFunc) {
                    successCallFunc.call(self);
                }
            },
            fail(e) {
                console.log(`图文 分享失败！`);
                if (failCallFunc) {
                    failCallFunc.call(self);
                }

                window.wx.showToast({
                    title: '分享失败！',
                    icon: 'none',
                    duration: 2000,
                });

            }
        };

        if (isQuickShare) {
            data.channel = 'token';
        }

        if (window.qq) {
            data.title = window.qqShareTitle;
            data.imageUrl = window.qqShareImgUrl;
        }

        window.wx.shareAppMessage(data);
    }

    /**
     * 快速图文分享
     *
     * @param {*} successCallFunc
     * @param {*} failCallFunc
     * @param {*} self
     * @returns
     * @memberof RecordVideoManager
     */
    quickShareAppMessage(successCallFunc, failCallFunc, self) {
        this.shareAppMessage(successCallFunc, failCallFunc, self);
    }

    _isValid() {
        return window.wx != undefined && (!window.swan || window.swan.getVideoRecorderManager != undefined);
    }
}

RecordVideoManager.RecordCallEndType = RecordCallEndType;
RecordVideoManager.StatusType = StatusType;

// module.exports = RecordVideoManager;

// window.plug = window.plug || {};
// window.plug.RecordVideoManager = RecordVideoManager;


// @ts-ignore
if (window.wx && window.wx.saveFile === undefined &&
    // @ts-ignore
    window.wx.getFileSystemManager !== undefined) {
    // @ts-ignore
    window.wx.saveFile = function () {
        // @ts-ignore
        return window.wx.getFileSystemManager().saveFile();
    }
}

// /** 自动初始化 */
// setTimeout(() => {
//     RecordVideoManager.instance;
// }, 2000);