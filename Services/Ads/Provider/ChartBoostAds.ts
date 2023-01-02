// export default class ChartBoostAds implements IAdvertiser {
//     _chartboostInit() {
//         sdkbox.PluginChartboost.init();
//         //sdkbox.PluginChartboost.setAutoCacheAds(true);
//         var self = this;
//         sdkbox.PluginChartboost.setListener({
//             //缓存成功
//             onChartboostCached: function (name) {
//                 log("onChartboostCached " + name);
//             },
//             //可以展示?
//             onChartboostShouldDisplay: function (name) {
//                 log("onChartboostShouldDisplay " + name);
//             },
//             onChartboostDisplay: function (name) {
//                 log("onChartboostDisplay " + name);
//             },
//             onChartboostDismiss: function (name) {
//                 log("onChartboostDismiss " + name);
//             },
//             onChartboostClose: function (name) {
//                 log("onChartboostClose " + name);
//                 self._interstitialEnd(false);
//             },
//             onChartboostClick: function (name) {
//                 log("onChartboostClick " + name);
//             },
//             onChartboostReward: function (name, reward) {
//                 log("onChartboostReward " + name + " reward " + reward.toString());
//                 self._reward(true);
//             },
//             onChartboostFailedToLoad: function (name, e) {
//                 log("onChartboostFailedToLoad " + name + " load error " + e.toString());
//             },
//             onChartboostFailToRecordClick: function (name, e) {
//                 log("onChartboostFailToRecordClick " + name + " click error " + e.toString());
//             },
//             onChartboostConfirmation: function () {
//                 log("onChartboostConfirmation");
//             },
//             onChartboostCompleteStore: function () {
//                 log("onChartboostCompleteStore");
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