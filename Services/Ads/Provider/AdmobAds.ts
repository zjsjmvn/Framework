// export default class AdmobAds implements IAdvertiser {


//     init() {

//     }

//     _admobInit() {
//         log('_admobInit');
//         let self = this;
//         sdkbox.PluginAdMob.setListener({
//             //缓存成功
//             adViewDidReceiveAd(name) {
//                 log('admob adViewDidReceiveAd name=' + name);
//                 if (name == "banner") {

//                     if (!this.isNoAds()) {
//                         //banner 展示的时候，如果有启动（开屏）广告，那就等待启动广告关闭在展示，如果没有，那么就直接展示。
//                         var interstitial_node = director.getScene().getChildByName('Interstitial');
//                         if (interstitial_node) {
//                             interstitial_node.getComponent("Interstitial").registCloseCallback(function () {
//                                 //self.showBanner();
//                             });
//                         } else {
//                             self.showBanner(false);
//                         }
//                     }
//                 }
//             },
//             //缓存失败
//             adViewDidFailToReceiveAdWithError(name, msg) {
//                 log('admob adViewDidFailToReceiveAdWithError name=' + name + ' msg=' + msg);
//                 if (name == "banner") {
//                     //self.showQYBanner();
//                 }
//                 else if (name == "rewardedVideo") {

//                 }
//             },
//             //将要显示
//             adViewWillPresentScreen(name) {//
//                 log('admob adViewWillPresentScreen name=' + name);
//             },
//             //关闭后
//             adViewDidDismissScreen(name) {
//                 log('admob adViewDidDismissScreen name=' + name);
//                 if (name == 'interstitial') {
//                     self._interstitialEnd(true);
//                 }
//                 else if (name == 'rewardedVideo') {

//                     self._reward(false);
//                 }

//             },
//             //将要关闭
//             adViewWillDismissScreen(name) {
//                 log('admob adViewWillDismissScreen=' + name);
//                 if (name == 'interstitial') {
//                     self._interstitialEnd(true);
//                 }
//             },
//             //离开app
//             adViewWillLeaveApplication(name) {
//                 log('admob adViewWillLeaveApplication=' + name);
//             },
//             //获得奖励
//             reward(name, currency, amount) {
//                 log('admob reward=' + name, currency, amount);
//                 self.successReward = true;
//                 //self._reward(true);
//             }

//         });
//         sdkbox.PluginAdMob.init();

//     }
//     showAdmobInterstitial() {

//         if (this.enable_admob_interstitial == false) return;
//         if (sdkbox.PluginAdMob && sdkbox.PluginAdMob.isAvailable("interstitial")) {
//             sdkbox.PluginAdMob.show('interstitial');
//             setTimeout(() => {
//                 log('adcache admob interstitial');
//                 sdkbox.PluginAdMob.cache("interstitial");
//             }, 10000);
//         }
//     }
//     showAdmobRewardVideo() {
//         if (this.enable_admob_rewardVideo == false) return;
//         if (sdkbox.PluginAdMob && sdkbox.PluginAdMob.isAvailable("rewardedVideo")) {
//             sdkbox.PluginAdMob.show('rewardedVideo');
//             //应该是在播放的时候无法加载。所以要延时加载
//             setTimeout(() => {
//                 log('adcache admob rewardedVideo3');
//                 sdkbox.PluginAdMob.cache("rewardedVideo");
//             }, 10000);
//         }
//     }

// }