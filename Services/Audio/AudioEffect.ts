/*
 * @Author: dgflash
 * @Date: 2022-09-01 18:00:28
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 10:22:36
 */
import { AudioClip, AudioSource, error, _decorator } from 'cc';
const { ccclass, menu } = _decorator;

/**
 * 注：用playOneShot播放的音乐效果，在播放期间暂时没办法即时关闭音乐
 */

/** 游戏音效 */
@ccclass('AudioEffect')
export class AudioEffect extends AudioSource {
    playEffect(clip: AudioClip, callback?: Function) {
        this.playOneShot(clip, this.volume);
        callback && callback();
    }
    /** 释放所有已使用过的音效资源 */
    release() {
        this.effects.clear();
    }
}
