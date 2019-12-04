var UserDefualt_MusicEffect = "MusicEffect";
var UserDefualt_BackMusic = "BackMusic";
if (window.wx == undefined && window.tt != undefined) {
    window.wx = window.tt;
}

const isUseWx = !window.qq && (window.wx || window.tt) && !window.swan;

export class AudioManager {
    def_path1: string = "resources/"
    def_path2: string = "sound/"
    music_path: string = 'background'
    lastPlayedMusicPath: string = ''
    playing_music = false;
    playing_music_name = undefined;
    maxVolume = 1;
    file_path_map = new Map();
    audio_clip_map = {};
    ////带后缀地址
    audio_path_map = {};
    //时间播放间隔限制 秒
    playIntervalLimitSec = 0.03;
    _playIntervalTally = 0;
    effectIntervalMap = new Map();
    wxAudioMap: any = null;
    loading: boolean = false;
    constructor() {
        if (CC_EDITOR) return;
        //用以加载完成时自动播放
        this.playing_music = false;
        this.playing_music_name = undefined;
        this.maxVolume = 1;
        this.file_path_map = new Map;
        this.audio_clip_map = {};
        ////带后缀地址
        this.audio_path_map = {};
        //时间播放间隔限制 秒
        this.playIntervalLimitSec = 0.03;
        this._playIntervalTally = 1;
        this.effectIntervalMap = new Map();
        //
        let self = this;

        setInterval(this._addPlayIntervalTime.bind(this), 0.02 * 1000);



        //wx音效管理与释放
        if (isUseWx) {
            this.wxAudioMap = {
                music: null,
                effect: {},
            };

            this.wxAudioMap.effect.AudioClip = [];
            setInterval(function () {
                self.updateWxAudio();
            }, 2000);

            let createAudioFn = wx.createInnerAudioContext;

            let self = this;
            wx.createInnerAudioContext = (filePath) => {

                //    num++;
                //cc.log('add',filePath,num);
                let audio = createAudioFn();

                if (filePath == undefined) {
                    self.wxAudioMap.effect.AudioClip.push(audio);
                }

                return audio;
            }

            //处理进入后台背景音乐重新播放               
            wx.onShow(function (query) {
                if (this.isPlayMusic() &&
                    this.wxAudioMap.music &&
                    this.wxAudioMap.music.paused) {
                    this.wxAudioMap.music.play();
                }
            }.bind(this));
        }

    }
    /**
     * 
     */
    private _addPlayIntervalTime() {
        this._playIntervalTally += 0.02;
    }
    /**
     * 设置音效播放间隔限制
     * @param time
     */
    setPlayIntervalLimitSec(time) {
        this.playIntervalLimitSec = time;
    }
    /**
     * 添加音效做时间间隔限制
     * @param nameOrArr
     */
    pushAudioIntervalLimit(nameOrArr) {
        if (Array.isArray(nameOrArr)) {
            for (let i = 0; i < nameOrArr.length; i++) {
                const item = nameOrArr[i];
                this.effectIntervalMap.set(item, 0);
            }
        }
        else {
            this.effectIntervalMap.set(nameOrArr, 0);
        }
    }
    /**
     * 取消音效做时间间隔限制
     * @param nameOrArr
     */
    popAudioIntervalLimit(nameOrArr) {
        if (Array.isArray(nameOrArr)) {
            for (let i = 0; i < nameOrArr.length; i++) {
                const item = nameOrArr[i];
                this.effectIntervalMap.delete(item);
            }
        }
        else {
            this.effectIntervalMap.delete(nameOrArr);
        }
    }

    /**
     * 更新释放微信 头条音效处理
     *
     */
    updateWxAudio() {
        for (let key in this.wxAudioMap.effect) {
            let arr = this.wxAudioMap.effect[key];
            if (arr.length == 0) continue;
            let cutCount = Math.min(Math.max(Math.floor(arr.length / 2), 3), arr.length);
            for (let i = 0; i < cutCount; i++) {
                if (arr[i].paused) {
                    arr[i].destroy();
                }
                else {
                    cutCount = 0;
                    arr.splice(0, i);

                    break;
                }
            }

            if (cutCount != 0) {
                arr.splice(0, cutCount);
            }
        }
    }
    /**
     * 创建微信音效
     *
     * @param {*} src
     * @param {boolean} [loop=false]
     * @param {number} [volume=1]
     * @returns
     */
    _getWxAudio(src, loop = false, volume = 1, filePath = '') {
        let wxAudio = wx.createInnerAudioContext(filePath);
        wxAudio.src = src;
        wxAudio.loop = loop;
        wxAudio.volume = volume;
        wxAudio.autoplay = true;
        //        cc.log(JSON.stringify(wxAudio));

        return wxAudio;
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
                    let fileSysMgr = null;
                    if (window.wx && window.wx.getFileSystemManager) {
                        fileSysMgr = wx.getFileSystemManager();
                    }

                    str_arr.forEach((str, index) => {
                        let arr = str.split('/');
                        let name = arr[arr.length - 1];
                        let res_url = res_arr[index].nativeUrl;

                        self.audio_clip_map[name] = res_arr[index];
                        self.audio_clip_map[name + '.mp3'] = res_arr[index];
                        //带后缀地址
                        if (cc.loader.md5Pipe) {
                            res_url = cc.loader.md5Pipe.transformURL(res_url);
                        }

                        // md5 下载后 路径改变
                        if (fileSysMgr) {
                            //  if(!fileSysMgr.accessSync(res_url)){
                            //     res_url = wx.env.USER_DATA_PATH + '/' + res_url;
                            //  }
                        }

                        self.audio_path_map[name] = res_url;//'resources/' + str + '.' + typeName;                        
                    });

                    if (isUseWx) {
                        //cc.audioEngine.uncacheAll();
                        for (let i in res_arr) {
                            res_arr[i].destroy();
                        }
                    }

                    if (self.playing_music) {
                        self.playMusic(self.playing_music_name);
                        // 激活音效
                    }
                }
            });

        }

    }
    //切换
    switchoverAudio() {
        this.switchoverAudioMusic();
        this.switchoverAudioEffect();
    }
    switchoverAudioMusic() {
        this.setPlayMusic(!this.isPlayMusic());
    }
    switchoverAudioEffect() {
        this.setPlayEffects(!this.isPlayEffects());
    }
    isPlayMusic() {
        return true;
        if (window.canPlayMusic === undefined)
            window.canPlayMusic = LocalDataManager.readBool(UserDefualt_BackMusic, true);
        return window.canPlayMusic;
    }
    isPlayEffects() {
        return true;
        // if (window.canPlayEffects === undefined)
        //     window.canPlayEffects = LocalDataManager.readBool(UserDefualt_MusicEffect, true);
        // return window.canPlayEffects;
    }

    /**
    * Set whether to play background music.
    *
    * @param bPlayMusic false is not play.
    */
    setPlayMusic(bPlayMusic) {
        if (this.isPlayMusic() != bPlayMusic) {
            LocalDataManager.write(UserDefualt_BackMusic, bPlayMusic);
            window.canPlayMusic = bPlayMusic;
            this.playMusic();
        }
    }


    setPlayEffects(bPlayEffects) {
        if (this.isPlayEffects() != bPlayEffects) {
            LocalDataManager.write(UserDefualt_MusicEffect, bPlayEffects);
            window.canPlayEffects = bPlayEffects;
            if (!bPlayEffects) {
                //this.stopAllEffects();
            }
        }
    }


    preloadMusic(filePath, callback = null) {
        cc.audioEngine.preload(filePath, callback);
    }

    playMusic(filePath, volume = 1) {
        if (this.isPlayMusic()) {
            if (filePath == this.lastPlayedMusicPath && cc.audioEngine.isMusicPlaying()) {
                return true;
            }
            //默认播放上次的设置
            filePath = filePath || this.lastPlayedMusicPath;
            if (filePath.length == 0) {
                filePath = this.music_path;
            }
            this.lastPlayedMusicPath = filePath;
            //this.stopMusic();
            this.playing_music = true;
            this.playing_music_name = filePath;
            return this._playMusicAudio(filePath, true, volume);
        }
        else {
            if (filePath && filePath.length != 0) {
                this.lastPlayedMusicPath = filePath;
            }
            this.stopMusic();
        }
        return false;
    }
    _playMusicAudio(filePath, loop = false, volume = 1) {

        if (this.audio_clip_map[filePath]) {
            this._setMusicVolume(volume);
            if (isUseWx) {
                let path = this.audio_path_map[filePath];
                if (this.wxAudioMap.music && this.wxAudioMap.music.src != path) {
                    this.wxAudioMap.music.destroy();
                    this.wxAudioMap.music = null;
                }
                if (this.wxAudioMap.music == null) {
                    //cc.log('Audio Play 4',filePath);
                    this.wxAudioMap.music = this._getWxAudio(path, loop, volume, filePath);
                }
                else {
                    this.wxAudioMap.music.volume = volume;
                }
            }
            else {
                cc.audioEngine.playMusic(this.audio_clip_map[filePath], loop);
            }
            return true;
        }
        else {
            cc.error("没有找到music", filePath);
            // this.preloadAudio();
        }

        return false;
    }
    setMusicMaxVolme(max) {
        this.maxVolume = max;
    }
    /**
     *  切换背景音乐大小
     * 
     * @param {boolean} [is_gradually=false] 逐渐停止
     */
    setMusicVolum(volume, is_gradually = false, internalMS = 100) {
        this.setMusicVolume(volume, is_gradually, internalMS);
    }
    setMusicVolume(volume, is_gradually = false, internalMS = 100) {
        volume = Math.min(volume, this.maxVolume);
        if (volume > 0 && !cc.audioEngine.isMusicPlaying()) {
            this.playMusic(this.lastPlayedMusicPath);
        }

        let self = this;
        if (is_gradually) {
            if (self.volumeChangeCall) {
                clearInterval(self.volumeChangeCall);
                self.volumeChangeCall = null;
            }

            self.volumeChangeCall = setInterval(function () {
                const changeSpeed = 0.1;
                let currentVolume = self._getMusicVolume();
                let changeVolume = Math.abs(currentVolume - volume);
                if (changeVolume < changeSpeed) {
                    self._setMusicVolume(volume);
                    if (self.volumeChangeCall) {
                        clearInterval(self.volumeChangeCall);
                        self.volumeChangeCall = null;
                    }
                }
                else {
                    cc.audioEngine.isMusicPlaying()
                    self._setMusicVolume(currentVolume + (currentVolume > volume ? - changeSpeed : changeSpeed));
                }
            }, internalMS);

        }
        else {
            cc.audioEngine.isMusicPlaying()
            self._setMusicVolume(volume);
        }
    }
    _setMusicVolume(volume) {
        if (isUseWx) {
            if (this.wxAudioMap.music) {
                this.wxAudioMap.music.volume = volume;
            }
        }
        else {
            cc.audioEngine.setMusicVolume(volume);
        }
    }
    _getMusicVolume() {
        if (isUseWx) {
            if (this.wxAudioMap.music) {
                return this.wxAudioMap.music.volume;
            }
            else {
                return 0;
            }
        }
        else {
            return cc.audioEngine.getMusicVolume();
        }

        return 0;
    }
    /**
     * Stop playing background music.
     *
     * @param {boolean} [is_gradually=false] 逐渐停止
     */
    stopMusic(is_gradually = false, internalMS = 100) {

        this.playing_music = false;
        let self = this;
        if (is_gradually) {
            var clear_func = function (interval) {
                clearInterval(interval);
            }

            var test = setInterval(function () {
                if (self._getMusicVolume() > 0.1) {
                    self._setMusicVolume(self._getMusicVolume() - 0.1);
                }
                else {
                    if (isUseWx) {
                        if (self.wxAudioMap.music) {
                            self.wxAudioMap.music.destroy();
                            self.wxAudioMap.music = null;
                        }
                    }
                    else {
                        cc.audioEngine.stopMusic();
                    }
                    clear_func(test);
                }
            }, internalMS);

        }
        else {
            if (isUseWx) {
                if (this.wxAudioMap.music) {
                    this.wxAudioMap.music.destroy();
                    self.wxAudioMap.music = null;
                }
            }
            else {
                cc.audioEngine.stopMusic();
            }
        }
    }
    /**
    * Pause playing background music.
    */
    pauseMusic() {
        if (isUseWx) {
            if (this.wxAudioMap.music) {
                this.wxAudioMap.music.pause();
            }

        } else {
            cc.audioEngine.pauseMusic();
        }
        this.playing_music = false;
    }
    /**
    * Resume playing background music.
    */
    resumeMusic() {
        if (isUseWx) {
            if (this.wxAudioMap.music) {
                this.wxAudioMap.music.play();
            }

        } else {
            cc.audioEngine.resumeMusic();
        }
        this.playing_music = true;
    }

    /**
    * Play sound effect with a file path, pitch, pan and gain.
    *
    * @param filePath The path of the effect file.
    * @param loop Determines whether to loop the effect playing or not. The default value is false.
    * @param volume Volume value (range from 0.0 to 1.0).
    * @return An audio ID. It allows you to dynamically change the behavior of an audio instance on the fly.
    *
    * @see `AudioProfile`
    */
    play(filePath, loop = false, volume = 1) {
        return this.playEffect(filePath, loop, volume);
    }
    playEffect(filePath, loop = false, volume = 1) {

        if (this.isPlayEffects()) {
            return this._playAudio(filePath, loop, volume);

        }

        return 0;
    }
    _playAudio(filePath, loop = false, volume = 1) {
        //时间间隔处理


        // return cc.audioEngine.play(this.audio_clip_map[filePath], loop, volume);

        let inetvalVal = this.effectIntervalMap.get(filePath);
        if (inetvalVal !== undefined) {
            if (inetvalVal <= this._playIntervalTally) {
                this.effectIntervalMap.set(filePath, this._playIntervalTally + this.playIntervalLimitSec);
            }
            else {
                return 0;
            }
        }


        if (this.audio_clip_map[filePath]) {

            if (isUseWx) {
                let path = this.audio_path_map[filePath];
                this.wxAudioMap.effect[filePath] = this.wxAudioMap.effect[filePath] || [];
                let effectPool = this.wxAudioMap.effect[filePath];
                //第一个闲置了 或者 总数量大于20
                if (effectPool.length > 0 && (effectPool[0].paused || effectPool.length > 20)) {

                    let audio = effectPool[0];
                    effectPool.splice(0, 1);
                    effectPool.push(audio);

                    audio.volume = volume;
                    //cc.log('Audio Play 1',filePath);
                    if (!audio.paused) {
                        audio.seek(0);
                    }
                    else {
                        audio.play();
                    }

                    return audio;
                }
                else {
                    //  cc.log('Audio Play 2',filePath);
                    let audio = this._getWxAudio(path, loop, volume, filePath);
                    effectPool.push(audio);
                    return audio;
                }
            }
            else {
                return cc.audioEngine.play(this.audio_clip_map[filePath], loop, volume);
            }

        }
        else {
            cc.error("没有正确加载到音效", filePath);
            // this.preloadAudio
        }

        return 0;
    }
    /**
     * 停止音效 只处理wx的
     */
    stopAudio(path, audio) {
        if (isUseWx && path != undefined && audio != undefined) {
            let arr = this.wxAudioMap.effect[path];
            if (arr) {
                arr.some((key, index) => {
                    if (key == audio) {
                        audio.destroy();
                        arr.splice(index, 1);
                        return;
                    }
                })
            }
        }
    }
    /**
    * Pause all playing sound effect.
    */
    pauseAllEffects() {
        if (isUseWx) {
            if (this.wxAudioMap.effect) {
                for (let key in this.wxAudioMap.effect) {
                    let arr = this.wxAudioMap.effect[key];
                    for (let i in arr) {
                        arr[i].destroy();
                    }

                    this.wxAudioMap.effect[key] = [];
                }
            }
        } else {
            cc.audioEngine.pauseAll();
        }

    }

    /**
    * Resume all playing sound effect.
    */
    resumeAllEffects() {
        cc.audioEngine.resumeAll();
    }

    /**
    * Stop all playing sound effects.
    */
    stopAllEffects() {
        if (isUseWx) {
            if (this.wxAudioMap.music) {
                this.wxAudioMap.music.destroy();
            }

            if (this.wxAudioMap.effect) {
                for (let key in this.wxAudioMap.effect) {
                    let arr = this.wxAudioMap.effect[key];
                    for (let i in arr) {
                        arr[i].destroy();
                    }

                    this.wxAudioMap.effect[key] = [];
                }
            }
        } else {
            cc.audioEngine.stopAllEffects();
        }
    }

    /**
    * Preload a compressed audio file.
    *
    * The compressed audio will be decoded to wave, then written into an internal buffer in SimpleAudioEngine.
    *
    * @param filePath The path of the effect file.
    * @js NA
    */
    preloadEffect(filePath, callback) {
        cc.audioEngine.preload(filePath, callback);
    }


}

window.AudioManager = new AudioManager();