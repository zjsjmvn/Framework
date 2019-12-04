// var Base64 = require("../Base64Tools")
// var QYAdsManager = require("../AdsManager");

// var Banner = cc.Class({
//     extends: cc.Component,
//     properties: {
//         banner_id: 0,
//         banner_request_ip: 0,
//         banner_request_time: 0,
//         banner_img_url: 0,
//         onClick: false,
//     },
//     onEnable() {
//         //this.init("705006","117.30.95.192","2018-7-23 10:34:44",'http://ad.qingyougames.com/Images/Banner/640x100/20171214101349633488978.jpg');
//     },
//     init(id, ip, time, url) {

//         cc.log("init" + id + ip + time + url);
//         this.banner_id = id;
//         this.banner_request_ip = ip;
//         this.banner_img_url = url;
//         this.banner_request_time = time;
//         var self = this;
//         cc.loader.load({
//             url: url,
//             type: 'jpg'
//         }, function (err, texture) {

//             cc.log("request url" + err);
//             var spriteframe = new cc.SpriteFrame(texture);
//             self.node.getComponent(cc.Sprite).spriteFrame = spriteframe;
//         })
//     },
//     onBannerTouched() {
//         cc.log("onInterstitialTouched");
//         if (!this.onClick) {
//             this.onClick = false;
//             this._onBannerClick();
//         }

//     },
//     _onBannerClick() {
//         var id = this.banner_id;
//         var ip = this.banner_request_ip;
//         var time = this.banner_request_time;

//         var tokey = '';
//         tokey = ip + '|' + id + '|' + time;
//         cc.log("QYAdsManager.getInstance().base64_decode_key:" + window.base64_decode_key);
//         var encode_tokey = Base64.encode(tokey, window.base64_decode_key);
//         cc.log("_onBannerClick encode tokey :" + encode_tokey);
//         //http://ad.qingyougames.com/Ad/BannerAdClick.aspx?sid=705006&toKey=odiLFeoPFeY1FeijoTPLosOPoswboe3hzAKLFdInIsiPzeoKze9K
//         var url = cc.js.formatStr(qy_banner_click_url, id, encode_tokey);
//         cc.sys.openURL(url);

//     },

// });