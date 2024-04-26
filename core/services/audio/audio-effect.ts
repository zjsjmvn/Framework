
import { AudioClip, AudioSource, error, _decorator } from 'cc';
const { ccclass, menu } = _decorator;

/**
 * 注：用playOneShot播放的音乐效果，在播放期间暂时没办法即时关闭音乐
 */

/** 游戏音效 */
@ccclass('AudioEffect')
export class AudioEffect extends AudioSource {
    playSelf(clip: AudioClip, callback?: Function) {
        this.playOneShot(clip, this.volume);
        callback && callback();
    }

}
