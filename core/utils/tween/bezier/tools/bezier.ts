import { Curve, CurveState } from "../curve";
import BezierManager from "../bezier-manager";
import { EaseType, Evaluate } from "./ease-type";
import { Node, Vec3, bezier, error, log, tween, v2, v3 } from "cc";
import PromiseUtil from "../../../promise-util";
import { CurveSegment } from "../curve-segment";

/**
 * Bezier 轨道移动库使用说明
 *
 * 主要概念：
 * - CurveSegment：一段贝塞尔曲线，保存控制点、段时长、缓动、重复次数等编辑数据。
 * - Curve：运行时曲线，由多段 CurveSegment 组成，并保存当前运行时间、速度、后退状态。
 * - BezierManager：挂在 Canvas 下的运行时调度器，每帧根据 Curve.curTime 计算节点 position。
 * - Bezier：对外调用入口，业务层通常只需要使用这个类的静态方法。
 *
 * 基础用法：
 * ```ts
 * const bezierCurve = this.node
 *     .getChildByName("Path")
 *     .getChildByName("Node")
 *     .getComponent(BezierCurve);
 *
 * const curve = new Curve(bezierCurve.curveList);
 * Bezier.runBezierAction(this._Pig1, curve, 0, 6);
 * ```
 *
 * 沿曲线后退一小段距离后继续前进：
 * ```ts
 * // 后退 80 像素，后退速度 300 像素/秒，退完自动继续前进。
 * Bezier.back(this._Pig1, 80, 300);
 * ```
 *
 * 调速和暂停：
 * ```ts
 * Bezier.setSpeed(this._Pig1, 0); // 暂停在当前曲线进度
 * Bezier.setSpeed(this._Pig1, 1); // 正常前进
 * Bezier.setSpeed(this._Pig1, 2); // 2 倍速前进
 * ```
 *
 * 坐标系注意：
 * - BezierManager 会直接执行 `target.position = curvePosition`。
 * - 曲线点必须和 target.position 所在父节点坐标系一致。
 * - 如果路径节点和怪物节点不在同一个父节点下，需要先把路径点转换到怪物父节点的本地坐标。
 *
 * 时间注意：
 * - runBezierAction 的 duration 参数会覆盖本次 Curve.totalDuration。
 * - 每段曲线自身的 duration 仍用于计算多段曲线之间的时间占比。
 */

/**
 * 曲线采样点信息。
 *
 * constantMoveTargetsWithCurve 会把曲线离散成很多小段，每个 BVector2 表示：
 * - pos：当前采样点位置。
 * - length：上一个采样点到当前采样点的距离。
 * - lenScale：预留字段，用于记录长度比例，目前运行逻辑没有实际使用。
 */
export class BVector2 {
    public pos: Vec3;
    public length: number; //上一点到当前点的距离
    public lenScale: number;//


    constructor(pos: Vec3, length: number, lenScale: number) {
        this.pos = pos;
        this.length = length;
        this.lenScale = lenScale;
    }
}


/**
 * Bezier 对外门面类。
 *
 * 这个类负责：
 * - 创建简单曲线包装对象。
 * - 将 Curve 注册到 BezierManager 开始播放。
 * - 对运行中的节点执行后退、调速、暂停、恢复等控制。
 *
 * 注意：真正的每帧位置更新在 BezierManager.update() 中完成。
 */
export class Bezier {
    private curveSegment: CurveSegment
    private curve: Curve;
    private next: Bezier;

    public constructor(curve: CurveSegment);
    public constructor(curveList: Curve);
    public constructor(controlPoints: Vec3[], duration: number, ease: EaseType)
    public constructor(param: any, duration: number = 1, ease: EaseType = EaseType.Linear) {
        if (param == null)
            return

        if (typeof param == "object" && param.constructor.name == CurveSegment.name) {
            this.curveSegment = param
        } else if (typeof param == "object" && param.constructor.name == "Array") {
            this.curveSegment = new CurveSegment();
            this.curveSegment.points = param
            this.curveSegment.duration = duration
            this.curveSegment.ease = ease
            // this.curve.smoothness = smoothness
        } else if (typeof param == "object" && param.constructor.name == Curve.name) {
            this.curve = param
        }
    }

    public init(curve: Curve,) {
        this.curve = curve;

    }
    /**
     * 停止当前 Bezier 实例控制的曲线。
     *
     * Stop 状态下 BezierManager 不再推进 curTime。当前实现只改变运行状态，
     * 不会自动从 BezierManager 中移除 target。
     */
    public stop() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.stop()
            }
            if (b.curve) {
                b.curve.state = CurveState.Stop
            }
        })
    }
    /**
     * 暂停当前 Bezier 实例控制的曲线。
     *
     * Pause 和 Stop 都会让 BezierManager 停止推进曲线，保留当前节点位置。
     */
    public pause() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.pause()
            }
            if (b.curve) {
                b.curve.state = CurveState.Pause
            }
        })
    }

    /**
     * 恢复曲线运行。
     */
    public resume() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.resume()
            }
            if (b.curve) {
                b.curve.state = CurveState.Running
            }
        })
    }

    /**
     * 设置旋转偏移角度。
     *
     * 当前方法保留为兼容入口，具体 angleOffset 数据仍由 Curve/CurveSegment 持有。
     */
    public setAngleOffset(angle) {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.resume()
            }
            if (b.curve) {
                // b.curve.resume()
            }
        })
    }

    private foreachBezier(func: (bezier: Bezier) => void) {
        let next: Bezier = this
        while (next != null) {
            func(next)
            next = next.next;
        }
    }

    // --------------------------------------------------------------------------------------------------------------------------------------
    // public static getCurTimePos(points: Vec3[], t: number): Vec3 {
    //     if (!points || points.length == 0) {
    //         return
    //     }
    //     var x = 0, y = 0;
    //     //控制点数组
    //     var n = points.length - 1;
    //     points.forEach((item, index) => {
    //         if (!index) {
    //             x += item.x * Math.pow((1 - t), n - index) * Math.pow(t, index)
    //             y += item.y * Math.pow((1 - t), n - index) * Math.pow(t, index)
    //         } else {
    //             //factorial为阶乘函数
    //             x += Bezier.factorial(n) / Bezier.factorial(index) / Bezier.factorial(n - index) * item.x * Math.pow((1 - t), n - index) * Math.pow(t, index)
    //             y += Bezier.factorial(n) / Bezier.factorial(index) / Bezier.factorial(n - index) * item.y * Math.pow((1 - t), n - index) * Math.pow(t, index)
    //         }
    //     })
    //     return new Vec3(x, y);
    // }
    /**
     * 根据归一化进度获取曲线上的位置。
     *
     * @param points 贝塞尔控制点列表。2 个点表示直线，3 个点表示二阶贝塞尔，4 个点表示三阶贝塞尔。
     * @param time 归一化进度，范围通常为 0 到 1。
     * @returns 曲线在该进度处的位置。内部使用弧长采样加段内插值，直线移动不会出现采样点跳动。
     */
    public static getCurTimePos(points: Vec3[], time: number): Vec3 {
        if (!points || points.length == 0) {
            return;
        }
        if (time <= 0) {
            return points[0].clone();
        }
        if (time >= 1) {
            return points[points.length - 1].clone();
        }

        // 预计算贝塞尔曲线的弧长
        const arcLength = Bezier.calculateArcLength(points);
        const targetLength = time * arcLength;

        // 使用弧长参数化来计算曲线上的点
        let currentLength = 0;
        let previousPoint = points[0];
        for (let i = 1; i <= 100; i++) {
            const u = i / 100;
            const currentPoint = Bezier.calculateBezierPoint(points, u);
            const segmentLength = Vec3.distance(previousPoint, currentPoint);
            const nextLength = currentLength + segmentLength;
            if (nextLength >= targetLength) {
                if (segmentLength <= 0) {
                    return currentPoint;
                }
                const segmentTime = (targetLength - currentLength) / segmentLength;
                return new Vec3(
                    previousPoint.x + (currentPoint.x - previousPoint.x) * segmentTime,
                    previousPoint.y + (currentPoint.y - previousPoint.y) * segmentTime,
                    previousPoint.z + (currentPoint.z - previousPoint.z) * segmentTime
                );
            }
            currentLength = nextLength;
            previousPoint = currentPoint;
        }

        return points[points.length - 1].clone();
    }



    /**
     * 估算控制点对应贝塞尔曲线的弧长。
     *
     * 这里用 100 段采样近似弧长，主要用于让移动速度更接近匀速。
     */
    private static calculateArcLength(points: Vec3[]): number {
        let length = 0;
        let previousPoint = points[0];
        for (let i = 1; i <= 100; i++) {
            const u = i / 100;
            const currentPoint = Bezier.calculateBezierPoint(points, u);
            length += Vec3.distance(previousPoint, currentPoint);
            previousPoint = currentPoint;
        }
        return length;
    }

    /**
     * 按贝塞尔公式计算参数 t 对应的理论点。
     *
     * 这里的 t 是数学参数，不是弧长均匀进度；外部一般不要直接使用。
     */
    private static calculateBezierPoint(points: Vec3[], t: number): Vec3 {
        const n = points.length - 1;
        let x = 0, y = 0, z = 0;
        points.forEach((item, index) => {
            const binomialCoefficient = Bezier.factorial(n) / (Bezier.factorial(index) * Bezier.factorial(n - index));
            const term = binomialCoefficient * Math.pow(1 - t, n - index) * Math.pow(t, index);
            x += item.x * term;
            y += item.y * term;
            z += item.z * term;
        });
        return new Vec3(x, y, z);
    }
    private static factorial(i: number) {
        let n = 1;
        for (let j = 1; j <= i; j++)
            n *= j;
        return n;
    }
    /**
     * 获取曲线点列表
     * @param pointArr 控制点
     * @param duration 持续时间
     * @param ease 缓动
     * @param smoothness 平滑度
     * @returns 
     */
    public static getCurvePointList(pointArr: Vec3[], duration: number, ease: EaseType = EaseType.Linear, smoothness: number = 100): Vec3[] {
        if (!pointArr || pointArr.length == 0) {
            return []
        }
        let points = [];
        let step = duration / smoothness;
        if (step <= 0)
            return points
        // 开始分割曲线
        for (let i = 0; i <= duration; i += step) {
            if (i + step > duration) {
                i = duration
            }
            let pos = this.calculateCurvePos(pointArr, i, duration, ease)
            points.push(pos)
        }
        return points
    }

    /**
     * 按指定时长和缓动计算单段曲线位置。
     *
     * @param pointArr 单段曲线控制点。
     * @param curTime 当前段运行时间。
     * @param duration 当前段总时长。
     * @param ease 缓动类型。
     */
    public static calculateCurvePos(pointArr: Vec3[], curTime: number, duration: number, ease: EaseType): Vec3 {
        let t = Evaluate.calculate(ease, curTime, duration);
        let v3 = Bezier.getCurTimePos(pointArr, t)
        return v3;
    }

    /**
     * 获取曲线列表最后一段的最后一个点。
     *
     * 通常用于动画结束时把节点精确贴到终点。
     */
    public static getLastCurvePos(curveList: CurveSegment[]) {
        let lastCurve = curveList[curveList.length - 1]
        return lastCurve.points[lastCurve.points.length - 1]
    }
    private static getCurrentTimeAndIndex(time: number, totalDuration: number, curveSegments: CurveSegment[]) {
        let timeStep = 0;
        let preTime = 0;

        // 计算每个曲线片段的总持续时间（duration * repeatCount）
        let durationList = curveSegments.map((cs) => {
            return cs.duration * cs.repeatCount;
        });

        // 计算所有曲线片段的总持续时间
        const totalRepeatDuration = durationList.reduce((acc, duration) => acc + duration, 0);

        // 将时间限制在总的重复时间范围内
        // time = time % totalRepeatDuration;

        for (let index = 0; index < curveSegments.length; index++) {
            const segment = curveSegments[index];
            const segmentDuration = segment.duration;
            const segmentTotalDuration = segmentDuration * segment.repeatCount;

            for (let repeatIndex = 0; repeatIndex < segment.repeatCount; repeatIndex++) {
                timeStep += segmentDuration / totalRepeatDuration;
                if (time <= timeStep) {
                    return {
                        time: (time - preTime) / (timeStep - preTime),
                        index: index
                    };
                }
                preTime = timeStep;
            }
        }
        return {
            time: 1,
            index: curveSegments.length - 1
        };
    }
    // private static getCurrentTimeAndIndex(time: number, totalDuration: number, curveSegments: CurveSegment[]) {
    //     let timeStep = 0
    //     let preTime = 0

    //     let durationList = curveSegments.map((cs) => {
    //         return cs.duration;
    //     });

    //     for (let index = 0; index < durationList.length; index++) {
    //         timeStep += durationList[index] / totalDuration
    //         if (time <= timeStep) {
    //             return {
    //                 time: (time - preTime) / (timeStep - preTime),
    //                 index: index
    //             }
    //         }
    //         preTime = timeStep
    //     }
    //     return {
    //         time: 1,
    //         index: durationList.length - 1
    //     };
    // }
    /**
     * 计算多段曲线在某个整体时间上的位置。
     *
     * @param curveSegments 曲线段列表。
     * @param curTime 当前整体运行时间。
     * @param totalDuration 整条曲线总运行时长。
     * @param ease 整体缓动类型。
     * @returns 当前应该设置给 target.position 的坐标。
     */
    public static calculateCurveListPos(curveSegments: CurveSegment[], curTime: number, totalDuration: number, ease: EaseType): Vec3 {
        // 根据easing计算时间。
        let newTime = Evaluate.calculate(ease, curTime, totalDuration);

        let nowData = this.getCurrentTimeAndIndex(newTime, totalDuration, curveSegments)
        let nowCurve = curveSegments[nowData.index]
        // let length = Bezier.bezierLength(nowCurve.points, 1);
        // console.time('bezier')
        // let realTime = Bezier.t2rt_by_baze_length(nowCurve.points, nowCurve.length * nowData.time / totalDuration);
        // console.timeEnd('bezier');
        // log('realTime', realTime, nowData.time);
        let v3 = Bezier.getCurTimePos(nowCurve.points, nowData.time)
        return v3;
    }

    /**
     * 播放一条 Curve。
     *
     * @param target 被移动的节点。BezierManager 会直接写入 target.position。
     * @param curve 运行时曲线对象。
     * @param delayBetweenTwoTarget 兼容旧接口的参数，当前单目标播放逻辑未使用。
     * @param duration 本次运行总时长。传入正数时会覆盖 curve.totalDuration。
     * @param ease 整体缓动类型。
     * @param callBack 曲线播放到终点后的回调。
     * @returns Bezier 控制对象，可调用 pause/resume/stop。
     */
    public static runBezierAction(target: Node, curve: Curve, delayBetweenTwoTarget?: number, duration?: number, ease: EaseType = EaseType.Linear, callBack = () => { }): Bezier {
        if (ease == EaseType.Constant) {
            error('')
        }
        if (duration != null && duration > 0) {
            curve.totalDuration = duration;
        }
        curve.ease = ease;
        curve.completeCallBack = callBack;
        BezierManager.Instant.addCurveList(target, curve)
        return new Bezier(curve);
    }

    /**
     * 让正在沿曲线移动的节点后退一段距离，退完后自动继续前进。
     *
     * @param target 已经通过 runBezierAction 注册到 BezierManager 的节点。
     * @param distance 后退距离，单位是曲线所在坐标系下的像素/坐标单位。
     * @param speed 后退速度，单位是像素/秒。
     */
    public static back(target: Node, distance: number, speed: number = 200) {
        BezierManager.Instant.backCurveList(target, distance, speed);
    }

    /**
     * 查询节点当前是否正在执行一次性后退。
     */
    public static isBacking(target: Node): boolean {
        return BezierManager.Instant.isCurveBacking(target);
    }

    /**
     * 设置曲线运行速度倍率。
     *
     * @param target 已经在曲线上运行的节点。
     * @param speedScale 速度倍率。0 表示暂停，1 表示正常，2 表示二倍速，负数表示持续倒退。
     */
    public static setSpeed(target: Node, speedScale: number) {
        BezierManager.Instant.setCurveSpeed(target, speedScale);
    }

    /**
     * 兼容旧接口：按曲线段队列播放。
     *
     * 内部会把 CurveSegment[] 包装成 Curve，再交给 runBezierAction。
     */
    public static moveQueue(target: Node, curveSegments: CurveSegment[], callBack = () => { }): Bezier {
        let curve = new Curve(curveSegments, EaseType.Linear, callBack);
        return Bezier.runBezierAction(target, curve, 0, curve.totalDuration, curve.ease, callBack);
    }


    //匀速运动bezier曲线，性能不行
    public static getRealTimeByLength(p: Vec3[], length: number) {
        let realTime = 0;
        let rt_length = 0;
        let deltaLength = 0;
        let low = 0, high = 1;
        let deltaTime = 0;
        let i = 0;
        do {
            // 半分
            if (deltaLength > 0) {

                realTime -= (realTime - low) / 2;
                deltaTime = realTime - low;
            }
            else {
                realTime += (high - realTime) / 2;
                deltaTime = high - realTime;
            }

            // 计算弧长差值
            rt_length = this.bezierLength(p, realTime);
            deltaLength = rt_length - length;

            if (deltaLength > 0) high = realTime;
            else low = realTime;

            //Console.WriteLine("realTime: " + realTime + ", rt_length: " + rt_length + ", length: " + length + ", deltaLength: " + deltaLength);

            i++;
        } while (Math.abs(deltaLength) > 1 && deltaTime > 0.00000000000000001);
        // } while (Math.abs(deltaLength) > 1);

        // log('t2rt_by_baze_length', i);
        return realTime;
    }
    public static map = new Map();
    public static bezierLength(points: Vec3[], t: number): number {
        let length = 0;
        let prevPos = points[0];
        let smoothness = 100;

        if (!this.map.get(t)) {
            for (let i = 0; i <= smoothness; i++) {
                if (i / smoothness <= t) {
                    let time = i / smoothness;
                    let pos = Bezier.getCurTimePos(points, time)
                    // 计算两点距离
                    let _length = Math.sqrt(Math.pow(prevPos.x - pos.x, 2) + Math.pow(prevPos.y - pos.y, 2));
                    prevPos = pos;
                    // 累计长度
                    length += _length;
                }
                else break;
            }
            this.map.set(t, length)
        } else {
            length = this.map.get(t);
        }
        return length;
    }

    //#region  匀速运动  

    /**
     * @description 匀速移动节点，每个节点之间的间隔为delayBetweenTwoTarget，总时间为totalDuration，重复次数为repeatTimes
     * @private
     * @static
     * @param {Node[]} targets 目标节点数组
     * @param {Vec3[][]} pointArrays 二维数组，每个数组为一个曲线片段
     * @param {number} delayBetweenTwoTarget 两个目标节点之间的时间间隔。如果为0，则同时移动 
     * @param {number} totalDuration 总时间
     * @param {number} [repeatTimes=1] 重复次数
     * @param {*} [callback=() => { }] 回调
     * @memberof Bezier
     */
    public static async constantMoveTargetsWithPos(targets: Node[], pointArrays: Vec3[][], delayBetweenTwoTarget: number, totalDuration: number, repeatTimes: number = 1, callback = () => { }) {
        if (!targets || !pointArrays || pointArrays.length == 0) {
            return
        }
        let curveSegments = [];
        pointArrays.forEach((pointArr, index) => {
            let curveSegment = new CurveSegment()
            curveSegment.points = pointArr
            curveSegments.push(curveSegment);
        });
        let curve = new Curve(curveSegments, EaseType.Constant, callback);
        curve.totalDuration = totalDuration;
        this.constantMoveTargetsWithCurve(targets, curve, totalDuration, delayBetweenTwoTarget, repeatTimes, callback);
        // let bezier = new Bezier(curveSegment);
        // return bezier;
    }

    /**
     * @description 匀速移动节点，每个节点之间的间隔为delayBetweenTwoTarget，总时间为totalDuration，重复次数为repeatTimes
     *  
     * @private
     * @static
     * @param {Node[]} targets 目标节点数组
     * @param {Curve} curve 曲线对象 
     * @param {*} delayBetweenTwoTarget 两个目标节点之间的时间间隔。如果为0，则同时移动
     * @param {number} totalDuration  总时间
     * @param {number} [repeatTimes=1] 重复次数
     * @param {*} [callback=() => { }] 回调
     * @memberof Bezier
     */
    public static constantMoveTargetsWithCurve(targets: Node[], curve: Curve, delayBetweenTwoTarget, totalDuration: number, repeatTimes: number = 1, callback = () => { }) {
        let totalLen = 0;
        let points: BVector2[] = [];
        curve.curveSegments.forEach((curveSegment, index) => {
            points = points.concat(curveSegment.getPointList());
            if (!points || points.length == 0) return;
            totalLen += curveSegment.length
        });
        let scale = totalDuration / totalLen;
        let delay = 0;

        log("totalLen", totalLen, "totalDuration", totalDuration, "scale", scale, "delay", delay);
        // points[0].length = 0.016 / scale;
        // totalLen += 0.016 / scale
        // log(points[0], points[points.length - 1]);
        // points[points.length - 1].pos = points[0].pos.clone();
        for (let i = 0; i < targets.length; i++) {
            let target = targets[i];
            let arr = [];
            for (let d = 0; d < repeatTimes; ++d) {
                for (let j = 1; j < points.length; j++) {
                    let point = points[j];
                    // points.forEach(point => {
                    //计算当前路段需要的时间
                    let time = point.length * scale;
                    // 创建动作
                    let action = tween().to(time, { position: v3(point.pos.x, point.pos.y, 0) });
                    arr.push(action);
                    // });
                }
            }

            let final = tween().sequence(...arr);
            // final = tween().repeat(repeatTimes, final);
            let t = tween(target).delay(delayBetweenTwoTarget * i).then(final).call(() => {
                callback();
            }).start();
        }
    }

    //#endregion


}




