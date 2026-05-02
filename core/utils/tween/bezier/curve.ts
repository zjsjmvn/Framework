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
    /** 正在运行，每帧由 BezierManager 推进 curTime。 */
    Running,
    /** 停止状态，保留当前位置和 curTime。 */
    Stop,
    /** 暂停状态，保留当前位置和 curTime。 */
    Pause
}
/**
 * 运行时曲线对象。
 *
 * Curve 是 BezierManager 真正消费的数据结构：
 * - curveSegments 保存编辑器生成的多段曲线。
 * - totalDuration 表示整条路径播放多久。
 * - curTime 表示当前播放到整条路径的哪个时间点。
 * - speedScale 控制前进速度倍率。
 * - backRemainDistance/backSpeed 用于实现沿曲线短距离后退。
 *
 * CurveSegment 更偏编辑数据，Curve 更偏运行状态。
 */
export class Curve {
    /** 上一帧运行位置，用于跟随旋转时计算朝向。 */
    public prevRunPos: Vec3 = Vec3.ZERO;
    private angleOffset: number;

    /** 多段贝塞尔曲线列表，按顺序播放。 */
    public curveSegments: CurveSegment[]
    /** 整条曲线的总运行时长，单位秒。 */
    public totalDuration: number = 0;
    /** 整体缓动类型。 */
    public ease: EaseType
    /** 播放结束回调。 */
    public completeCallBack: () => void
    /** 当前运行时间，范围通常为 0 到 totalDuration。 */
    public curTime: number = 0
    /** 当前运行状态。 */
    public state: CurveState;
    /** 速度倍率。1 正常前进，0 停止推进，负数持续倒退。 */
    public speedScale: number = 1;
    /** 还需要沿曲线后退的距离。单位为曲线坐标系的长度。 */
    public backRemainDistance: number = 0;
    /** 后退速度。单位为曲线坐标系长度/秒。 */
    public backSpeed: number = 0;

    /**
     * @param curveSegments 曲线段列表。
     * @param ease 整体缓动。
     * @param callBack 播放完成回调。
     * @param target 预留参数，当前未使用。
     */
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

    /**
     * 获取整条曲线近似总长度。
     *
     * CurveSegment.length 是懒计算缓存；控制点变化后需要把对应 length 置空，
     * 下次读取时才会重新计算。
     */
    public getTotalLength(): number {
        let totalLength = 0;
        this.curveSegments.forEach(curveSegment => {
            totalLength += curveSegment.length;
        });
        return totalLength;
    }

    /**
     * 请求沿曲线后退一段距离。
     *
     * 多次调用会累加后退距离，例如连续受击时可以不断把怪物往回推。
     */
    public requestBack(distance: number, speed: number = 200) {
        if (distance <= 0 || speed <= 0) {
            return;
        }
        this.backRemainDistance += distance;
        this.backSpeed = speed;
    }

    /**
     * 当前是否处于一次性后退过程。
     */
    public isBacking(): boolean {
        return this.backRemainDistance > 0 && this.backSpeed > 0;
    }

    /**
     * 消耗一帧后退距离，并换算成需要回退的 curTime。
     *
     * @param dt 当前帧间隔，单位秒。
     * @returns 本帧需要从 curTime 中减掉的时间量。
     */
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

    /**
     * 清空一次性后退状态。
     */
    public clearBack() {
        this.backRemainDistance = 0;
        this.backSpeed = 0;
    }



    /**
     * 是否需要根据路径方向旋转节点。
     */
    public isFollowRotate(): boolean {
        return this.angleOffset != null
    }

    /**
     * 根据上一帧位置和当前位置计算节点应该朝向的角度。
     */
    public getAngle(pos: Vec3) {
        let fmPos = this.prevRunPos;
        let toPos = pos;
        let dir: Vec3 = Vec3.ZERO;
        dir = toPos.subtract(fmPos);

        let radians = v2(Vec3.RIGHT.x, Vec3.RIGHT.y).signAngle(v2(dir.x, dir.y))
        let angle = misc.radiansToDegrees(radians) - this.angleOffset
        return angle;
    }
    /**
     * 克隆运行时曲线。
     *
     * 曲线段会深拷贝，运行状态重新从起点开始。
     */
    public clone(): Curve {

        let curveSegments: CurveSegment[] = []
        this.curveSegments.forEach((curveSegment) => {
            curveSegments.push(curveSegment.clone())
        });

        let curve = new Curve(curveSegments, this.ease, this.completeCallBack)

        return curve;
    }
}






