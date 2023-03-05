import Thor from "../UI/UIKiller/Thor";
import { GuideHelper } from "./GuideHelper";
import { GuideView } from "./GuideView";
import { GuideStep, GuideStepType_TouchTimes, GuideStepType_LongTouch, GuideStepType_DragToDistance, GuideStepType_MoveAmongMultipleNodes, GuideStepType_DragToTarget, GuideStepType_DirectRun } from './GuideStep';
let async = require("async");
const { ccclass, property } = cc._decorator;


@ccclass
export class GuideController extends Thor {
    _guideConfig: GuideHelper.GuideConfig = null;
    _target: cc.Node = null;
    _touchMoveIndex: number = 0;                            //触摸移动下标
    _locateNodes: cc.Node[] = null;                         //定位节点、、
    _guideView: GuideView = null;
    _exitCallback: Function = null;
    _currentStep: GuideStep = null;
    private progressIndex: number = -1;


    start() {
        this.init();
    }

    init() {
        this._processTasks();
    }

    private _processTasks() {
        //加载进度
        this._loadProgress();
        //初始化任务队列
        let steps = this._initSteps();
        //任务组
        async.eachSeries(steps, this._stepHandler.bind(this), (err) => {
            if (!!err) {
                cc.log('eachSeries err', err);
            }
            this._exitGuide();
        });
    }
    private _initSteps() {
        //分析任务
        let steps = [];
        for (let i = 0; i < this._guideConfig.task.length; ++i) {
            if (this._guideConfig.task[i]) {
                if (i > this.progressIndex) {
                    this._guideConfig.task[i].index = i;
                    steps.push(this._guideConfig.task[i]);
                } else {
                    this._guideConfig.task[i].onStepExit(this.node, null);
                }
            }
        }
        return steps;
    }
    private _stepHandler(step: GuideStep, callback: (err) => {}) {
        this._currentStep = step;
        let stepBegin = (cb) => {
            if (step.onStepEnter) {
                // cc.log('onStepEnter', cb);
                step.onStepEnter(this.node, cb);
            } else {
                cb();
            }
        };

        let stepProcess = (cb) => {
            if (step.onProcessDelayTime) {
                setTimeout(() => {
                    this._processStep(step, cb);
                }, step.onProcessDelayTime);
            } else {
                this._processStep(step, cb);
            }
        };

        let stepEnd = () => {
            this._guideView.hideMask();
            this._saveProgress(step.index);
            if (step.onStepExit) {
                step.onStepExit(this.node, callback);
            } else {
                callback(null);
            }
        }
        async.series({ stepBegin, stepProcess, stepEnd });
    };

    private _processStep(step: GuideStep, cb) {
        cc.log("guide: <" + step.log + ", step begin >");

        if (step.log.length !== 0 && step.debug) {
            cc.log("guide: <" + step.log + ", step begin >");
        }

        step.finishCallback = () => {
            cc.log("finishedStageIndex finish");
            step.finishCallback = null;
            this._guideView.stopFingerAction();
            this._guideView._showCompleteTextHint(step);
            if (step.log.length !== 0 && step.debug) {
                cc.log("guide: <" + step.log + ", step finished >");
            }
            if (step.finishDelayTime) {
                setTimeout(() => {
                    this._guideView._closeTextHint();
                    cb();
                }, step.finishDelayTime);
            } else {
                this._guideView._closeTextHint();
                cb();
            }
        };


        this._locateNodes = GuideHelper.Locator.locateNode(this._target, step.locateNodesName);
        step.onLocateNodes(this._locateNodes);
        if (!!step.customTextAction) {

        }
        if (!!step.customFingerAction) {

        }
        if (step instanceof GuideStepType_TouchTimes) {
            if (step.showFinger)
                this._guideView.fingerToNode(this._locateNodes, step, step.customFingerAction);
        } else if (step instanceof GuideStepType_LongTouch) {

        } else if (step instanceof GuideStepType_DragToDistance) {

        } else if (step instanceof GuideStepType_MoveAmongMultipleNodes) {
            if (step.showFinger)
                this._guideView.fingerToNodeArray(this._locateNodes, step, step.isMoveBackAndForth);
        } else if (step instanceof GuideStepType_DragToTarget) {
            if (step.showFinger) {
                let targetNode = GuideHelper.Locator.locateNode(this._target, [step.targetName]);
                this._locateNodes.push(targetNode[0]);
                this._guideView.fingerToNodeArray(this._locateNodes, step);
            }
        } else if (step instanceof GuideStepType_DirectRun) {
            step.onStepFinished(this.node);
        }
        else {
            throw Error("GuideController 没有该类型的判断，请主动添加");
        }


        this._guideView._showDescriptTextHint(step);
    }

    /**
     * 触摸事件，检查定位区
     * @param touch
     * @returns {boolean}
     */
    _onTouchStart(event) {
        if (!!!this._locateNodes) return false;
        if (this._locateNodes && this._locateNodes.length <= 0) return false;

        let rect = this._locateNodes[0].getBoundingBoxToWorld();
        let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
        rect.x = nodePos.x;
        rect.y = nodePos.y;
        let point = this.node.convertToNodeSpaceAR(event.getLocation());

        let isContains = rect.contains(point);
        if (isContains) {
            //cc.log("Right~.点击位置包含引导按钮");
            if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.LONG) {
                let step = <GuideStepType_LongTouch>this._currentStep;

                clearTimeout(step._touchLongTimer)
                //  cc.log('_touchLongTimer');
                step._touchLongTimer = setTimeout(() => {
                    //准备触发touchLong事件
                    step.onStepFinished(this.node);
                    step._touchLongTimer = null;
                    //        cc.log('_touchLongTimer');
                }, step.touchLongTimeLength || 1000);
            }
            if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.START) {
                this._currentStep.onStepFinished(this.node);

            }
        }
        return !isContains;
    }

    _onTouchMove(event) {
        //设置点击位置显示
        let point = this.node.convertToNodeSpaceAR(event.getLocation());

        if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.MOVE && this._currentStep instanceof GuideStepType_DragToDistance) {
            let dis = cc.v2(event.getLocation()).sub(event.getStartLocation()).mag();
            if (dis >= this._currentStep.touchMoveDis) {
                this._currentStep.onStepFinished(this.node);
                return true;
            }
            return false;
        }

        if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.MOVE) {
            //如果触摸的位置是结束的位置，那么就执行回调函数。
            let rect = this._locateNodes[this._locateNodes.length - 1].getBoundingBoxToWorld();
            let nodePos = this.node.convertToNodeSpaceAR(cc.v2(rect.x, rect.y));
            rect.x = nodePos.x;
            rect.y = nodePos.y;
            let isContains = rect.contains(point);
            if (isContains) {
                this._currentStep.onStepFinished(this.node);
                return false;
            }
        }

        // if(this._touchMoveIndex<this._locateNodes.length){
        //     let node  = this._locateNodes[this._touchMoveIndex];
        //     let targetNode_rect = node.getBoundingBoxToWorld();
        //     let nodePos = this.node.convertToNodeSpaceAR(cc.v2(targetNode_rect.x,targetNode_rect.y));
        //     targetNode_rect.x = nodePos.x;
        //     targetNode_rect.y = nodePos.y;
        //     let isContains = cc.rectContainsPoint(targetNode_rect, point);
        //     if (!isContains){
        //         cc.log('移动的不对');
        //     }
        // }
        return false;
    }

    /**
     * @description     
     * return true 不穿透 
     * return false 表示触摸穿透
     * @param {*} event
     * @returns 
     * @memberof GuideController
     */
    _onTouchEnd(event) {
        cc.log('_onTouchEnd');
        // if (this._currentStep.listenTouchEventType&&this._currentStep.listenTouchEventType !== cc.Node.EventType.TOUCH_END){
        //     // this._processTasks()
        //     return true
        // }
        if (!!!this._currentStep) return false;
        if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.LONG && this._currentStep instanceof GuideStepType_LongTouch) {
            // if (this._currentStep._touchLongTimer){
            clearTimeout(this._currentStep._touchLongTimer);
            this._currentStep.onStepFail(this.node, null);
            return true;
            // }
        } else if (this._currentStep.listenTouchEventType === GuideHelper.TouchEvent.END) {
            let point = this.node.convertToNodeSpaceAR(event.getLocation());
            let targetNode_side_offset: cc.Rect = new cc.Rect(0, 0, 0, 0);

            if (this._currentStep instanceof GuideStepType_DragToTarget) {
                targetNode_side_offset = this._currentStep.targetSizeOffset;
            }
            if (this._locateNodes.length === 0) return false;
            let targetNode_rect = this._locateNodes[this._locateNodes.length - 1].getBoundingBoxToWorld();
            targetNode_rect.width += targetNode_side_offset.width;
            targetNode_rect.height += targetNode_side_offset.height;
            targetNode_rect.x -= targetNode_side_offset.width / 2;
            targetNode_rect.y -= targetNode_side_offset.height / 2;



            let nodePos = this.node.convertToNodeSpaceAR(cc.v2(targetNode_rect.x, targetNode_rect.y));
            targetNode_rect.x = nodePos.x;
            targetNode_rect.y = nodePos.y;

            let isContains = targetNode_rect.contains(point);
            if (isContains) {
                // cc.log('touchend 拖拽成功。');
                if (this._currentStep.onStepFinishVerify(this.node) === false) {
                    cc.log('校验失败。')
                    return true;
                } else {
                    let step = <any>this._currentStep;
                    if (!!step.touchTimes) {
                        step.touchTimes--;
                        if (step.touchTimes > 0) return false;

                    }
                    this._currentStep.onStepFinished(this.node);
                    return false;
                }
            } else {
                cc.log("touchend point is not contains in targetNode_rect", this._locateNodes[0].name);
                this._currentStep.onStepFail(this.node, null);
                return true;
            }
        }
    }


    private _exitGuide() {
        this.node.destroy();
        if (!!this._exitCallback) {
            this._exitCallback();
        }
    }

    private _saveProgress(index, cb?) {
        cc.log("_saveProgress", index);
        // cc.sys.localStorage.setItem(this._guideConfig.guideName, index);
        // if (cb) {
        //     cb();
        // }
    }

    /**
     * // TODO:引导存档的问题还是需要仔细考虑
     * @description 
     * @private
     * @memberof GuideController
     */
    private _loadProgress() {
        return;
        var localStorage = localStorage || cc.sys.localStorage;
        if (!!!localStorage.getItem(this._guideConfig.guideName)) {
            this.progressIndex = - 1;
        } else {
            this.progressIndex = parseInt(localStorage.getItem(this._guideConfig.guideName));
        }
        cc.log("_loadProgress", this.progressIndex);
        // TODo

        // this.progressIndex = -1

    }
}
