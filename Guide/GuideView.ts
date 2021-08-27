import Thor from "../UI/UIKiller/Thor";
import { GuideHelper } from "./GuideHelper";
import { GuideStep } from "./GuideStep";
let async = require("async");
const { ccclass, property } = cc._decorator;
@ccclass
export class GuideView extends Thor {

    _index = 0;                                     //引导序号
    _finger = null;                                 //手型精灵 通过thor赋值 直接使用
    _clipper = null;                                //遮罩层 通过thor赋值 直接使用

    _text: cc.Node = null;
    _textBg: cc.Node = null;
    _textLabel: cc.Node = null;
    onLoad() {

    }
    onEnable() {

    }
    initView(guideStep: GuideStep) {
        //初始化ui
        //设置text位置
    }
    /**
     * 手型指向定位节点
     * @param locateNode
     * @param cb
     * @private
     */
    fingerToNode(locateNodes: Array<cc.Node>, step: GuideStep, assignedAction = null) {
        if (locateNodes.length > 0) {
            let locateNode: cc.Node = locateNodes[0];
            let rect = locateNode.getBoundingBoxToWorld();
            let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
            rect.x = nodePos.x;
            rect.y = nodePos.y;
            if (assignedAction) {
                this._finger.active = false;
                assignedAction(this.node, cc.v2(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5));
            } else {
                this._fingerToPointAction(cc.v2(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5), step.repeatAction, step.fingerPosOffset);
            }
            if (step.showMask) {
                this.showMask(rect);
            }
        }
    }
    /**
     * 
     * @param locateNodes 移动的节点组
     * @param step 步骤的配置文件
     * @param round 是否
     */
    fingerToNodeArray(locateNodes: Array<cc.Node>, step: GuideStep, isMoveBackAndForth = false) {
        cc.log('fingerToNodeArray');
        let locateNode: cc.Node = locateNodes[0];
        let targetNode = locateNodes[1];
        let rect = locateNode.getBoundingBoxToWorld();
        let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
        rect.x = nodePos.x;
        rect.y = nodePos.y;
        rect = rect;
        let points = [];
        for (let i in locateNodes) {
            let _point = locateNodes[i].convertToWorldSpaceAR(cc.Vec2.ZERO);
            points.push(this.node.convertToNodeSpaceAR(_point));
        }
        if (isMoveBackAndForth) {
            this._fingerToPointArrayAndBackAction(points, step.fingerMoveSpeed, step.repeatAction);
        } else {
            this._fingerToPointArrayAction(points, step.fingerMoveSpeed, step.repeatAction);
        }
        if (step.showMask) {
            this.showMask(rect);
        }
    }
    /**
     * 手型动画，指向指定位置
     * @param point
     * @param isAnimation
     */
    _fingerToPointAction(point: cc.Vec2, isAnimation, posOffset?: cc.Vec2) {
        cc.log('point', point.toString());
        this._finger.stopAllActions();
        this._finger.setScale(1);
        if (!!posOffset) {
            point = point.add(posOffset);
        }
        this._finger.setPosition(point);
        this._finger.active = true;
        this._finger.opacity = 255;
        let moveTime = 0;

        if (point && isAnimation) {
            let width = this._finger.x - point.x;
            let height = this._finger.y - point.y;
            let length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            moveTime = length / (width * 1);
            let moveTo = cc.moveTo(moveTime, point);
            let action = cc.sequence(moveTo, cc.callFunc(() => {
                let scaleBy = cc.scaleBy(0.3, 0.8);
                let scaleBy2 = cc.scaleTo(0.3, 1);
                let sequence = cc.sequence(scaleBy, scaleBy2);
                this._finger.runAction(cc.repeatForever(sequence));
            }, this));
            this._finger.runAction(action);
        } else if (point) {
            this._finger.setPosition(point);
        }
    }

    /**
     * 手型精灵依次在多个座标点中移动
     * @param pointArray
     * @param isRepeat
     */
    _fingerToPointArrayAction(pointArray: Array<cc.Vec2>, fingerMoveSpeed, isRepeat) {

        let array = [];
        let firstPoint = pointArray.shift();
        let point = firstPoint;
        this._finger.setPosition(firstPoint);
        this._finger.stopAllActions();
        this._finger.active = true;
        //按照speed去运动
        pointArray.forEach((pt, index) => {

            let dis = cc.v2(point).sub(pt).mag();
            let time = dis / fingerMoveSpeed;
            point = pt;

            cc.log('dis', dis);
            let moveTo = cc.moveTo(time, pt);
            if (index === 0) {
                array.push(cc.spawn(moveTo, cc.fadeIn(time)));
            } else {
                array.push(moveTo);
            }
        });

        // //延时1秒
        array.push(cc.spawn(cc.delayTime(0.5), cc.fadeOut(0.5)));
        array.push(cc.callFunc(() => {
            this._finger.setPosition(firstPoint);
            this._finger.opacity = 150;
        }, this));
        let action = cc.sequence(array);
        if (isRepeat) {
            action = cc.repeatForever(action);
        }

        this._finger.runAction(action);
    }
    /**
     * 手型精灵依次在多个座标点中移动,正序播放之后在倒叙播放
     * @param pointArray
     * @param isRepeat
     */
    _fingerToPointArrayAndBackAction(pointArray: Array<cc.Vec2>, fingerMoveSpeed, isRepeat) {
        cc.log('pointArray', JSON.stringify(pointArray));
        let arr = JSON.parse(JSON.stringify(pointArray));
        this._finger.setPosition(arr[0]);
        this._finger.stopAllActions();
        this._finger.active = true;
        //先正向移动
        let actions: cc.ActionInterval[] = new Array<cc.ActionInterval>()
        for (let i = 1; i < arr.length; ++i) {
            let dis = cc.v2(arr[i - 1]).sub(arr[i]).mag();
            let time = dis / fingerMoveSpeed;
            let moveAction = cc.moveTo(time, arr[i]);
            actions.push(moveAction);
        }
        //反向移动
        let reversedActions: cc.ActionInterval[] = new Array<cc.ActionInterval>()
        for (let i = arr.length - 2; i >= 0; --i) {
            let dis = cc.v2(arr[i + 1]).sub(arr[i]).mag();
            let time = dis / fingerMoveSpeed;
            let moveAction = cc.moveTo(time, arr[i]);
            actions.push(moveAction);
        }
        let totalAction = cc.sequence(actions);
        if (isRepeat) {
            totalAction = cc.repeatForever(totalAction);
        }

        this._finger.runAction(totalAction);
    }


    /**
     * 停止手型提示
     * @param visible
     */
    stopFingerAction(visible = false) {
        this._finger.stopAllActions();
        this._finger.active = false;
    }

    hideMask() {
        if (this._clipper) {
            this._clipper.active = false;
        }
    }

    /**
     * 显示遮罩层
     */
    showMask(rect: cc.Rect) {
        this._clipper.active = true;
        this._clipper.setContentSize(rect.width, rect.height);
        this._clipper.setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);
    }

    /**
     * 显示文字提示
     * @param textHint
     * @private
     */
    _showDescriptTextHint(step: GuideStep) {
        if (step.hintText.length === 0) {
            this._closeTextHint();
            return;
        }
        if (!step.hintText) {
            cc.log('setDescriptTextHint', step.hintText);
            this._text.active = false;
            return;
        }

        if (!!step.customTextAction) {
            step.customTextAction(this._text);
        }
        this._textBg.scaleX = Math.abs(this._textBg.scaleX);
        if (step.textBgFlip) {
            this._textBg.scaleX *= -1;
        }
        this._text.active = true;
        this._textLabel.getComponent(cc.RichText).string = step.hintText;
        if (step.textPos) {
            this._text.setPosition(step.textPos.x, step.textPos.y);
        }

    }

    _showCompleteTextHint(step: GuideStep) {
        if (step.completeText.length === 0) {
            this._closeTextHint();
            return;
        }
        if (!step.completeText) {
            this._text.active = false;
            return;
        }
        this._text.active = true;
        cc.log('_showCompleteTextHint', step.completeText)
        this._textLabel.getComponent(cc.RichText).string = step.completeText;
        if (step.textPos) {
            this._text.setPosition(step.textPos.x, step.textPos.y);
        }
    }

    _closeTextHint() {
        if (this._text) {
            this._text.active = false;
        }
    }

    onDestroy() {
        cc.log("----guide over----");
    }
}