
/// 排行榜管理器。负责管理排行榜，目前只集成gamecenter的排行，如果发布googlestore 还需要集成google 排行
let LeaderboardManager = cc.Class({
    properties: {
        leaderboard_name:"w_highlevel",

        leaderboard_gametime_name:'w_gametime',
        leaderboard_hightlevel_name:'w_highlevel',
        leaderboard_dietime_name:'w_dietimes',
    },
    statics:{
        getInstance:function(){
            if(!this._instance) this._instance = new this(); 
            return this._instance; 
        },
    },
    ctor() {
        if (this._isValid()){

            sdkbox.PluginSdkboxPlay.init();
            sdkbox.PluginSdkboxPlay.signin();
        }
    },
    _isValid()
    {
        return cc.sys.isMobile && 
        cc.sys.isNative &&
        sdkbox != undefined && 
        sdkbox.PluginSdkboxPlay != undefined;
    },
    /**
     * 上次游戏时间
     *
     * @param {*} score
     */
    submitGameTime(score)
    {
        this._submitScore(this.leaderboard_gametime_name, score);
    },
    /**
     * 上次最高关卡
     *
     * @param {*} score
     */
    submitHightLevel(score)
    {
        this._submitScore(this.leaderboard_hightlevel_name, score);
    },
    /**
     * 上传死亡次数
     *
     * @param {*} score
     */
    submitDieTime(score)
    {
        this._submitScore(this.leaderboard_dietime_name, score);
    },

    _submitScore:function(name, score){
        if(!this._isValid()) return;
        sdkbox.PluginSdkboxPlay.submitScore( name, score );
    },

    //旧函数
    submitScore:function(score){
        if(!this._isValid()) return;
        sdkbox.PluginSdkboxPlay.submitScore( this.leaderboard_name, score )
    },

    showLeaderboard:function(){
        if(!this._isValid()) return;        
        sdkbox.PluginSdkboxPlay.showLeaderboard( this.leaderboard_name );
    },
});

module.exports = LeaderboardManager;

window.plug = window.plug || {};
window.plug.LeaderboardManager = LeaderboardManager;
