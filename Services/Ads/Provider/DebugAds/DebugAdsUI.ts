import { RewardVideoCallBackMsg, AdsManager } from '../../AdsManager';
import { DebugAdsEnum } from './DebugAds';


const { ccclass, property } = cc._decorator;
@ccclass

export default class DebugAdsView extends cc.Component {
    private rewardAdsCallFunc: (pram: RewardVideoCallBackMsg) => {} = null;
    private interstitialCallFunc: (result: boolean) => {} = null;

    initBanner(style?) {
        this.node.zIndex = 9999;
        // cc.game.addPersistRootNode(this.node);
        this.node.addComponent(cc.BlockInputEvents);
        this.node.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this.setSpriteFrame(this.node);

        this.node.anchorX = 0;
        this.node.anchorY = 1;
        //使用百度方案
        style = style || AdsManager.instance.defaultBannerStyle();
        let scaleX = cc.view.getVisibleSize().width / cc.view.getFrameSize().width;
        let scaleY = cc.view.getVisibleSize().height / cc.view.getFrameSize().height;
        cc.log('scalex', scaleX)
        this.node.width = style.width / 2 * scaleX;
        this.node.height = this.node.width / 16 * 9;

        cc.log('getVisibleSize', cc.view.getVisibleSize().width, cc.view.getFrameSize().width;)
        //百度
        let title = this.addTitle('banner');
        title.position = cc.v2(this.node.width / 2, -this.node.height / 2);
        title.scale = 0.7;

        this.node.x = (cc.view.getVisibleSize().width - this.node.width) / 2
        this.node.y = this.node.height + 1;
    }
    initInterstitialAds(callback) {
        this.interstitialCallFunc = callback;
        this.initUI(DebugAdsEnum.Interstitial)
    }
    initRewardAds(callFunc) {
        //cc.director.pause();
        this.rewardAdsCallFunc = callFunc;
        this.initUI(DebugAdsEnum.Reward);
    }

    initUI(adsEnum: DebugAdsEnum) {
        this.node.zIndex = 10000;
        cc.game.addPersistRootNode(this.node);

        let size = cc.view.getVisibleSize();
        this.node.width = size.width;
        this.node.height = size.height;
        this.node.x = size.width / 2;
        this.node.y = size.height / 2;
        this.node.addComponent(cc.BlockInputEvents);
        this.node.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this.setSpriteFrame(this.node);
        switch (adsEnum) {
            case DebugAdsEnum.Banner: {
            } break;
            case DebugAdsEnum.Interstitial: {
                this.addTitle('插页');
                this.addBtn('关闭', this._onInterstitialSuccessTouchEnd);
            } break;
            case DebugAdsEnum.Reward: {
                this.addTitle('视频');
                this.addBtn('成功播放', this._onRewardAdsSuccessTouchEnd).x = 100;
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
    setSpriteFrame(node) {
        let sp = node.getComponent(cc.Sprite);
        if (sp) {
            cc.resources.load({ uuid: 'a23235d1-15db-4b95-8439-a2e005bfff91', type: cc.SpriteFrame }, function (e, r) {
                if (!e) {
                    cc.log('load success');

                    sp.spriteFrame = r;
                } else {
                    cc.error('load fail');
                }
            });
        }
    }
    _onInterstitialSuccessTouchEnd() {
        if (this.interstitialCallFunc) {
            this.interstitialCallFunc(true);
            this.close();
        }
    }
    _onRewardAdsSuccessTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new RewardVideoCallBackMsg()
            res.result = true;
            this.rewardAdsCallFunc(res);
        }
        this.close();
    }

    _onFailTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new RewardVideoCallBackMsg()
            res.result = false;
            res.errMsg = "播放失败";
            this.rewardAdsCallFunc(res);
        }
        this.close();
    }

    _onNonAdsTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new RewardVideoCallBackMsg()

            res.result = false;
            res.errMsg = "无广告";
            this.rewardAdsCallFunc(res);
        }

        this.close();
    }

    close() {
        cc.game.removePersistRootNode(this.node);
        cc.director.resume();
        this.node.destroy();


    }
}
