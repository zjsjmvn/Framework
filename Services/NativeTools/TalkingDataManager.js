
let TalkingDataManager = cc.Class({
    properties: {
    },
    statics:{
        getInstance:function(){
            if(!this._instance) this._instance = new this(); 
            return this._instance; 
        },
    },
    ctor() {
      
    },
    haveSdk()
    {
        return cc.sys.isNative  && cc.sys.isMobile;
    },
    //关卡第一次通关
    sendLevelPass(level_id)
    {
        if(!this.haveSdk()) return;

        /**
         *	@method	onCompleted 完成一项任务
        *	@param 	missionId   任务名称    类型:NSString
        */            
        jsb.reflection.callStaticMethod('TDGAMission','onBegin:',level_id.toString());
        jsb.reflection.callStaticMethod('TDGAMission','onCompleted:',level_id.toString());
    },
    //跳过关卡
    sendSkipLevel(level_id)
    {
        if(!this.haveSdk()) return;
        /**
         *	@method	onFailed    一项任务失败
        *	@param 	missionId   任务名称    类型:NSString
        *	@param 	cause       失败原因    类型:NSString
        */
        jsb.reflection.callStaticMethod('TDGAMission','onBegin:',level_id.toString());
        jsb.reflection.callStaticMethod('TDGAMission','onFailed:failedCause:',level_id.toString(),'skip');    
    },

});

module.exports = TalkingDataManager;

window.plug = window.plug || {};
window.plug.TalkingDataManager = TalkingDataManager;
