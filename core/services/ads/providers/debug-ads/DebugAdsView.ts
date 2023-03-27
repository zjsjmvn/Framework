import { ShowRewardVideoCallBackMsg, AdsManager } from '../../AdsManager';
import { DebugAdsEnum } from './DebugAds';
import { _decorator, Component, game, log, resources, Sprite, SpriteFrame, director, BlockInputEvents, Label, Color, Node, UITransform, view, v2, v3, error, screen, Asset, Widget, Layers } from 'cc';
import { assetManager } from 'cc';
import { Texture2D } from 'cc';


const { ccclass, property } = _decorator;
@ccclass

export default class DebugAdsView extends Component {
    private rewardAdsCallFunc: (pram: ShowRewardVideoCallBackMsg) => {} = null;
    private interstitialCallFunc: (result: boolean) => {} = null;
    initBanner(style?) {
        this.initUI(DebugAdsEnum.Banner);
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.anchorX = 0;
        uiTransform.anchorY = 1;
        style = style || AdsManager.instance.defaultBannerStyle();
        // let scaleX = view.getVisibleSize().width / screen.windowSize.width;
        // let scaleY = view.getVisibleSize().height / screen.windowSize.height;
        uiTransform.width = style.width / 2;
        uiTransform.height = uiTransform.width / 16 * 9;
        let title = this.addTitle('banner');
        title.setPosition(v3(uiTransform.width / 2, -uiTransform.height / 2, 0));
        title.setScale(v3(0.7, 0.7, 0));
        this.node.setPosition(v3((view.getVisibleSize().width - uiTransform.width) / 2 - view.getVisibleSize().width / 2, uiTransform.height - view.getVisibleSize().height / 2));
        // this.node.setPosition(v3(0, 0, 0));

    }
    initInterstitialAds(callback) {
        this.interstitialCallFunc = callback;
        this.initUI(DebugAdsEnum.Interstitial)
        let size = view.getVisibleSize();
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.contentSize = size;
        this.node.setPosition(v3(0, 0, 0));
    }
    initRewardAds(callFunc) {
        this.rewardAdsCallFunc = callFunc;
        this.initUI(DebugAdsEnum.Reward);
        let size = view.getVisibleSize();
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.contentSize = size;
        this.node.setPosition(v3(0, 0, 0));
    }

    initUI(adsEnum: DebugAdsEnum) {
        director.getScene().getChildByName('Canvas').addChild(this.node);
        this.node.layer = Layers.Enum.UI_2D;
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
                this.addBtn('成功播放', this._onRewardAdsSuccessTouchEnd).setPosition(100, 0);
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
        node.getComponent(Label).color = Color.BLACK;

        this.node.addChild(node);
        node.setPosition(0, 100);
        return node;
    }
    /**单色 */
    setSpriteFrame(node) {
        assetManager.loadAny({ uuid: '7d8f9b89-4fd1-4c9f-a3ab-38ec7cded7ca@f9941', type: SpriteFrame }, (e, r) => {
            if (!e) {
                node.getComponent(Sprite).spriteFrame = r
            } else {
                error('load fail');
            }
        });
    }
    _onInterstitialSuccessTouchEnd() {
        if (this.interstitialCallFunc) {
            this.interstitialCallFunc(true);
            this.close();
        }
    }
    _onRewardAdsSuccessTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new ShowRewardVideoCallBackMsg()
            res.success = true;
            this.rewardAdsCallFunc(res);
        }
        this.close();
    }

    _onFailTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new ShowRewardVideoCallBackMsg()
            res.success = false;
            res.errMsg = "播放失败";
            this.rewardAdsCallFunc(res);
        }
        this.close();
    }

    _onNonAdsTouchEnd() {
        if (!!this.rewardAdsCallFunc) {
            let res = new ShowRewardVideoCallBackMsg()

            res.success = false;
            res.errMsg = "无广告";
            this.rewardAdsCallFunc(res);
        }

        this.close();
    }

    close() {
        director.resume();
        this.node.destroy();
    }
}
