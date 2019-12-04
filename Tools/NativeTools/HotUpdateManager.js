var HotUpdate_Finished = '3';
//热更新管理器
//添加定时器，当超时没回调时。直接切换界面。有回调时不切换界面
cc.Class({
    extends: cc.Component,
    properties: {
        manifestUrl: {
            default: null,
            type: cc.Asset,
        },
        fileProgress: cc.ProgressBar,
        fileLabel: cc.Label,
        byteProgress: cc.ProgressBar,
        byteLabel: cc.Label,
        _updating: false,
        _canRetry: false,
        _storagePath: '',
    },
    ctor() {
        let GameDefine = require("../../@types/GameDefine")
        HotUpdate_Finished = GameDefine.Notification.HotUpdate_Finished;
    },
    onLoad: function () {
        if (!cc.sys.isNative) {
            let event = new cc.Event.EventCustom(HotUpdate_Finished, true);
            cc.director.dispatchEvent(event);
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'colorjump-remote-asset');
        cc.log('Storage path for remote asset : ' + this._storagePath);

        this.versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            } else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle);
        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            let compressed = asset.compressed;
            // Retrieve the correct md5 value.
            let expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            let relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            let size = asset.size;
            if (compressed) {
                return true;
            } else {
                return true;
            }
        });

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }
        if (this.fileProgress)
            this.fileProgress.progress = 0;
        if (this.byteProgress)
            this.byteProgress.progress = 0;


    },
    start: function () {
        this.checkUpdate();
        //开启一个超时定时器。
        this.scheduleOnce(function () {
            let event = new cc.Event.EventCustom(HotUpdate_Finished, true);
            cc.director.dispatchEvent(event);
        }, 2);
    },
    checkCb: function (event) {
        cc.log('Code: ' + event.getEventCode());
        //取消定时器
        this.unscheduleAllCallbacks();
        this._updating = false;
        var self = this;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log("Fail to download manifest file, hot update skipped.");
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log("Already up to date with the latest remote version.");
                if (this.fileProgress)
                    self.fileProgress.progress = 1;
                if (this.byteProgress)
                    self.byteProgress.progress = 1;
                let eve = new cc.Event.EventCustom(HotUpdate_Finished, true);
                cc.director.dispatchEvent(eve);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                cc.log('New version found, please try to update.');
                if (this.fileProgress)
                    self.fileProgress.progress = 0;
                if (this.byteProgress)
                    self.byteProgress.progress = 0;
                self.hotUpdate();
                break;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
    },

    updateCb: function (event) {


        let needRestart = false;
        let failed = false;
        cc.log("updateCb");
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log('No local manifest file found, hot update skipped.');
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:

                // let ByFile = event.getPercentByFile();
                // let Percent = event.getPercent()
                // if (!isNaN(ByFile)) {
                //     //百分比
                //     let per = Math.ceil(ByFile * 100)
                //     this.load_progress.progress = ByFile;
                //     // this.load_label.string = "正在加载资源（"+ (per) +"%）";
                //     this.load_label.string ='正在更新：'+ (event.getDownloadedBytes() / 1024 / 1024).toFixed(2) + 'MB / ' + (event.getTotalBytes() / 1024 / 1024).toFixed(2) + "MB"
                // }
                // if (!isNaN(Percent)) {
                //     this.load_progress.progress = Percent
                // //  this.loading_lab1.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                // }

                if (this.byteProgress)
                    this.byteProgress.progress = event.getPercent();
                if (this.fileProgress)
                    this.fileProgress.progress = event.getPercentByFile();

                if (this.fileLabel)
                    this.fileLabel.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                if (this.byteLabel)
                    this.byteLabel.string = event.getDownloadedBytes() + ' / ' + event.getTotalBytes();
                let msg = event.getMessage();
                if (msg) {
                    cc.log('Updated file: ' + msg);
                    cc.log(event.getPercent() / 100 + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log('Fail to download manifest file, hot update skipped.');
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log('Already up to date with the latest remote version.');
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                cc.log('Update finished. ' + event.getMessage());
                //如果更新完需要重启，则true，否则false
                needRestart = true;
                // let eve = new cc.Event.EventCustom(HotUpdate_Finished, true);
                // cc.director.dispatchEvent(eve);


                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                cc.log('Update failed. ' + event.getMessage());
                this._updating = false;
                this._canRetry = true;
                this.failed = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                cc.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                cc.log('ERROR_DECOMPRESS' + event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            cc.log("failed");
            let eve = new cc.Event.EventCustom(HotUpdate_Finished, true);
            cc.director.dispatchEvent(eve);
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            cc.log("needRestart");

            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            // Prepend the manifest's search path
            let searchPaths = jsb.fileUtils.getSearchPaths();
            let newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log(JSON.stringify(newPaths));
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    },

    loadCustomManifest: function () {
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            let manifest = new jsb.Manifest(customManifestStr, this._storagePath);
            this._am.loadLocalManifest(manifest, this._storagePath);
        }
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            cc.log('Retry failed Assets...');
            this._am.downloadFailedAssets();
        }
    },

    checkUpdate: function () {
        if (!cc.sys.isNative) {
            return;
        }

        if (this._updating) {
            cc.log('Checking or updating ...');
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(this.manifestUrl.nativeUrl);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            cc.log('Failed to load local manifest ...');
            return;
        }
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        this._am.checkUpdate();
        this._updating = true;
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this.manifestUrl.nativeUrl);
            }


            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    },

    show: function () {
        if (this.updateUI.active === false) {
            this.updateUI.active = true;
        }
    },


    onDestroy: function () {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    }
});