import { length } from '../../../../../creator';
export default class AudioManager {
    private static _instance: AudioManager;
    public static get instance() {
        return this._instance || (this._instance = new AudioManager());
    }
    lastPlayedMusicPath: string = ''
    playing_music = false;
    playing_music_name = undefined;
    maxVolume = 1;
    file_path_map = new Map();
    audio_clip_map = {};
    audio_path_map = {};
    //时间播放间隔限制 秒
    playIntervalLimitSec = 0.03;
    wxAudioMap: any = null;
    loading: boolean = false;

    volumeChangeFunc = null;
    constructor() {
    }

    public preloadAudio(path) {
        if (!this.loading && Object.keys(this.audio_clip_map).length == 0) {
            let self = this;
            this.loading = true;
            cc.loader.loadResDir(path, cc.AudioClip, null, (error, res_arr, str_arr) => {

                self.loading = false;
                if (error) {
                    cc.log(error);
                }
                else {
                    str_arr.forEach((str, index) => {
                        let arr = str.split('/');
                        let name = arr[arr.length - 1];
                        let res_url = res_arr[index].nativeUrl;
                        self.audio_clip_map[name] = res_arr[index];
                        //带后缀地址
                        if (cc.loader.md5Pipe) {
                            res_url = cc.loader.md5Pipe.transformURL(res_url);
                        }
                        self.audio_path_map[name] = res_url;//'resources/' + str + '.' + typeName;                        
                    });
                    if (self.playing_music) {
                        self.playMusic(self.playing_music_name);
                        // 激活音效
                    }
                }
            });
        }
    }
    public switchoverAudioMusicOnOff() {
        this.setPlayMusic(!this.canPlayMusic());
    }
    public switchoverAudioEffectOnOff() {
        this.setPlayEffects(!this.canPlayEffect());
    }

    public canPlayMusic() {
        let canPlayMusic = cc.sys.localStorage.getItem('canPlayMusic');// LocalDataManager.readBool();
        if (canPlayMusic === null || canPlayMusic === undefined || canPlayMusic == '') {
            canPlayMusic = true;
        }
        return !!canPlayMusic;
    }
    public canPlayEffect() {
        let canPlayEffects = cc.sys.localStorage.getItem('canPlayEffect');
        if (canPlayEffects === null || canPlayEffects === undefined || canPlayEffects == '') {
            canPlayEffects = true;
        }
        return !!canPlayEffects;
    }
    /**
     * @description
     * @param {*} bPlayMusic
     * @memberof AudioManager
     */
    public setPlayMusic(canPlayMusic: boolean) {
        if (this.canPlayMusic() != canPlayMusic) {
            cc.sys.localStorage.setItem('canPlayMusic', canPlayMusic);
            this.playMusic(null);
        }
    }

    public setPlayEffects(canPlayEffect: boolean) {
        if (this.canPlayEffect() != canPlayEffect) {
            cc.sys.localStorage.setItem('canPlayEffect', canPlayEffect);
            if (!canPlayEffect) {
                this.stopAllEffects();
            }
        }
    }


    public playMusic(filePath, volume = 1) {
        if (!this.canPlayMusic()) {
            if (filePath && filePath.length != 0) {
                this.lastPlayedMusicPath = filePath;
            }
            this.stopMusic();
        }
        else {
            if (!!!filePath) return false;
            if (filePath == this.lastPlayedMusicPath && cc.audioEngine.isMusicPlaying()) {
                return true;
            }
            this.playing_music = true;
            this.lastPlayedMusicPath = filePath;
            this.playing_music_name = filePath;
            return this._playMusic(filePath, true, volume);
        }
        return false;
    }
    private _playMusic(filePath, loop = false, volume = 1) {
        if (this.audio_clip_map[filePath]) {
            this._setMusicVolume(volume);
            cc.audioEngine.playMusic(this.audio_clip_map[filePath], loop);
            return true;
        }
        else {
            cc.error("没有找到music", filePath);
        }
        return false;
    }

    /**
     * @description 暂时不完善，先留着。
     * @param {*} volume
     * @param {boolean} [isGradually=false] 是否是逐渐变化
     * @param {number} [internalMS=100]
     * @memberof AudioManager
     */
    public setMusicVolume(volume, isGradually = false, internalMS = 100) {
        volume = Math.min(volume, this.maxVolume);
        if (volume > 0 && !cc.audioEngine.isMusicPlaying()) {
            this.playMusic(this.lastPlayedMusicPath);
        }

        if (isGradually) {
            if (this.volumeChangeFunc) {
                clearInterval(this.volumeChangeFunc);
                this.volumeChangeFunc = null;
            }

            this.volumeChangeFunc = setInterval(function () {
                const changeSpeed = 0.1;
                let currentVolume = this._getMusicVolume();
                let changeVolume = Math.abs(currentVolume - volume);
                if (changeVolume < changeSpeed) {
                    this._setMusicVolume(volume);
                    if (this.volumeChangeCall) {
                        clearInterval(this.volumeChangeCall);
                        this.volumeChangeCall = null;
                    }
                }
                else {
                    cc.audioEngine.isMusicPlaying()
                    this._setMusicVolume(currentVolume + (currentVolume > volume ? - changeSpeed : changeSpeed));
                }
            }, internalMS);

        }
        else {
            cc.audioEngine.isMusicPlaying()
            this._setMusicVolume(volume);
        }
    }
    private _setMusicVolume(volume) {
        cc.audioEngine.setMusicVolume(volume);
    }
    private getMusicVolume() {
        return cc.audioEngine.getMusicVolume();
    }
    /**
     * Stop playing background music.
     *
     * @param {boolean} [isGradually=false] 逐渐停止
     */
    public stopMusic(isGradually = false, internalMS = 100) {
        if (isGradually) {
            let clear_func = (interval) => {
                clearInterval(interval);
            }
            let decreaseFunc = setInterval(() => {
                if (this.getMusicVolume() > 0.1) {
                    this._setMusicVolume(this.getMusicVolume() - 0.1);
                }
                else {
                    this.playing_music = false;
                    cc.audioEngine.stopMusic();
                    clear_func(decreaseFunc);
                }
            }, internalMS);
        }
        else {
            cc.audioEngine.stopMusic();
        }
    }

    public playEffect(filePath, loop = false, volume = 1) {
        cc.log('canPlayEffect', this.canPlayEffect());
        if (this.canPlayEffect()) {

            return this.play(filePath, loop, volume);
        }
        return 0;
    }

    private play(filePath, loop = false, volume = 1) {
        if (this.audio_clip_map[filePath]) {
            return cc.audioEngine.play(this.audio_clip_map[filePath], loop, volume);
        }
        else {
            cc.error("没有正确加载到音效", filePath);
        }
        return 0;
    }
    /**
    * Pause playing background music.
    */
    public pauseMusic() {
        cc.audioEngine.pauseMusic();
        this.playing_music = false;
    }
    /**
    * Resume playing background music.
    */
    public resumeMusic() {
        cc.audioEngine.resumeMusic();
        this.playing_music = true;
    }
    /**
    * Pause all playing sound effect.
    */
    public pauseAllEffects() {
        cc.audioEngine.pauseAll();
    }

    /**
    * Resume all playing sound effect.
    */
    public resumeAllEffects() {
        cc.audioEngine.resumeAll();
    }

    /**
    * Stop all playing sound effects.
    */
    public stopAllEffects() {
        cc.audioEngine.stopAllEffects();
    }

}

