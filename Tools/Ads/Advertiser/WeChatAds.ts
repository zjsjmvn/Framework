export default class WeChatAds implements IAdvertiser {
    /**销毁微信横幅 */
    destroyWXBanner() {
        if (this.wxBannerAd) {
            this.wxBannerAd.destroy();
            this.wxBannerAd = null;
        }
    }

}