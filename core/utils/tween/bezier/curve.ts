import { CCFloat, Color, Enum, Graphics, Layers, Node, Tween, TweenSystem, Vec2, Vec3, _decorator, game, log, misc, v2, v3 } from 'cc';
import { BezierCurve, State } from './bezier-curve';
import BezierManager from './bezier-manager';
import CurvePoint from './curve-point';
import Point from './curve-point';
import { Bezier, BVector2 } from './tools/bezier';
import { EaseType, Evaluate } from './tools/ease-type';
import { CurveSegment } from './curve-segment';
const { ccclass, property, executeInEditMode, inspector, menu } = _decorator;

export enum CurveState {
    Running,
    Stop,
    Pause
}
/**
 * @description 一个曲线，由多个曲线片段组成
 * @export
 * @class Curve
 * @implements {CurveAction}
 */
export class Curve {
    public prevRunPos: Vec3 = Vec3.ZERO;
    private angleOffset: number;

    public curveSegments: CurveSegment[]
    public timeList: number[]
    public duration: number
    public ease: EaseType
    public completeCallBack: () => void
    public curTime: number = 0
    public state: CurveState;

    constructor(curveSegments: CurveSegment[], timeList: number[], duration: number, ease: EaseType = EaseType.Linear, callBack = () => { }, target?: Node) {
        this.curveSegments = curveSegments
        this.timeList = timeList
        this.duration = duration
        this.ease = ease
        this.curTime = 0
        this.completeCallBack = callBack
        this.state = CurveState.Running
        this.angleOffset = curveSegments[0]?.angleOffset
    }



    // 是否跟随旋转
    public isFollowRotate(): boolean {
        return this.angleOffset != null
    }

    // 获取当前位置的旋转角度
    public getAngle(pos: Vec3) {
        let fmPos = this.prevRunPos;
        let toPos = pos;
        let dir: Vec3 = Vec3.ZERO;
        dir = toPos.subtract(fmPos);

        let radians = v2(Vec3.RIGHT.x, Vec3.RIGHT.y).signAngle(v2(dir.x, dir.y))
        let angle = misc.radiansToDegrees(radians) - this.angleOffset
        return angle;
    }
    public clone(): Curve {

        let curveSegments: CurveSegment[] = []
        this.curveSegments.forEach((curveSegment) => {
            curveSegments.push(curveSegment.clone())
        });

        let curve = new Curve(curveSegments, [...this.timeList], this.duration, this.ease, this.completeCallBack)

        return curve;
    }
}






