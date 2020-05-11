import { GuideHelper } from "./GuideHelper";
import { GuideView } from "./GuideView";

export interface IGuideStep {
    /**
     * 
     * @param guideRoot 
     * @param callback 
     * 
     * 配置文件步骤开始执行的回调
     */
    onStepEnter(guideNode: cc.Node, callback);

    /**
     * 
     * @param guideRoot 
     * @param callback 
     * 配置文件步骤执行失败的回调
     */
    onStepFail(guideNode: cc.Node, callback);

    /**
    * 
    * @param nodes 
    * 定位到步骤的定位点的回调。
    */
    onLocateNodes(nodes: cc.Node[])

    /**
    * 
    * @param guideRoot 
    * @param callback 
    * 步骤开始处理时的回调
    */
    onStepProcess(guideNode: cc.Node, callback)

    /**
    * 
    * @param guideRoot 步骤完成验证。验证是否成功
    */
    onStepFinishVerify(guideNode: cc.Node): boolean

    /**
     * 
     * @param guideRoot 
     * 步骤成功的回调
     */
    onStepFinished(guideNode: cc.Node);


    /**
     * 
     * @param guideRoot 
     * @param callback 
     * 步骤退出时的回调
     */
    onStepExit(guideNode: cc.Node, callback)


}

export class GuideStep implements IGuideStep {
    // for user
    public index: number = 0                                    // 用于存档，不对外使用
    public log: string = ''                                     //log
    public debug: boolean = true;                               //
    public locateNodesName: string[] = [];                          //定位节点。
    public showMask: boolean = true;                           //是否显示遮罩
    public showFinger: boolean = true;                         //是否显示手指
    public showText: boolean = true;                            //是否显示文字提示
    public hintText: string = "";                               //提示文本
    public completeText: string = "";                           //完成文本
    public listenTouchEventType: GuideHelper.TouchEvent;        //监听的触摸事件，比如touchmove。只有触摸了touchmove才算完成任务
    public onProcessDelayTime: number = 0;                      //处理之前延时多久
    public finishDelayTime: number = 0;                         //延时多久结束
    public fingerMoveSpeed: number = 500;                         //手指动画移动速度
    public repeatAction = true;                                 //手指动画是否repeat
    public textPos: cc.Vec2 = cc.v2(0, 0);                      //文本位置
    public fingerPosOffset: cc.Vec2 = cc.v2(0, 0);
    public customFingerAction = null;                           //自定义引导动画
    public customTextAction = null;
    public finishCallback = null;                               // 完成时主动调用 结束当前step




    /**
     * @description 当step enter时调用。 子类需要在执行完调用super.onSterEnter(node,cb);
     * @param {cc.Node} guideNode
     * @param {Function} [callback]
     * @memberof GuideStep
     */
    public onStepEnter(guideNode: cc.Node, callback?: Function) {
        if (!!callback) {
            callback();
        }
    }

    /**
     * @description 子类需要在执行完调用
     * @param {cc.Node} guideNode
     * @param {Function} [callback]
     * @memberof GuideStep
     */
    public onStepFail(guideNode: cc.Node, callback?: Function) {
        if (!!callback) {
            callback();
        }



    }


    public onLocateNodes(nodes: cc.Node[]) {
    }

    public onStepProcess(guideNode: cc.Node, callback?: Function) {
        if (!!callback) {
            callback(null);
        }

    }

    /**
     * @description 当引导结束时调用，适合直接控制节点状态，如active opacity等.子类需要在执行完调用。
     * @param {cc.Node} guideNode
     * @param {Function} [callback]
     * @memberof GuideStep
     */
    public onStepExit(guideNode: cc.Node, callback?: Function) {
        if (!!callback) {
            callback(null);
        }

    }

    public onStepFinishVerify(guideNode: cc.Node): boolean {
        return true;
    }

    /**
     * @description 子类需要在执行完调用，适合做一些动画
     * @param {cc.Node} guideNode
     * @memberof GuideStep
     */
    public onStepFinished(guideNode: cc.Node) {
        if (!!this.finishCallback) {
            this.finishCallback();
        }
    }

}
/**
 * 触摸次数类型引导步骤
 */
export class GuideStepType_TouchTimes extends GuideStep {
    public touchTimes: number = 1;                            //触摸事件次数，比如点击按钮三次。
}
/**
 * 长按类型
 */
export class GuideStepType_LongTouch extends GuideStep {
    public touchTimes: number = 1;                            //长按次数
    public touchLongTimeLength: number = 0;                   //触摸时间长度
    public _touchLongTimer = null;                            //controller中需要使用的。

}

/**
 * 拖拽类型引导
 */
export class GuideStepType_DragToDistance extends GuideStep {
    public touchMoveDis: number = 0;

}

/**
 * 拖拽类型引导
 */
export class GuideStepType_DragToTarget extends GuideStep {
    public targetName: string = null;
    public targetSizeOffset: cc.Rect = null;

}
/**
 * 多个节点之间移动类型，如从A节点滑动到B节点在滑动到C节点
 */
export class GuideStepType_MoveAmongMultipleNodes extends GuideStep {

    /**
     * @description 是否来回移动
     * @type {boolean}
     * @memberof GuideStepType_MoveAmongMultipleNodes
     */
    public isMoveBackAndForth: boolean = false;
}

/**
 * UI动画类型引导步骤。比如在两个引导step之间有一个过渡动画，并且需要动画完成。
 */
export class GuideStepType_UIAction extends GuideStep {

}

