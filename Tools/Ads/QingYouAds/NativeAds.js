// var Base64 = require("../Base64Tools")
// //原生广告显示
// let AdsManager = require('../AdsManager');
// var NativeAds = cc.Class({
//     extends: cc.Component,

//     editor: {
//         menu: 'ads/NativeAds'
//     },
//     statics: {
//         request_id: null,
//         image_url: null,
//         request_ip: null,
//         request_time: null,
//     },
//     properties: {
//         delayShowTime: 0.3,
//     },

//     onEnable() {
//         AdsManager.getInstance();
//         this.scheduleOnce(this.showNativeAd, this.delayShowTime);
//     },
//     onDisable() {
//         this.removeNativeAds();
//     },
//     _isValid() {
//         return cc.sys.isMobile &&
//             cc.sys.isNative &&
//             window.sdkbox != undefined &&
//             sdkbox.PluginSdkboxPlay != undefined;
//     },
//     showNativeAd() {
//         if (!(this._isValid() && window.qy != undefined && qy.PluginAdMobNativeAds)) {
//             return false;
//         }

//         let worldBox = this.node.getBoundingBoxToWorld();
//         let center = {
//             x: worldBox.x + worldBox.width / 2,
//             y: worldBox.y + worldBox.height / 2
//         };
//         let ratio = this.getCanvasScaleRatio();
//         //cc.log('Native Size',JSON.stringify(worldBox),JSON.stringify(center), ratio);

//         worldBox.width *= ratio;
//         worldBox.height *= ratio;
//         worldBox.x = center.x;
//         worldBox.y = center.y;

//         let visibleSize = cc.view.getVisibleSize();
//         let frameSize = cc.view.getFrameSize();

//         worldBox.x -= visibleSize.width / 2;
//         worldBox.y -= visibleSize.height / 2;

//         //更具frameSize和visiblesize缩放位置
//         worldBox.x *= frameSize.width / visibleSize.width;
//         worldBox.y *= frameSize.width / visibleSize.width;

//         //起点在屏幕中心
//         // cc.log('Native Size',JSON.stringify(worldBox),JSON.stringify(visibleSize), ratio);
//         // cc.log('Native Size',JSON.stringify(cc.view.getFrameSize()));
//         //qy.PluginAdMobNativeAds是由c++层封装的。
//         if (AdsManager.getInstance().canShowAdmobNativeAd()) {
//             if (qy.PluginAdMobNativeAds.isNaitiveAdsAvailable()) {
//                 qy.PluginAdMobNativeAds.showNativeAds(worldBox.x, worldBox.y, worldBox.width, worldBox.height);
//                 //qy.PluginAdMobNativeAds.showNativeAds(0, 0, 750, 1334);
//                 return true;
//             } else {
//                 qy.PluginAdMobNativeAds.requestNativeAds();
//                 //this.scheduleOnce(this.showNativeAd, 3);
//             }
//         }

//         if (AdsManager.getInstance().canShowQyNativeAd()) {
//             this.showQYNative();
//             return true;
//         }

//         //显示默认广告

//     },
//     removeNativeAds() {
//         if (!(this._isValid() && window.qy != undefined && qy.PluginAdMobNativeAds)) {
//             return false;
//         }

//         qy.PluginAdMobNativeAds.removeNativeAds();
//     },
//     getCanvasScaleRatio() {
//         if (cc.Canvas.instance.fitWidth) {
//             return cc.view.getFrameSize().width / 750;
//         }

//         return cc.view.getFrameSize().height / 1334;
//     },
//     onDestroy() {
//         this.node.off(cc.Node.EventType.TOUCH_END, this.btnQYNativeClick, this);
//         this.node.off(cc.Node.EventType.TOUCH_END, this.btnDefualtNativeClick, this);
//     },

//     //QY广告
//     showDefaultNative() {
//         this.node.on(cc.Node.EventType.TOUCH_END, this.btnDefualtNativeClick, this);

//     },
//     showQYNative() {
//         this.node.on(cc.Node.EventType.TOUCH_END, this.btnQYNativeClick, this);

//         if (!NativeAds.image_url) {
//             this.qyRequestNativeAd();
//         } else {
//             this._showQyNative();
//         }
//     },

//     qyRequestNativeAd() {
//         if (!this._isValid()) return;

//         var native_size = this.node.getContentSize();
//         var width = Math.floor(native_size.width);
//         var height = Math.floor(native_size.height);

//         cc.log("_qyRequestNativeAd" + width + " " + height);

//         var platform = require("../AdsManager").getInstance().getPlatformString();
//         var sid = nativead_sid;
//         var url = cc.js.formatStr(qy_native_request_url, width, height, platform, sid);

//         let self = this;
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function () {
//             if (request.readyState == 4 && (request.status >= 200 && request.status < 400)) {
//                 try {
//                     var json = request.responseText;
//                     cc.log("_qyRequestNative: " + json);
//                     var response = JSON.parse(request.responseText);
//                     if (response.IsSuccess == false) {
//                         return;
//                     }
//                     cc.log('response.Data', response.Data);
//                     //服务端返回的数据只有Data里是需要的
//                     var decode_data = Base64.decode(response.Data, base64_decode_key);
//                     //返回的是AppBannerRequestId|ImageFileUrl|AppBannerRequestIp|AppBannerRequestHappenTime
//                     var arr = decode_data.split("|");
//                     // let banner_request_id = arr[0];
//                     // let banner_image_url = arr[1];
//                     // let banner_request_ip = arr[2];
//                     // let banner_request_time = arr[3];

//                     NativeAds.request_id = arr[0];
//                     NativeAds.image_url = arr[2];
//                     NativeAds.request_ip = arr[3];
//                     NativeAds.request_time = arr[4];

//                     cc.log(self.isValid);
//                     if (self.isValid) {
//                         self._showQyNative();
//                     }
//                     // cc.log(banner_request_id);
//                     // cc.log(banner_image_url);
//                     // cc.log(banner_request_ip);
//                     // cc.log(banner_request_time);

//                     // cc.loader.loadRes("Prefab/ads/Banner", function (err, prefab) {
//                     //     var banner = cc.instantiate(prefab);
//                     //     cc.director.getScene().addChild(banner,500);
//                     //     cc.game.addPersistRootNode(banner);

//                     //     banner.getComponent("Banner").init(banner_request_id, banner_request_ip, banner_request_time, banner_image_url);
//                     // });
//                 } catch (e) {
//                     cc.log('qyRequestBanner:invalid json: ' + e);
//                 }
//             } else {
//                 cc.log("request error");
//             }
//         };
//         request.open("GET", url, true);
//         request.send();
//     },
//     _showQyNative() {
//         if (!this._isValid()) return;

//         let url = NativeAds.image_url;
//         cc.log(url);
//         url = url.replace('\\', '/');
//         //url ="http://ad.qingyougames.com/Images/Native/Images\512x512/20190108151143451412445.jpg"
//         //url ="http://ad.qingyougames.com/Images/Native/Images/512x512/20190108151143451412445.jpg"

//         // url = 'http://ad.qingyougames.com/Images/Interstitial/640x1136/20181229091550498348514.jpg';

//         var self = this;
//         cc.loader.load({
//             url: url,
//             type: 'jpg'
//         }, function (err, texture) {
//             if (self.isValid) {

//                 var spriteframe = new cc.SpriteFrame(texture);
//                 self.node.getComponent(cc.Sprite).spriteFrame = spriteframe;
//             }
//         });
//     },
//     btnQYNativeClick() {
//         if (!this._isValid()) return;

//         var id = NativeAds.request_id;
//         var ip = NativeAds.request_ip;
//         var time = NativeAds.request_time;

//         var tokey = '';
//         tokey = ip + '|' + id + '|' + time;

//         var encode_tokey = Base64.encode(tokey, window.base64_decode_key);

//         var url = cc.js.formatStr(window.qy_native_click_url, id, encode_tokey);
//         cc.sys.openURL(url);
//     },
// });