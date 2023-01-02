// export default class UnityAds implements IAdvertiser {
//     _unityAdsInit() {
//         var self = this;
//         sdkbox.PluginUnityAds.setListener({
//             unityAdsDidClick: function (placementId) {
//                 log('unityAdsDidClick ' + placementId);
//             },
//             unityAdsPlacementStateChanged: function (placementId, oldState, newState) {
//                 log('unityAdsPlacementStateChanged:' + placementId + ' oldState:' + oldState + " newState:" + newState);
//             },
//             unityAdsReady: function (placementId) {
//                 log('unityAdsReady ' + placementId);
//             },
//             unityAdsDidError: function (error, message) {
//                 log('unityAdsDidError:' + error + ' message:' + message);
//                 if (name == 'interstitial') {

//                 }
//                 self._interstitialEnd(false);
//                 self._reward(false);

//             },
//             unityAdsDidStart: function (placementId) {
//                 log('unityAdsDidStart=' + placementId);
//             },
//             unityAdsDidFinish: function (placementId, state) {
//                 log('unityAdsDidFinish ' + placementId + ' state:' + state);
//                 //csdkbox.PluginUnityAds.SBUnityAdsFinishState.kUnityAdsFinishStateCompleted = 2
//                 if (state === sdkbox.PluginUnityAds.SBUnityAdsFinishState.kUnityAdsFinishStateCompleted && placementId === "rewardedVideo") {
//                     self._reward(true);
//                 }
//                 else if ((placementId == 'interstitial' || placementId == 'video')) {
//                     self._interstitialEnd(true);
//                 }
//             }
//         });
//         sdkbox.PluginUnityAds.init();


//     }
//     showUnityInterstitial() {
//         sdkbox.PluginUnityAds.show("video");
//         if (sdkbox.PluginUnityAds && sdkbox.PluginUnityAds.isReady("interstitial")) {
//             sdkbox.PluginUnityAds.show("interstitial");
//         }
//     }
//     showUnityRewardVideo() {
//         if (sdkbox.PluginUnityAds && sdkbox.PluginUnityAds.isReady("rewardedVideo")) {
//             sdkbox.PluginUnityAds.show("rewardedVideo");
//         }
//     }

// }