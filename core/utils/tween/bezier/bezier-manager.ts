// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Component, Node, _decorator, game, log, settings } from 'cc';
import { CurveState, Curve } from "./curve";
import { Bezier } from "./tools/bezier";
import { EaseType, Evaluate } from "./tools/ease-type";
import NodeUtil from '../../node-util';
import { CurveSegment } from './curve-segment';
import { director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
/**
 * Bezier 运行时调度器。
 *
 * 该组件会自动创建在 Canvas 下，业务层不需要手动挂载。
 * runBezierAction 会把 target 和 Curve 注册到这里，随后 update(dt) 每帧根据 Curve.curTime
 * 计算曲线位置并写入 target.position。
 */
export default class BezierManager extends Component {

    private static instance: BezierManager;
    /** 全局单例。首次访问时会在当前场景 Canvas 下创建 BezierManager 节点。 */
    public static get Instant(): BezierManager {
        if (this.instance == null) {
            let node = new Node("BezierManager")
            let uiRoot = director.getScene().getChildByName('Canvas');

            uiRoot.addChild(node);
            this.instance = node.addComponent(BezierManager);
            return this.instance
        } else {
            return this.instance
        }
    }

    private static node: Node = null;


    static setNode(node: Node) {
        this.node = node;
    }

    // 曲线片段列表，用来执行简单的贝塞尔曲线 没必要。。。。

    private curveSegmentList: Map<Node, CurveSegment> = new Map();
    public addCurveSegment(target: Node, curveSegment: CurveSegment) {
        if (this.curveSegmentList.has(target)) {
            this.curveSegmentList.delete(target)
        }
        this.curveSegmentList.set(target, curveSegment)
    }
    public removeCurveSegment(target: Node) {
        this.curveSegmentList.delete(target)
    }


    // 曲线列表，复杂贝塞尔曲线，曲线由多个曲线片段组成。
    private curveList: Map<Node, Curve> = new Map();

    /**
     * 注册一条运行时曲线。
     *
     * 同一个 target 同时只能运行一条 Curve；重复注册会替换旧曲线。
     */
    public addCurveList(target: Node, curve: Curve) {
        if (this.curveList.has(target)) {
            this.curveList.delete(target)
        }
        this.curveList.set(target, curve)
    }
    /**
     * 移除 target 当前运行的曲线。
     */
    public removeCurveList(target: Node) {
        this.curveList.delete(target)
    }

    /**
     * 请求 target 沿当前曲线后退一段距离。
     *
     * 这里只写入 Curve 的后退状态，真正移动在 update(dt) 中逐帧完成。
     */
    public backCurveList(target: Node, distance: number, speed: number = 200) {
        let curve = this.curveList.get(target);
        if (!curve) {
            return
        }
        curve.requestBack(distance, speed);
    }

    /**
     * 设置 target 当前曲线的速度倍率。
     */
    public setCurveSpeed(target: Node, speedScale: number) {
        let curve = this.curveList.get(target);
        if (!curve) {
            return
        }
        curve.speedScale = speedScale;
    }

    /**
     * 每帧推进所有运行中的曲线。
     *
     * 正常状态：curTime += dt * speedScale。
     * 一次性后退状态：根据 backSpeed 消耗 backRemainDistance，再把距离换算为 curTime 的减少量。
     * 到达终点：设置到最后一个控制点，移除运行曲线，触发完成回调。
     */
    update(dt) {
        // this.curveSegmentList.forEach((curve, target) => {
        //     if (target.isValid && curve) {
        //         if (curve.state == CurveState.Running) {
        //             curve.curTime += dt;
        //             // 最后一帧
        //             if (curve.curTime >= curve.duration) {
        //                 target.position = curve.points[curve.points.length - 1];
        //                 this.removeCurve(target);
        //                 curve.completeCallBack()
        //             } else {
        //                 let pos = Bezier.calculateCurvePos(curve.points, curve.curTime, curve.duration, curve.ease);
        //                 target.position = pos;
        //             }
        //             // 跟随旋转
        //             if (curve.isFollowRotate()) {
        //                 let angle = curve.getAngle(target.position);
        //                 target.angle = angle
        //             }
        //             curve.prevRunPos = target.position
        //         }
        //     } else {
        //         this.removeCurve(target);
        //     }
        // });

        this.curveList.forEach((curve, target) => {
            if (target.isValid && curve) {
                if (curve.state == CurveState.Running) {
                    if (curve.isBacking()) {
                        curve.curTime -= curve.consumeBackTime(dt);
                    } else {
                        curve.curTime += dt * curve.speedScale;
                    }
                    if (curve.curTime <= 0) {
                        curve.curTime = 0;
                        curve.clearBack();
                    }
                    // 小于零部分是延迟执行
                    if (curve.curTime >= 0) {
                        // 最后一帧
                        if (curve.curTime >= curve.totalDuration) {
                            curve.curTime = curve.totalDuration;
                            target.position = Bezier.getLastCurvePos(curve.curveSegments)
                            this.removeCurveList(target);
                            log('delete');
                            curve.completeCallBack()
                        } else {
                            // console.time('bezier');

                            let pos = Bezier.calculateCurveListPos(curve.curveSegments, curve.curTime, curve.totalDuration, curve.ease);
                            // console.timeEnd('bezier');
                            target.position = pos
                        }
                        // 跟随旋转
                        if (curve.isFollowRotate()) {
                            let angle = curve.getAngle(target.position);
                            target.angle = angle
                        }
                        curve.prevRunPos = target.position
                    }

                }
            } else {
                log('delete');

                this.removeCurveList(target);
            }
        })
    }
}

// setInterval(() => {
//     setTimeout(() => {

//         log(Date.now());
//     }, 1);
// }, 1)
