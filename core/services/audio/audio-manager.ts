import { Component, director, Node, resources, AudioClip, error } from 'cc';
import { AudioMusic } from './audio-music';
import { AudioEffect } from './audio-effect';


export class AudioManager extends Component {
    static _instance: AudioManager;

    /** 音频管理单例对象 */
    static get instance(): AudioManager {
        if (this._instance == null) {
            var node = new Node("AudioManager");
            director.addPersistRootNode(node);
            this._instance = node.addComponent(AudioManager);

            var music = new Node("AudioMusic");
            music.parent = node;
            this._instance.audioMusic = music.addComponent(AudioMusic);

            var effect = new Node("AudioEffect");
            effect.parent = node;
            this._instance.audioEffect = effect.addComponent(AudioEffect);
        }
        return this._instance;
    }

    private effects: Map<string, AudioClip> = new Map<string, AudioClip>();
    private musics: Map<string, AudioClip> = new Map<string, AudioClip>();

    private audioMusic!: AudioMusic;
    private audioEffect!: AudioEffect;

    private _musicVolume: number = 1;
    /**
     * 获取背景音乐音量
     */
    get musicVolume(): number {
        return this._musicVolume;
    }
    /** 
     * 设置背景音乐音量
     * @param value     音乐音量值
     */
    set musicVolume(value: number) {
        this._musicVolume = value;
        this.audioMusic.volume = value;
    }
    private effectVolume: number = 1;

    /** 
     * 获取音效音量 
     */
    get volumeEffect(): number {
        return this.effectVolume;
    }
    /**
     * 设置获取音效音量
     * @param value     音效音量值
     */
    set volumeEffect(value: number) {
        this.effectVolume = value;
        this.audioEffect.volume = value;
    }
    private _audioMusicSwitchState: boolean = true;
    /** 
     * 获取背景音乐开关值 
     */
    get audioMusicSwitchState(): boolean {
        return this._audioMusicSwitchState;
    }
    /** 
     * 设置背景音乐开关值
     * @param value     开关值
     */
    set audioMusicSwitchState(value: boolean) {
        this._audioMusicSwitchState = value;
        if (value == false)
            this.audioMusic.stop();
    }


    private _audioEffectSwitchState: boolean = true;
    /** 
     * 获取音效开关值 
     */
    get audioEffectSwitchState(): boolean {
        return this._audioEffectSwitchState;
    }
    /**
     * 设置音效开关值
     * @param value     音效开关值
     */
    set audioEffectSwitchState(value: boolean) {
        this._audioEffectSwitchState = value;
        if (value == false)
            this.audioEffect.stop();
    }
    /**
     * 获取背景音乐播放进度
     */
    get musicProgress(): number {
        return this.audioMusic.progress;
    }
    /**
     * 设置背景乐播放进度
     * @param value     播放进度值
     */
    set musicProgress(value: number) {
        this.audioMusic.progress = value;
    }

    /**
     * 设置背景音乐播放完成回调
     * @param callback 背景音乐播放完成回调
     */
    setMusicCompleteCallback(callback: Function | null = null) {
        this.audioMusic.onCompleteCallback = callback;
    }

    /**
     * 播放背景音乐
     * @param url        资源地址
     * @param callback   音乐播放完成事件
     */
    playMusic(url: string, callback?: Function) {
        if (this._audioMusicSwitchState) {
            let clip = this.musics.get(url);
            if (clip !== null) {
                this.audioMusic.playMusic(clip, callback)
            } else {
                resources.load(url, AudioClip, (err: Error | null, data: AudioClip) => {
                    if (err) {
                        error(err);
                    }
                    this.musics.set(url, data);
                    this.audioMusic.playMusic(data, callback)
                });
            }
        }
    }

    /**
     * 播放音效
     * @param url        资源地址
     */
    playEffect(url: string, callback?: Function) {
        if (this._audioEffectSwitchState) {
            let clip = this.effects.get(url);
            if (clip !== null) {
                this.audioEffect.playEffect(clip, callback)
            } else {
                resources.load(url, AudioClip, (err: Error | null, data: AudioClip) => {
                    if (err) {
                        error(err);
                    }
                    this.effects.set(url, data);
                    this.audioEffect.playEffect(clip, callback)
                });
            }
        }
    }

    /** 恢复当前暂停的音乐与音效播放 */
    resumeAll() {
        if (this.audioMusic) {
            this.audioMusic.play();
            this.audioEffect.play();
        }
    }

    /** 暂停当前音乐与音效的播放 */
    pauseAll() {
        if (this.audioMusic) {
            this.audioMusic.pause();
            this.audioEffect.pause();
        }
    }

    /** 停止当前音乐与音效的播放 */
    stopAll() {
        if (this.audioMusic) {
            this.audioMusic.stop();
            this.audioEffect.stop();
        }
    }

}