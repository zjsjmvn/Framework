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
    public totalDuration: number = 0;
    public ease: EaseType
    public completeCallBack: () => void
    public curTime: number = 0
    public state: CurveState;
    public speedScale: number = 1;
    public backRemainDistance: number = 0;
    public backSpeed: number = 0;

    constructor(curveSegments: CurveSegment[], ease: EaseType = EaseType.Linear, callBack = () => { }, target?: Node) {
        this.curveSegments = curveSegments
        curveSegments.forEach((curveSegment) => {
            this.totalDuration += curveSegment.duration * curveSegment.repeatCount;
        });
        console.log("totalDuration", this.totalDuration)
        this.ease = ease
        this.curTime = 0
        this.completeCallBack = callBack
        this.state = CurveState.Running
        this.angleOffset = curveSegments[0]?.angleOffset
    }

    public getTotalLength(): number {
        let totalLength = 0;
        this.curveSegments.forEach(curveSegment => {
            totalLength += curveSegment.length;
        });
        return totalLength;
    }

    public requestBack(distance: number, speed: number = 200) {
        if (distance <= 0 || speed <= 0) {
            return;
        }
        this.backRemainDistance += distance;
        this.backSpeed = speed;
    }

    public isBacking(): boolean {
        return this.backRemainDistance > 0 && this.backSpeed > 0;
    }

    public consumeBackTime(dt: number): number {
        if (!this.isBacking()) {
            return 0;
        }

        let totalLength = this.getTotalLength();
        if (totalLength <= 0 || this.totalDuration <= 0) {
            this.clearBack();
            return 0;
        }

        let distance = Math.min(this.backRemainDistance, this.backSpeed * dt);
        this.backRemainDistance -= distance;
        if (this.backRemainDistance <= 0) {
            this.clearBack();
        }
        return distance / totalLength * this.totalDuration;
    }

    public clearBack() {
        this.backRemainDistance = 0;
        this.backSpeed = 0;
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

        let curve = new Curve(curveSegments, this.ease, this.completeCallBack)

        return curve;
    }
}






