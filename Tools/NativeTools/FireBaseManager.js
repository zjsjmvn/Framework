let FireBaseManager = cc.Class({
    properties: {
    },
    statics:{
        getInstance:function(){
            if(!this._instance) this._instance = new this(); 
            return this._instance; 
        },
    },
    ctor() {                
        //GoogleService-Info.plist 需要添加文件
        if(cc.sys.isNative && 
            cc.sys.isMobile && 
            sdkbox && 
            sdkbox.firebase != undefined &&
            sdkbox.firebase.Analytics != undefined)
        {
            sdkbox.firebase.Analytics.init();
        }
    },

});
0
module.exports = FireBaseManager;

window.plug = window.plug || {};
window.plug.FireBaseManager = FireBaseManager;
