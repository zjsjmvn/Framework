// export default class BaiDuAds implements IAdvertiser {
//     _chartboostInit() {
//         sdkbox.PluginChartboost.init();
//         //sdkbox.PluginChartboost.setAutoCacheAds(true);
//         var self = this;
//         sdkbox.PluginChartboost.setListener({
//             //缓存成功
//             onChartboostCached: function (name) {
//                 cc.log("onChartboostCached " + name);
//             },
//             //可以展示?
//             onChartboostShouldDisplay: function (name) {
//                 cc.log("onChartboostShouldDisplay " + name);
//             },
//             onChartboostDisplay: function (name) {
//                 cc.log("onChartboostDisplay " + name);
//             },
//             onChartboostDismiss: function (name) {
//                 cc.log("onChartboostDismiss " + name);
//             },
//             onChartboostClose: function (name) {
//                 cc.log("onChartboostClose " + name);
//                 self._interstitialEnd(false);
//             },
//             onChartboostClick: function (name) {
//                 cc.log("onChartboostClick " + name);
//             },
//             onChartboostReward: function (name, reward) {
//                 cc.log("onChartboostReward " + name + " reward " + reward.toString());
//                 self._reward(true);
//             },
//             onChartboostFailedToLoad: function (name, e) {
//                 cc.log("onChartboostFailedToLoad " + name + " load error " + e.toString());
//             },
//             onChartboostFailToRecordClick: function (name, e) {
//                 cc.log("onChartboostFailToRecordClick " + name + " click error " + e.toString());
//             },
//             onChartboostConfirmation: function () {
//                 cc.log("onChartboostConfirmation");
//             },
//             onChartboostCompleteStore: function () {
//                 cc.log("onChartboostCompleteStore");
//             }
//         });


//     }
//     showChartboostInterstitial() {
//         if (sdkbox.PluginChartboost && sdkbox.PluginChartboost.isAvailable("interstitial")) {
//             sdkbox.PluginChartboost.show("interstitial");
//         }
//     }
//     showChartboostRewardVideo() {
//         if (sdkbox.PluginChartboost && sdkbox.PluginChartboost.isAvailable("rewardedVideo")) {
//             sdkbox.PluginChartboost.show("rewardedVideo");
//         }
//     }
// }