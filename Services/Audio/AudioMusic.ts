/*
 * @Author: dgflash
 * @Date: 2022-06-21 12:05:13
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 10:29:01
 */
import { AudioClip, AudioSource, error, _decorator } from 'cc';
const { ccclass, menu } = _decorator;

/** 背景音乐 */
@ccclass('AudioMusic')
export class AudioMusic extends AudioSource {
    /** 背景音乐播放完成回调 */
    onCompleteCallback: Function | null = null;

    private _progress: number = 0;
    private _url: string = null!;
    private _isPlay: boolean = false;

    /** 获取音乐播放进度 */
    get progress(): number {
        if (this.duration > 0)
            this._progress = this.currentTime / this.duration;
        return this._progress;
    }
    /**
     * 设置音乐当前播放进度
     * @param value     进度百分比0到1之间
     */
    set progress(value: number) {
        this._progress = value;
        this.currentTime = value * this.duration;
    }

    playMusic(clip: AudioClip, callback?: Function) {
        if (this.playing) {
            this._isPlay = false;
            this.stop();
            oops.res.release(this._url);
        }
        this.enabled = true;
        this.clip = clip;
        callback && callback();
        this.play();
    }

    /** cc.Component 生命周期方法，验证背景音乐播放完成逻辑，建议不要主动调用 */
    update(dt: number) {
        if (this.currentTime > 0) {
            this._isPlay = true;
        }
        if (this._isPlay && this.playing == false) {
            this._isPlay = false;
            this.enabled = false
            this.onCompleteCallback && this.onCompleteCallback();
        }
    }

    /** 释放当前背景音乐资源 */
    release() {
        if (this._url) {
            this._url = null!;
        }
    }
}
