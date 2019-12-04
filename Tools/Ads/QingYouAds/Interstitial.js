// var Base64 = require("../Base64Tools")
// var QYAdsManager = require("../AdsManager");
// var Interstitial = cc.Class({
//     extends: cc.Component,
//     properties: {
//         banner_id: 0,
//         banner_request_ip: 0,
//         banner_request_time: 0,
//         banner_img_url: 0,
//         onClick: false,
//         _onCloseCallback: null,
//     },
//     onEnable() {
//         //cc.log("cc.view.getFrameSize() :    "+cc.view.getFrameSize().width,cc.view.getFrameSize().height);
//         ///this.init("705006","117.30.95.192","2018-7-23 10:34:44",'http://ad.qingyougames.com/Images/Interstitial/640x1136/20171213172634654000685.jpg');
//     },
//     init(id, ip, time, url) {
//         this.banner_id = id;
//         this.banner_request_ip = ip;
//         this.banner_img_url = url;
//         this.banner_request_time = time;
//         var self = this;
//         cc.loader.load({
//             url: url,
//             type: 'jpg'
//         }, function (err, texture) {
//             if (err) {
//                 cc.log(err);
//                 return;
//             }
//             var spriteframe = new cc.SpriteFrame(texture);
//             self.node.getComponent(cc.Sprite).spriteFrame = spriteframe;

//             cc.loader.load({
//                 url: window.qy_interstitial_close_button_image_url,
//                 type: 'jpg'
//             }, function (err, texture) {
//                 if (err) {
//                     cc.log(err);
//                     return;
//                 }
//                 var spriteframe = new cc.SpriteFrame(texture);
//                 var child = self.node.getChildByName("close_btn");
//                 if (child) {
//                     cc.log(child);
//                     let sprite = child.getComponent(cc.Sprite);
//                     if (sprite) {
//                         sprite.spriteFrame = spriteframe;
//                     }
//                 }
//             })
//         });

//     },
//     onInterstitialTouched() {
//         cc.log("onInterstitialTouched");
//         if (!this.onClick) {
//             this.onClick = false;
//             this._onInterstitialClick();
//         }

//     },
//     _onInterstitialClick() {
//         var id = this.banner_id;
//         var ip = this.banner_request_ip;
//         var time = this.banner_request_time;

//         var tokey = '';
//         tokey = ip + '|' + id + '|' + time;
//         var encode_tokey = Base64.encode(tokey, window.base64_decode_key);
//         cc.log("_onBannerClick encode tokey :" + encode_tokey);
//         var url = cc.js.formatStr(window.qy_interstitial_click_url, id, encode_tokey);
//         cc.log("url" + url);
//         cc.sys.openURL(url);
//     },
//     onCloseBtnTouched() {
//         this.node.removeFromParent(true);
//         cc.game.removePersistRootNode(this);

//         //require("../QYAdsManager").getInstance().showBanner();

//         if (this._onCloseCallback) {
//             this._onCloseCallback();
//         }
//         //AudioManager.playMusic();

//     },
//     registCloseCallback(callback) {
//         this._onCloseCallback = callback;
//     },

// });