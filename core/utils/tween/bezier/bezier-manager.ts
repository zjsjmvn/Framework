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
const { ccclass, property } = _decorator;

@ccclass
export default class BezierManager extends Component {

    private static instance: BezierManager;
    public static get Instant(): BezierManager {
        if (this.instance == null) {
            let node = new Node("BezierManager")
            this.node.addChild(node);
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


    // 曲线列表，复杂贝塞尔曲线，曲线由多个曲线片段组成
    private curveList: Map<Node, Curve> = new Map();
    public addCurveList(target: Node, curve: Curve) {
        if (this.curveList.has(target)) {
            this.curveList.delete(target)
        }
        this.curveList.set(target, curve)
    }
    public removeCurveList(target: Node) {
        this.curveList.delete(target)
    }


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
                    curve.curTime += 0.01;
                    // 小于零部分是延迟执行
                    if (curve.curTime > 0) {
                        // 最后一帧
                        if (curve.curTime >= curve.duration) {
                            target.position = Bezier.getLastCurvePos(curve.curveSegments)
                            this.removeCurveList(target);
                            log('delete');
                            curve.completeCallBack()
                        } else {
                            // console.time('bezier');

                            let pos = Bezier.calculateCurveListPos(curve.curveSegments, curve.timeList, curve.curTime, curve.duration, curve.ease);
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
