import { RewardVideoCallBackMsg, AdsManager } from '../../AdsManager';
import { DebugAdsEnum } from './DebugAds';
import { _decorator, Component, game, log, resources, Sprite, SpriteFrame, director, BlockInputEvents, Label, Color, Node, UITransform, view, v2, v3, error, screen } from 'cc';


const { ccclass, property } = _decorator;
@ccclass

export default class DebugAdsView extends Component {
    private rewardAdsCallFunc: (pram: RewardVideoCallBackMsg) => {} = null;
    private interstitialCallFunc: (result: boolean) => {} = null;
    initBanner(style?) {
        this.node.setSiblingIndex(9999);
        // game.addPersistRootNode(this.node);
        this.node.addComponent(BlockInputEvents);
        this.node.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        this.setSpriteFrame(this.node);
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.anchorX = 0;
        uiTransform.anchorY = 1;
        //使用百度方案
        style = style || AdsManager.instance.defaultBannerStyle();
        let scaleX = view.getVisibleSize().width / screen.windowSize.width;
        let scaleY = view.getVisibleSize().height / screen.windowSize.height;
        log('scalex', scaleX)
        uiTransform.width = style.width / 2 * scaleX;
        uiTransform.height = uiTransform.width / 16 * 9;
        //百度
        let title = this.addTitle('banner');
        title.setPosition(v3(uiTransform.width / 2, -uiTransform.height / 2, 0));
        title.setScale(v3(0.7, 0.7, 0));

        this.node.setPosition(v3((view.getVisibleSize().width - uiTransform.width) / 2, uiTransform.height + 1));
    }
    initInterstitialAds(callback) {
        this.interstitialCallFunc = callback;
        this.initUI(DebugAdsEnum.Interstitial)
    }
    initRewardAds(callFunc) {
        //director.pause();
        this.rewardAdsCallFunc = callFunc;
        this.initUI(DebugAdsEnum.Reward);
    }

    initUI(adsEnum: DebugAdsEnum) {
        this.node.setSiblingIndex(10000);
        director.addPersistRootNode(this.node);

        let size = view.getVisibleSize();
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.width = size.width;
        uiTransform.height = size.height
        this.node.setPosition(size.width / 2, size.height / 2);
        this.node.addComponent(BlockInputEvents);
        this.node.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
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
                this.addBtn('成功播放', this._onRewardAdsSuccessTouchEnd).setPosition(-100, 0);
                this.addBtn('失败播放', this._onFailTouchEnd).setPosition(-100, 0);
                this.addBtn('wx&tt视频上限', this._onNonAdsTouchEnd).setPosition(0, -50);
            } break;
        }
    }

    addBtn(desc, callFunc) {
        let node = new Node(desc);
        node.addComponent(Label).string = desc;
        node.getComponent(Label).color = Color.BLACK;
        this.node.addChild(node);
        node.on(Node.EventType.TOUCH_END, callFunc, this);
        return node;
    }

    addTitle(desc) {
        let node = new Node(desc);
        node.addComponent(Label).string = desc;
        this.node.addChild(node);
        this.node.setPosition(0, 100);
        return node;
    }
    /**单色 */
    setSpriteFrame(node) {
        let sp = node.getComponent(Sprite);
        if (sp) {
            resources.load({ uuid: 'a23235d1-15db-4b95-8439-a2e005bfff91', type: SpriteFrame }, function (e, r) {
                if (!e) {
                    log('load success');
                    sp.spriteFrame = r;
                } else {
                    error('load fail');
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
        director.removePersistRootNode(this.node);
        director.resume();
        this.node.destroy();
    }
}
