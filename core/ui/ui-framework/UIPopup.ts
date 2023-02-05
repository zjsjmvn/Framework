import { DEV, EDITOR } from 'cc/env';
import UIBase from './UIBase';
import UIManager from './UIManager';
import { Enum, Node, Rect, _decorator, error, Sprite, SpriteFrame, resources, log, UIOpacity, v3, UITransform, tween, v2, EventTouch, rect, AnimationClip, Animation, AnimationState, ValueType, assetManager, Texture2D } from 'cc';
import { Asset } from '../../../../../../@types/packages/engine-extends/@types/glTF';
import EditorTool from '../../utils/EditorUtil';
const { property, ccclass } = _decorator

/**
 * @description 空白判断类型。
 * @enum {number}
 */
enum BlankJudgeType {
    ContentSize,
    BoundingBoxToWorld,
}
@ccclass('UIPopup')
export default abstract class UIPopup<T = any> extends UIBase {

    //#region  animation
    @property
    _useAnimation: boolean = false;
    @property({ displayName: "使用animation" })
    get useAnimation() {
        return this._useAnimation;
    }
    set useAnimation(value) {
        this._useAnimation = value;
        if (value == true) {
            if (EDITOR) {
                let anim: Animation = this.node.getComponent(Animation);
                if (!anim) {
                    anim = this.node.addComponent(Animation);
                }
                if (this.openClip == null) {
                    EditorTool.load<AnimationClip>("script/framework/core/ui/ui-framework/default_uipopup_open_animation.anim").then((v) => { this.openClip = v; });
                }
                if (this.closeClip == null) {
                    EditorTool.load<AnimationClip>("script/framework/core/ui/ui-framework/default_uipopup_close_animation.anim").then((v) => { this.closeClip = v; });
                }
            }
        } else {
            let anim = this.node.getComponent(Animation);
            if (anim) {
                anim.destroy()
            }
            this.animation = null;
            this.openClip = null;
            this.closeClip = null;
        }

    }

    @property({
        type: Animation,
        visible() { return !!this.hasAnimation; }
    })
    protected animation: Animation = null;

    @property({
        type: AnimationClip,
        tooltip: DEV && "打开弹窗的动画",
        visible() { return !!this.hasAnimation; }

    })
    protected openClip: AnimationClip = null;

    @property({
        type: AnimationClip,
        tooltip: DEV && "关闭弹窗的动画",
        visible() { return !!this.hasAnimation; }
    })
    protected closeClip: AnimationClip = null;


    //#endregion
    //#region  空白处关闭，任意处关闭设置

    /**
     * @description 点击空白处关闭
     * @type {boolean}
     * @memberof UIBase
     */
    @property
    _touchBlankPlaceToClose: boolean = false;
    @property({ displayName: "点击空白处关闭", tooltip: "勾选后，当玩家点击ui之外空白处时会关闭此ui" })
    get touchBlankPlaceToClose() {
        return this._touchBlankPlaceToClose;
    }
    set touchBlankPlaceToClose(value) {
        if (this.node.getChildByName("Container")) {
            this._touchBlankPlaceToClose = value;
        } else {
            error('需要Container节点才行');
        }
    }

    @property({
        visible: function () { return this.touchBlankPlaceToClose === true },
        displayName: "空白处判断方式",
        tooltip: "ContentSize就是使用container的大小来判断，BoundingBoxToWorld是使用包围盒来判断，会考虑子节点位置",
        type: Enum(BlankJudgeType)
    })
    blankJudgeType: BlankJudgeType = BlankJudgeType.BoundingBoxToWorld;

    _showNonBlankArea: boolean = false;
    @property({
        visible: function () { return this.touchBlankPlaceToClose === true },
        displayName: "测试：显示非空白区域，显示1s后自动删除",
    })
    get showNonBlankArea() {
        return this._showNonBlankArea;
    }
    set showNonBlankArea(val) {
        // log('showNonBlankArea')
        let containerNode: Node = this.node.getChildByName("Container");
        let containerNodeUiTransform = containerNode.getComponent(UITransform);
        if (!!!containerNode) {
            error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let containerNodeRect: Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            containerNodeRect = containerNodeUiTransform.getBoundingBoxToWorld();
            let nodePos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(containerNodeRect.x, containerNodeRect.y));
            containerNodeRect.x = nodePos.x
            containerNodeRect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNodeUiTransform.contentSize;
            // rect = rect(containerNode.x - contentSize.width / 2, containerNode.y - contentSize.height / 2, contentSize.width, contentSize.height);
            containerNodeRect = rect(containerNode.position.x - contentSize.width / 2, containerNode.position.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }

        let node = new Node();
        this.node.addChild(node);
        node.addComponent(UIOpacity).opacity = 100;
        let sp = node.addComponent(Sprite);
        if (sp) {
            assetManager.loadAny('7d8f9b89-4fd1-4c9f-a3ab-38ec7cded7ca', (err, asset: Asset) => {
                if (!err) {
                    let spriteFrame = new SpriteFrame();
                    const texture = new Texture2D();
                    texture.image = asset;
                    spriteFrame.texture = texture;
                    sp.spriteFrame = spriteFrame;
                    let nodeUiTransform = node.getComponent(UITransform);
                    log(containerNodeRect.width, containerNodeRect.height)
                    nodeUiTransform.setContentSize(containerNodeRect.width, containerNodeRect.height);
                    node.setPosition(containerNodeRect.x + containerNodeRect.width / 2, containerNodeRect.y + containerNodeRect.height / 2);
                    setTimeout(() => {
                        node.removeFromParent();
                    }, 1000);
                } else {
                    error(err);
                }
            })


        }

    }

    /**
     * @description 点击任意处关闭
     * @type {boolean}
     * @memberof UIBase
     */
    @property
    private _touchAnyWhereToClose: boolean = false;
    @property({ displayName: "点击任意处关闭", tooltip: "勾选后，当玩家点击ui的任意处都可关闭ui。适合结算等奖励界面" })
    get touchAnyWhereToClose() {
        return this._touchAnyWhereToClose;
    }
    set touchAnyWhereToClose(value) {
        this._touchAnyWhereToClose = value;
    }

    //#endregion

    private closeAnimationPromiseResolve: Function = null;




    /**
     * @description 
     * @abstract
     * @param {T} [args]
     * @memberof UIPopup
     */
    public abstract init(args?: T);


    public onLoad() {
        if (this.animation) {
            this.openClip && this.animation.addClip(this.openClip);
            this.closeClip && this.animation.addClip(this.closeClip);
            this.animation.on(Animation.EventType.FINISHED, this.onAnimFinished, this);
        }

        if (this._touchBlankPlaceToClose) {
            this.node.on(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.on(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
        this.node._touchListener?.setSwallowTouches(false);
    }

    public async show() {
        await this.beforeShow();
        super.show();
        this.playOpenAnimation();
        await this.afterShow();
    }

    public async hide() {
        await this.beforeHide();
        await this.playCloseAnimation();
        super.hide();
        await this.afterHide();
    }

    public async close() {
        await this.beforeClose();
        this.playCloseAnimation();
        // 不需要缓存才destroy。
        if (!this.needCache) {
            super.close();
        }
        await this.afterClose();
    }

    protected onAnimFinished(type, state: AnimationState): void {
        if (state.clip === this.closeClip) {
            this.closeAnimationPromiseResolve && this.closeAnimationPromiseResolve();
        }
    }

    public playOpenAnimation(): void {
        if (this.animation && this.openClip) {
            this.animation.play(this.openClip.name);
        }
    }

    public async playCloseAnimation(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.animation && this.closeClip) {
                this.closeAnimationPromiseResolve = resolve;
                if (this.animation.getState(this.closeClip.name).isPlaying) {
                    return;
                }
                this.animation.play(this.closeClip.name);
            } else {
                resolve();
            }
        });
    }

    private onThisNodeTouchEnd_UsedFor_TouchMarginToClose(event: EventTouch) {
        // let pop = this.node.getComponentsInChildren(UIPopup);
        // log('onThisNodeTouchEnd_UsedFor_TouchMarginToClose', pop)
        // 判断是否点击的是外面,如果点击的是container外面。则关闭。
        // if (event.eventPhase == Event.CAPTURING_PHASE) return;
        // 允许触摸穿透
        let containerNode: Node = this.node.getChildByName("Container");
        let containerNodeUITransform = containerNode.getComponent(UITransform);

        if (!!!containerNode) {
            error("快速关闭需要container节点来判断是否点击ui外部。请参考其他弹框界面的层级结构。");
            return;
        }
        let containerNodeRect: Rect = null;
        if (this.blankJudgeType == BlankJudgeType.BoundingBoxToWorld) {
            containerNodeRect = containerNodeUITransform.getBoundingBoxToWorld();
            let nodePos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(containerNodeRect.x, containerNodeRect.y));
            containerNodeRect.x = nodePos.x
            containerNodeRect.y = nodePos.y
        } else if (this.blankJudgeType == BlankJudgeType.ContentSize) {
            let contentSize = containerNodeUITransform.contentSize;
            containerNodeRect = rect(containerNode.position.x - contentSize.width / 2, containerNode.position.y - contentSize.height / 2, contentSize.width, contentSize.height);
        }
        let nodePos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(event.getUILocation().x, event.getUILocation().y, 0))
        let contains = containerNodeRect.contains(v2(nodePos.x, nodePos.y));
        if (!contains) {
            UIManager.instance.closePopup(this);
        }
        return;
    }

    private onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose(event) {
        log('onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose', this.node.name);
        UIManager.instance.closePopup(this);

    }



    onDestroy() {

        if (this._touchBlankPlaceToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchMarginToClose, this, true);
        }
        if (this.touchAnyWhereToClose) {
            this.node.off(Node.EventType.TOUCH_END, this.onThisNodeTouchEnd_UsedFor_TouchAnyWhereToClose, this, true);
        }
    }
}




