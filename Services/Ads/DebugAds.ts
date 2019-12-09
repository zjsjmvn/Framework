import { RewardVideoCallBackMsg, AdsManager } from './AdsManager';

enum DebugAdsEnum {
    Banner = 0,
    Interstitial = 1,
    Video = 2,

}


const { ccclass, property } = cc._decorator;
@ccclass

export default class DebugAds extends cc.Component {
    private adsCallFunc: (pram: RewardVideoCallBackMsg) => {} = null;
    public static showInterstitial(self, callback) {
        let node = new cc.Node('DebugAds');
        let debugAds: DebugAds = node.addComponent('DebugAds');
        debugAds.initVideo(DebugAdsEnum.Interstitial, callback);
        //cc.director.getScene().addChild(node);
    }
    public static showVideo(): Promise<RewardVideoCallBackMsg> {
        return new Promise((resolve, reject) => {
            cc.log("DebugAds showVideo ")
            let node = new cc.Node('DebugAds');
            let debugAds: DebugAds = node.addComponent(DebugAds);
            let callback = (result: RewardVideoCallBackMsg) => {
                resolve(result);
            }
            debugAds.initVideo(DebugAdsEnum.Video, callback);
        })
    }


    public static showBanner() {
        if (cc.director.getScene()) {
            let banner = cc.director.getScene().getChildByName('Banner');
            if (!banner) {
                let node = new cc.Node('Banner');
                let debugAds = node.addComponent('DebugAds');
                debugAds.initBanner();
                //cc.director.getScene().addChild(node);                    
            }
        }
    }
    public static hideBanner() {
        if (cc.director.getScene()) {
            let banner = cc.director.getScene().getChildByName('Banner');
            if (banner) {
                banner.getComponent('DebugAds').close();
            }
        }
    }



    initBanner(style) {
        this.node.zIndex = 9999;
        cc.game.addPersistRootNode(this.node);
        this.node.addComponent(cc.BlockInputEvents);
        this.node.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this.setFrame(this.node);

        this.node.anchorX = 0;
        this.node.anchorY = 1;
        //使用百度方案
        style = style || AdsManager.instance.defaultBannerStyle();
        let scaleX = cc.view.getVisibleSize().width / cc.view.getFrameSize().width;
        let scaleY = cc.view.getVisibleSize().height / cc.view.getFrameSize().height;
        this.node.width = style.width * scaleX;
        this.node.height = this.node.width / 16 * 9;

        //百度
        let title = this.addTitle('小游戏广告\n当前wx&tt\n百度仅宽度增加\n可用WxAdsView自定义');
        title.position = cc.v2(this.node.width / 2, -this.node.height / 2);
        title.scale = 0.7;

        this.node.x = style.left * scaleX;
        this.node.y = cc.view.getVisibleSize().height - style.top * scaleY;
    }
    //init video Interstitial
    initVideo(adsEnum: DebugAdsEnum, callFunc) {


        cc.log("initvideo")
        //cc.director.pause();
        this.node.zIndex = 10000;
        cc.game.addPersistRootNode(this.node);
        this.adsCallFunc = callFunc;

        let size = cc.view.getVisibleSize();
        this.node.width = size.width;
        this.node.height = size.height;
        this.node.x = size.width / 2;
        this.node.y = size.height / 2;
        this.node.addComponent(cc.BlockInputEvents);
        this.node.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;

        this.setFrame(this.node);

        switch (adsEnum) {
            case DebugAdsEnum.Banner: {
            } break;
            case DebugAdsEnum.Interstitial: {
                this.addTitle('插页');
                this.addBtn('关闭', this._onSuccessTouchEnd);
            } break;
            case DebugAdsEnum.Video: {
                this.addTitle('视频');
                this.addBtn('成功播放', this._onSuccessTouchEnd).x = 100;
                this.addBtn('失败播放', this._onFailTouchEnd).x = -100;
                this.addBtn('wx&tt视频上限', this._onNonAdsTouchEnd).y = -50;
            } break;
        }
    }

    addBtn(desc, callFunc) {
        let node = new cc.Node(desc);
        node.color = cc.Color.BLACK;
        node.addComponent(cc.Label).string = desc;
        this.node.addChild(node);

        node.on(cc.Node.EventType.TOUCH_END, callFunc, this);

        return node;
    }

    addTitle(desc) {
        let node = new cc.Node(desc);
        node.color = cc.Color.BLACK;
        node.addComponent(cc.Label).string = desc;
        this.node.addChild(node);

        node.y = 100;

        return node;
    }
    /**单色 */
    setFrame(node) {
        let sp = node.getComponent(cc.Sprite);
        if (sp) {
            cc.loader.load({ uuid: 'a23235d1-15db-4b95-8439-a2e005bfff91', type: cc.SpriteFrame }, function (e, r) {
                if (!e) {
                    sp.spriteFrame = r;
                }
            });
        }
    }
    _onSuccessTouchEnd() {
        if (!!this.adsCallFunc) {
            let res = new RewardVideoCallBackMsg()
            res.result = true;
            this.adsCallFunc(res);
        }
        this.close();
    }

    _onFailTouchEnd() {
        if (!!this.adsCallFunc) {
            let res = new RewardVideoCallBackMsg()
            res.result = false;
            res.errMsg = "播放失败";
            this.adsCallFunc(res);
        }
        this.close();
    }

    _onNonAdsTouchEnd() {
        if (!!this.adsCallFunc) {
            let res = new RewardVideoCallBackMsg()

            res.result = false;
            res.errMsg = "无广告";
            this.adsCallFunc(res);
        }

        this.close();
    }

    close() {
        cc.game.removePersistRootNode(this.node);
        cc.director.resume();
        this.node.destroy();


    }
}
