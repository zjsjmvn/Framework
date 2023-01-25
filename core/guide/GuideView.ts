import { GuideHelper } from "./GuideHelper";
import { GuideStep } from "./GuideStep";
import { Vec2, _decorator, log, v2, Rect, UIOpacity, v3, UITransform, Node, Vec3, tween, Tween, TweenAction, utils, RichText } from 'cc';
import Thor from '../ui/ui-killer/Thor';

const { ccclass, property } = _decorator;
@ccclass
export class GuideView extends Thor {

    _index = 0;                                     //引导序号
    _finger: Node = null;                                 //手型精灵 通过thor赋值 直接使用
    _clipper = null;                                //遮罩层 通过thor赋值 直接使用

    _text: Node = null;
    _textBg: Node = null;
    _textLabel: Node = null;
    onLoad() {


        this._finger = this.node.getChildByName('finger');

        // 测试

        // setTimeout(() => {


        //     // this.fingerToNode([this.node.getChildByName('Node1')], { showMask: false, repeatAction: true, fingerPosOffset: v2(1, 1) });
        //     this._fingerToPointArrayAndBackAction([this.node.getChildByName('Node1').getPosition(), this.node.getChildByName('Node2').getPosition(), this.node.getChildByName('Node3').getPosition()], 500, true)
        // }, 1000);


        // async.eachSeries([]);
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
    fingerToNode(locateNodes: Array<Node>, step: GuideStep, assignedAction = null) {
        if (locateNodes.length > 0) {
            let locateNode: Node = locateNodes[0];
            let rect = locateNode.getComponent(UITransform).getBoundingBoxToWorld();
            let nodePos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(rect.x, rect.y));
            rect.x = nodePos.x;
            rect.y = nodePos.y;
            if (assignedAction) {
                this._finger.active = false;
                assignedAction(this.node, v2(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5));
            } else {
                this._fingerToPointAction(v3(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5), step.repeatAction, step.fingerPosOffset);
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
    fingerToNodeArray(locateNodes: Array<Node>, step: GuideStep, isMoveBackAndForth = false) {
        log('fingerToNodeArray');
        let locateNode: Node = locateNodes[0];
        let targetNode = locateNodes[1];
        let rect = locateNode.getComponent(UITransform).getBoundingBoxToWorld();
        let nodePos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(rect.x, rect.y));
        rect.x = nodePos.x;
        rect.y = nodePos.y;
        rect = rect;
        let points = [];
        for (let i in locateNodes) {
            let _point = locateNodes[i].getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO);
            points.push(this.node.getComponent(UITransform).convertToNodeSpaceAR(_point));
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
    _fingerToPointAction(point: Vec3, isAnimation, posOffset?: Vec3) {
        log('point', point.toString());
        Tween.stopAllByTarget(this._finger);
        this._finger.setScale(v3(1, 1, 1));
        if (!!posOffset) {
            point = point.add(posOffset);
        }
        this._finger.setPosition(v3(point.x, point.y));
        this._finger.active = true;
        this._finger.getComponent(UIOpacity).opacity = 255;
        let moveTime = 0;

        if (point && isAnimation) {
            let width = this._finger.position.x - point.x;
            let height = this._finger.position.y - point.y;
            let length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            moveTime = length / (width * 1);
            tween(this._finger).to(moveTime, { position: v3(point.x, point.y) }).call(() => {
                tween(this._finger).to(0.3, { scale: v3(1.3, 1.3, 1.3) }).to(0.3, { scale: v3(1, 1, 1) }).union().repeatForever().start();
            }).start();
        } else if (point) {
            this._finger.setPosition(v3(point.x, point.y));
        }
    }

    /**
     * 手型精灵依次在多个座标点中移动
     * @param pointArray
     * @param isRepeat
     */
    async _fingerToPointArrayAction(pointArray: Array<Vec3>, fingerMoveSpeed, isRepeat) {
        let array = [];
        let firstPoint = pointArray.shift();
        let point = firstPoint;
        this._finger.setPosition(firstPoint);
        // this._finger.stopAllActions();
        Tween.stopAllByTarget(this._finger);
        this._finger.active = true;
        //按照speed去运动
        pointArray.forEach((pt, index) => {
            let dis = point.clone().subtract(pt).length();
            let time = dis / fingerMoveSpeed;
            point = pt;
            let moveTo = tween(this._finger).to(time, { position: pt });
            array.push(moveTo);
        });

        // // //延时1秒
        let delay = tween(this._finger).delay(0.5).call(() => {
            this._finger.setPosition(firstPoint);
        });
        array.push(delay);

        let action = tween(this._finger).sequence(...array);
        if (isRepeat) {
            action = tween(this._finger).repeatForever(action);
        }
        tween(this._finger).then(action).start();
    }
    /**
     * 手型精灵依次在多个座标点中移动,正序播放之后在倒叙播放
     * @param pointArray
     * @param isRepeat
     */
    _fingerToPointArrayAndBackAction(pointArray: Array<Vec3>, fingerMoveSpeed, isRepeat) {
        let arr = JSON.parse(JSON.stringify(pointArray));
        this._finger.setPosition(arr[0]);
        Tween.stopAllByTarget(this._finger);
        this._finger.active = true;
        //先正向移动
        let actions = [];
        for (let i = 1; i < arr.length; ++i) {
            let dis = v2(arr[i - 1]).subtract(arr[i]).length();
            let time = dis / fingerMoveSpeed;
            let moveAction = tween(this._finger).to(time, { position: arr[i] });
            actions.push(moveAction);
        }
        //反向移动
        for (let i = arr.length - 2; i >= 0; --i) {
            let dis = v2(arr[i + 1]).subtract(arr[i]).length();
            let time = dis / fingerMoveSpeed;
            let moveAction = tween().to(time, { position: arr[i] });
            actions.push(moveAction);
        }
        let totalAction = tween().sequence(...actions);
        if (isRepeat) {
            totalAction = tween().repeatForever(totalAction);
        }
        // this._finger.runAction(totalAction);
        tween(this._finger).then(totalAction).start();

    }


    /**
     * 停止手型提示
     * @param visible
     */
    stopFingerAction(visible = false) {
        // this._finger.stopAllActions();
        Tween.stopAllByTarget(this._finger);
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
    showMask(rect: Rect) {
        this._clipper.active = true;
        this._clipper.setContentSize(rect.width, rect.height);
        this._clipper.setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);
    }

    /**
     * 显示文字提示
     * @param textHint
     * @private
     */
    _showDescriptionTextHint(step: GuideStep) {
        if (step.hintText.length === 0) {
            this._closeTextHint();
            return;
        }
        if (!step.hintText) {
            log('setDescriptTextHint', step.hintText);
            this._text.active = false;
            return;
        }

        if (!!step.customTextAction) {
            step.customTextAction(this._text);
        }
        // this._textBg.scaleX = Math.abs(this._textBg.scaleX);
        // if (step.textBgFlip) {
        //     this._textBg.scaleX *= -1;
        // }
        this._text.active = true;
        this._textLabel.getComponent(RichText).string = step.hintText;
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
        log('_showCompleteTextHint', step.completeText)
        this._textLabel.getComponent(RichText).string = step.completeText;
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
        log("----guide over----");
    }
}