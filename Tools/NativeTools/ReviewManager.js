
//评论管理器。目前只封装ios的评论功能。
let ReviewManager = cc.Class({
    properties: {
    },
    statics:{
        getInstance:function(){
            if(!this._instance) this._instance = new this(); 
            return this._instance; 
        },
    },
    ctor() {
        if (cc.sys.OS_IOS){
            let self = this;

        }
    },
    
    //应用内评价
    reviewInApp: function () {
         if(!this._isValid())return;
        let ret = jsb.reflection.callStaticMethod("SKStoreReviewController", "requestReview");
    },

    //商店评价
    reviewInAppStore: function () {
         if(!this._isValid())return;
        //if(jsb.reflection.callStaticMethod("NSProcessInfo","isOperatingSystemAtLeastVersion"))
        // if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:(NSOperatingSystemVersion){10, 3, 0}]) {
        //     urlFormatString = @"itms-apps://itunes.apple.com/app/id%@?action=write-review";
        // } else {
        //     urlFormatString = @"itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=%@";
        // }
        // NSString *urlString = [NSString stringWithFormat:urlFormatString, appIdentifierString];

        // [[UIApplication sharedApplication] openURL:[NSURL URLWithString:urlString]];
        //jsb.reflection.callStaticMethod("Application","openURL","itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=1205930884");
        //目前下面对url 只在10.3以上生效。一下不会生效
        let url ="itms-apps://itunes.apple.com/app/id" + window.APPSTOREID + "?action=write-review";

        cc.sys.openURL(url);
    },
    //
    showInAppStore: function (appstore_id) {
        //"itms-apps://itunes.apple.com/app/id"
        //    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:urlString]];

    },

    _isValid()
    {
        return cc.sys.isMobile && cc.sys.isNative;
    },
});

module.exports = ReviewManager;

window.plug = window.plug || {};
window.plug.ReviewManager = ReviewManager;
