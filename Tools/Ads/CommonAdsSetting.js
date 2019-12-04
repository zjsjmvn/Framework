let AdsManager = require("./AdsManager");




//广告播放的快速设置
cc.Class({
    extends: cc.Component,
    editor: {
        menu: 'ads/CommonAdsSetting',
    },
    properties: {
        //该页面显示横幅
        show_ad_bottom: {
            default: false,
            displayName: '该页面显示横幅'
        },
        //刚start显示插屏
        show_ad_interstitial: {
            default: false,
            displayName: '该页面显示插页'
        },

        //自动隐藏banner
        disableCloseBanner: {
            default: false,
            displayName: '自动隐藏banner'
        },
    },
    onLoad() {

    },
    onEnable() {
        var no_ad = AdsManager.getInstance().isNoAds();

        if (this.show_ad_bottom && !no_ad) {
            AdsManager.getInstance().showBanner();
        } else {

            AdsManager.getInstance().hideBanner();
        }

        if (this.show_ad_interstitial && !no_ad) {
            this.showInterstitial();
        }
    },

    onDisable() {
        if (this.disableCloseBanner)
            AdsManager.getInstance().hideBanner();
    },
    //显示横幅
    showBanner() {
        var no_ad = AdsManager.getInstance().isNoAds();;

        if (!no_ad) {
            AdsManager.getInstance().showBanner();
        }
    },
    //显示插屏
    showInterstitial(call_fun) {
        return AdsManager.getInstance().showInterstitial(call_fun);
    },
});