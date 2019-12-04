// var Base64 = require("../Base64Tools")

// //{"IsSuccess":true,"Message":null,"Data":"un31os38m\/fKv23+FkcfwAjhMrjTCrc1w8HWwgo5J8cWFKVWJrvVRkcAJrj5wgIyue9PCsiPoAbkosiLodIhusiPodoKzdJnon9EzsYLzAjNR\/vbodiLFeoPFeY1FeijoTPkosiEFdRWoeoaod3+on9+us9"}
// var Phone = cc.Class({
//     name: "Phone",
//     properties: {
//         banner_width: 0,
//         banner_height: 0,
//         screen_width: 0,
//         screen_height: 0,
//     },

//     __ctor__(bw, bh, sw, sh) {
//         this.init(bw, bh, sw, sh);
//     },
//     init(bw, bh, sw, sh) {
//         this.banner_width = bw;
//         this.banner_height = bh;
//         this.screen_width = sw;
//         this.screen_height = sh;
//     },
//     screenRatio() {
//         //默认按照iphone7处理
//         if (this.screen_height == 0 || this.screen_height == 0) return 750 / 1334;
//         var ratio = this.screen_width > this.screen_height ? this.screen_height / this.screen_width : this.screen_width / this.screen_height
//         //cc.log("screenRatio: ratio "+ratio);

//         return ratio;
//     },
// })
// var QYAds = cc.Class({
//     properties: {
//         phones: {
//             type: [Phone],
//             default: [],
//         },
//         _banner: null,
//         _interstitial: null,
//     },
//     ctor() {
//         // IPhone3And4:new Phone(320, 50, 320, 480),
//         // IPhone5:new Phone(320, 50, 320, 568)
//         // IPhone6To8:new Phone(375, 50, 375, 667),
//         // IPad:new Phone(384, 50, 384, 512),
//         // IPhonePlus:new Phone(413, 100, 413, 736),
//         // IPhoneX:new Phone(375, 50, 375, 812),
//         // Android720p:new Phone(720, 100, 720, 1280),
//         // Android1080p: new Phone(1080, 150, 1080, 1920),

//         this.phones.push(new Phone(320, 50, 320, 480));
//         this.phones.push(new Phone(320, 50, 320, 568));
//         this.phones.push(new Phone(375, 50, 375, 667));
//         this.phones.push(new Phone(384, 50, 384, 512));
//         this.phones.push(new Phone(413, 100, 413, 736));
//         this.phones.push(new Phone(375, 50, 375, 812));
//         this.phones.push(new Phone(720, 100, 720, 1280));
//         this.phones.push(new Phone(1080, 150, 1080, 1920));
//         cc.log("qyads ctor");
//         //this.qyRequestInterstitial();

//     },
//     qyRequestBanner() {
//         var node = cc.director.getScene().getChildByName('Banner');
//         if (node) {
//             cc.log("有Banner广告存在");
//             return;
//         }

//         var banner_size = this._getSizeWithWidth();
//         var width = banner_size.banner_width;
//         var height = banner_size.banner_height;
//         cc.log("_qyRequestBanner" + width + " " + height);


//         var platform = require("../AdsManager").getInstance().getPlatformString();
//         var sid = banner_sid;
//         var url = cc.js.formatStr(qy_banner_request_url, width, height, platform, sid);
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function () {
//             if (request.readyState == 4 && (request.status >= 200 && request.status < 400)) {
//                 try {
//                     var json = request.responseText;
//                     cc.log("_qyRequestBanner: " + json);
//                     var response = JSON.parse(request.responseText);
//                     if (response.IsSuccess == false) {
//                         return;
//                     }
//                     //服务端返回的数据只有Data里是需要的
//                     var decode_data = Base64.decode(response.Data, base64_decode_key);
//                     //返回的是AppBannerRequestId|ImageFileUrl|AppBannerRequestIp|AppBannerRequestHappenTime
//                     var arr = decode_data.split("|");
//                     let banner_request_id = arr[0];
//                     let banner_image_url = arr[1];
//                     let banner_request_ip = arr[2];
//                     let banner_request_time = arr[3];
//                     cc.log(banner_request_id);
//                     cc.log(banner_image_url);
//                     cc.log(banner_request_ip);
//                     cc.log(banner_request_time);

//                     cc.loader.loadRes("Prefab/ads/Banner", function (err, prefab) {
//                         var banner = cc.instantiate(prefab);
//                         cc.director.getScene().addChild(banner, 500);
//                         cc.game.addPersistRootNode(banner);


//                         banner.getComponent("Banner").init(banner_request_id, banner_request_ip, banner_request_time, banner_image_url);
//                     });
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
//     qyRequestInterstitial(is_launch_ads = false, close_func = null) {
//         var node = cc.director.getScene().getChildByName('Interstitial');
//         if (node) {
//             cc.log("有interstitial广告存在");
//             return;
//         }


//         cc.log("qyRequestInterstitial");
//         var width = cc.view.getFrameSize().width;
//         var height = cc.view.getFrameSize().height;
//         var platform = require("../AdsManager").getInstance().getPlatformString();
//         var sid = "";
//         if (is_launch_ads == true) {
//             sid = launch_sid;
//         } else {
//             sid = interstitial_sid
//         }
//         var url = cc.js.formatStr(qy_interstitial_request_url, width, height, platform, sid);
//         cc.log("url" + url);
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function () {
//             if (request.readyState == 4 && (request.status >= 200 && request.status < 400)) {
//                 try {
//                     var json = request.responseText;
//                     cc.log("_qyRequestInterstitial: " + json);
//                     var response = JSON.parse(request.responseText);
//                     if (response.IsSuccess == false) {
//                         return;
//                     }
//                     var decode_data = Base64.decode(response.Data, base64_decode_key);
//                     var arr = decode_data.split("|");
//                     let banner_request_id = arr[0];
//                     let banner_image_url = arr[1];
//                     let banner_request_ip = arr[2];
//                     let banner_request_time = arr[3];
//                     cc.log(banner_request_id);
//                     cc.log(banner_image_url);
//                     cc.log(banner_request_ip);
//                     cc.log(banner_request_time);

//                     cc.loader.loadRes("Prefab/ads/Interstitial", function (err, prefab) {
//                         var interstitial = cc.instantiate(prefab);
//                         cc.director.getScene().addChild(interstitial, 1000);
//                         cc.game.addPersistRootNode(interstitial);

//                         //require("../QYAdsManager").getInstance().hideBanner();
//                         let comp_intersititial = interstitial.getComponent("Interstitial");
//                         comp_intersititial.registCloseCallback(close_func);
//                         comp_intersititial.init(banner_request_id, banner_request_ip, banner_request_time, banner_image_url);
//                     });

//                 } catch (e) {
//                     cc.log('_qyRequestInterstitial:invalid json: ' + e);

//                 }
//             } else {
//                 cc.log("request error");
//             }
//         };
//         request.open("GET", url, true);
//         request.send();


//     },
//     qyRequestLaunchAds() {
//         this.qyRequestInterstitial(true);
//     },

//     _qyOnInterstitialClick(interstitial_id) {

//     },
//     _qyGenerateTokey() {

//     },
//     _getSizeWithWidth() {
//         var temp = this.phones[0];
//         var tolerance = 0.01; //误差范围

//         // 一个是屏幕的尺寸，一个是逻辑分辨率。
//         // 需要清楚他们的缩放关系
//         // 按照逻辑分辨率请求图片。一个点装多个像素。根据点获得图片。
//         // 整体计算都用竖屏计算。
//         var screen_width = Math.min(cc.view.getFrameSize().width, cc.view.getFrameSize().height);
//         var screen_height = Math.max(cc.view.getFrameSize().width, cc.view.getFrameSize().height);
//         var current_screen_ratio = screen_width / screen_height;
//         //cc.log("getFrameSize"+cc.view.getFrameSize().width+" "+cc.view.getFrameSize().height)
//         //cc.log("current_screen_ratio"+current_screen_ratio);
//         for (var i in this.phones) {
//             var phone = this.phones[i];
//             //屏幕比例偏差
//             var screen_ratio_deviation = Math.abs(current_screen_ratio - phone.screenRatio()); //设备分辨率宽高比的差
//             if (screen_ratio_deviation <= tolerance) { //如果宽高比的差小于等于容忍范围内
//                 temp = phone; //选取
//                 break;
//             }
//         }
//         // var scale_factor = screen_width / temp.banner_width;
//         // var banner_width = phone.banner_width * scale_factor;
//         // var banner_height = phone.banner_height * scale_factor;
//         cc.log("phone: " + phone.banner_width + " " + phone.banner_height);
//         //cc.log("scale_factor: "+scale_factor);
//         cc.log("banner_width: " + phone.banner_width + " banner_height: " + phone.banner_height);

//         return {
//             banner_width: phone.banner_width,
//             banner_height: phone.banner_height
//         };
//     }
// });