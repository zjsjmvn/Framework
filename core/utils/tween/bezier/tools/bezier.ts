import { Curve, CurveState } from "../curve";
import BezierManager from "../bezier-manager";
import { EaseType, Evaluate } from "./ease-type";
import { Node, Vec3, bezier, error, log, tween, v2, v3 } from "cc";
import PromiseUtil from "../../../promise-util";
import { CurveSegment } from "../curve-segment";

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
     * 停止
     */
    public stop() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.stop()
            }
            if (b.curve) {
                // b.curve.stop()
            }
        })
    }
    /**
     * 暂停
     */
    public pause() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.pause()
            }
            if (b.curve) {
                // b.curve.pause()
            }
        })
    }

    // 恢复
    public resume() {
        this.foreachBezier((b) => {
            if (b.curveSegment) {
                // b.curveSegment.resume()
            }
            if (b.curve) {
                // b.curve.resume()
            }
        })
    }

    // 设置偏移角度
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
    public static getCurTimePos(points: Vec3[], t: number): Vec3 {
        if (!points || points.length == 0) {
            return
        }
        var x = 0, y = 0;
        //控制点数组
        var n = points.length - 1;
        points.forEach((item, index) => {
            if (!index) {
                x += item.x * Math.pow((1 - t), n - index) * Math.pow(t, index)
                y += item.y * Math.pow((1 - t), n - index) * Math.pow(t, index)
            } else {
                //factorial为阶乘函数
                x += Bezier.factorial(n) / Bezier.factorial(index) / Bezier.factorial(n - index) * item.x * Math.pow((1 - t), n - index) * Math.pow(t, index)
                y += Bezier.factorial(n) / Bezier.factorial(index) / Bezier.factorial(n - index) * item.y * Math.pow((1 - t), n - index) * Math.pow(t, index)
            }
        })
        return new Vec3(x, y);
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

    // 计算曲线点
    public static calculateCurvePos(pointArr: Vec3[], curTime: number, duration: number, ease: EaseType): Vec3 {
        let t = Evaluate.calculate(ease, curTime, duration);
        let v3 = Bezier.getCurTimePos(pointArr, t)
        return v3;
    }





    public static getLastCurvePos(curveList: CurveSegment[]) {
        let lastCurve = curveList[curveList.length - 1]
        return lastCurve.points[lastCurve.points.length - 1]
    }
    private static getCurTimeAndIndex(time: number, durationList: number[], totalDuration: number) {
        let timeStep = 0
        let preTime = 0
        for (let index = 0; index < durationList.length; index++) {
            timeStep += durationList[index] / totalDuration
            if (time <= timeStep) {
                return {
                    time: (time - preTime) / (timeStep - preTime),
                    index: index
                }
            }
            preTime = timeStep
        }
        return {
            time: 1,
            index: durationList.length - 1
        };
    }
    // 计算曲线点(曲线列表)
    public static calculateCurveListPos(curveSegments: CurveSegment[], durationList: number[], curTime: number, totalDuration: number, ease: EaseType): Vec3 {
        // 根据easing计算时间。
        let newTime = Evaluate.calculate(ease, curTime, totalDuration);
        let nowData = this.getCurTimeAndIndex(newTime, durationList, totalDuration)
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
     * @description  曲线列表整体以ease缓动移动，共享duration(生命周期)，ease(缓动)。
     * @static
     * @param {Node[]} targets 目标节点
     * @param {number} delayBetweenTwoTarget 两个目标节点之间的时间间隔。如果为0，则同时移动
     * @param {CurveSegment[]} curveList 曲线列表
     * @param {number} duration 生命周期
     * @param {EaseType} [ease=EaseType.Linear] 缓动
     * @param {*} [callBack=() => { }] 回调
     * @return {*}  {Bezier}
     * @memberof Bezier
     */
    public static runBezierAction(target: Node, curve: Curve, delayBetweenTwoTarget?: number, duration?: number, ease: EaseType = EaseType.Linear, callBack = () => { }): Bezier {
        if (ease == EaseType.Constant) {
            error('')
        }
        BezierManager.Instant.addCurveList(target, curve)
        return;
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
    private static async constantMoveTargetsWithPos(targets: Node[], pointArrays: Vec3[][], delayBetweenTwoTarget: number, totalDuration: number, repeatTimes: number = 1, callback = () => { }) {
        if (!targets || !pointArrays || pointArrays.length == 0) {
            return
        }
        let curveSegments = [];
        pointArrays.forEach((pointArr, index) => {
            let curveSegment = new CurveSegment()
            curveSegment.points = pointArr
            curveSegments.push(curveSegment);
        });
        let curve = new Curve(curveSegments, [], totalDuration, EaseType.Constant, callback);
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
    private static constantMoveTargetsWithCurve(targets: Node[], curve: Curve, delayBetweenTwoTarget, totalDuration: number, repeatTimes: number = 1, callback = () => { }) {
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




