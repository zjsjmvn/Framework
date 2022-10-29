export default class AudioManager {
    private static _instance: AudioManager;
    public static get instance() {
        return this._instance || (this._instance = new AudioManager());
    }
    public audioPath: string = null;
    lastPlayedMusicPath: string = ''
    playing_music = false;
    playing_music_name = undefined;
    maxVolume = 1;
    audio_clip_map: Map<string, cc.AudioClip> = new Map()
    audio_path_map: Map<string, string> = new Map()
    loading: boolean = false;
    private loadingAudioArr: Array<string> = new Array();
    volumeChangeFunc = null;
    _canPlayMusic: boolean = true;
    _canPlayEffect: boolean = true;
    public get canPlayMusic() {
        return this._canPlayMusic;
    }
    public set canPlayMusic(val) {
        this._canPlayMusic = val;
        if (!!val == false) {
            this.stopMusic();
        }
    }
    public get canPlayEffect() {
        return this._canPlayEffect;
    }
    public set canPlayEffect(val) {
        this._canPlayEffect = val;
        if (!!val == false) {
            this.stopAllEffects();
        }
    }
    constructor() {
    }

    public preloadAudio(path) {
        cc.error('暂时没实现。需要修改cc.loader');
        if (!this.loading && Object.keys(this.audio_clip_map).length == 0) {
            let self = this;
            this.loading = true;
            cc.resources.loadDir(path, cc.AudioClip, null, (error, res_arr) => {

                self.loading = false;
                if (error) {
                    cc.log(error);
                }
                else {

                    // cc.log('res_arr', res_arr)
                    // str_arr.forEach((str, index) => {
                    //     let arr = str.split('/');
                    //     let name = arr[arr.length - 1];
                    //     let res_url = res_arr[index].nativeUrl;
                    //     self.audio_clip_map[name] = res_arr[index];
                    //     //带后缀地址
                    //     if (cc.loader.md5Pipe) {
                    //         res_url = cc.loader.md5Pipe.transformURL(res_url);
                    //     }
                    //     self.audio_path_map[name] = res_url;//'resources/' + str + '.' + typeName;                        
                    // });


                    if (self.playing_music) {
                        self.playMusic(self.playing_music_name);
                        // 激活音效
                    }
                }
            });
        }
    }



    public playMusic(filePath, volume = 1) {
        if (!this.canPlayMusic) {
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
            if (this.audio_clip_map[filePath]) {
                this._setMusicVolume(volume);
                cc.audioEngine.playMusic(this.audio_clip_map[filePath], true);
                return true;
            }
            else {
                if (!!!this.audioPath) {
                    cc.warn('audioPath is null');
                } else {
                    this.loadAudio(this.audioPath + filePath, true, true, true, volume);
                }
            }
            return false;
        }
        return false;
    }


    public loadAudio(path: string, playAfterLoaded: boolean, isMusic: boolean, loop, volume) {
        let load_count = 0;
        /** 加载失败时，重复加载 直到次数为 3 */
        let index = this.loadingAudioArr.indexOf(path);
        if (index > -1) return;
        this.loadingAudioArr.push(path);
        let load = () => {
            load_count += 1;
            cc.resources.load(path, cc.AudioClip, (err, res: cc.AudioClip) => {
                if (err) {
                    console.log(`音频${path}加载错误重复加载次数 >>`, load_count);
                    if (load_count <= 3) {
                        load();
                    }
                } else {
                    let name = res.name
                    let res_url = res.nativeUrl;
                    this.audio_clip_map[name] = res;
                    if (cc.assetManager.md5Pipe) {
                        res_url = cc.assetManager.md5Pipe.transformURL(res_url);
                    }
                    this.audio_path_map[name] = res_url;//'resources/' + str + '.' + typeName;             
                    if (playAfterLoaded) {
                        if (isMusic) {
                            this.playMusic(name, volume);
                        } else {
                            this.playEffect(name, loop, volume)
                        }
                    }
                }
            });
        }
        load();
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
     * @param {boolean} [stopGradually=false] 逐渐停止
     */
    public stopMusic(stopGradually = false, internalMS = 100) {
        if (stopGradually) {
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
        if (this.canPlayEffect) {
            if (this.audio_clip_map[filePath]) {
                return cc.audioEngine.play(this.audio_clip_map[filePath], loop, volume);
            }
            else {
                if (!!!this.audioPath) {
                    cc.warn('audioPath is null');
                } else {
                    this.loadAudio(this.audioPath + filePath, true, false, loop, volume);
                }
            }
            return 0;
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

