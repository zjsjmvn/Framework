import { CCFloat, Color, Enum, Graphics, Layers, Node, Vec3, _decorator, log, misc, v2, v3 } from "cc";
import { BVector2, Bezier } from "./tools/bezier";
import { EaseType, Evaluate } from "./tools/ease-type";
import { CurveState } from "./curve";
import { BezierCurve } from "./bezier-curve";
import CurvePoint from "./curve-point";
const { ccclass, property, executeInEditMode, inspector, menu } = _decorator;

/**
 * 单段贝塞尔曲线数据。
 *
 * CurveSegment 同时承担两类职责：
 * - 编辑器数据：控制点、控制点节点、绘制线条、颜色、宽度等。
 * - 运行数据：段 duration、ease、repeatCount、length 等。
 *
 * 多个 CurveSegment 会组成一个 Curve，最终由 BezierManager 按顺序播放。
 */
@ccclass('CurveSegment')
export class CurveSegment {

    /** 上一帧运行位置。旧单段曲线运行逻辑预留字段。 */
    public prevRunPos: Vec3 = Vec3.ZERO;
    /** 当前段运行时间。旧单段曲线运行逻辑预留字段。 */
    public curTime: number = 0;

    /** 当前段播放完成回调。旧单段曲线运行逻辑预留字段。 */
    public completeCallBack: () => void = () => { }

    /** 当前段状态。 */
    private _state: CurveState;
    public get state(): CurveState {
        return this._state
    }
    public set state(v: CurveState) {
        this._state = v;
    }

    /** 在 BezierCurve.curveList 中的索引。 */
    private _index: number = 0;
    public get index(): number {
        return this._index;
    }
    public set index(v: number) {
        this._index = v;
    }

    /** 所属 BezierCurve 编辑器组件。 */
    private _owner: BezierCurve = null
    public get owner(): BezierCurve {
        return this._owner
    }
    public set owner(v: BezierCurve) {
        this._owner = v;
    }

    // 编辑器中可拖拽的控制点节点。
    @property({ visible: false })
    public controlPoints: Node[] = null;

    // 控制点坐标列表。运行时曲线采样直接使用这个数组。
    @property({ visible: false })
    private _points: Vec3[] = [];
    @property({ type: Vec3, tooltip: "控制点列表", visible: true })
    public get points(): Vec3[] {
        return this._points;
    }
    public set points(v: Vec3[]) {
        this._points = v;
    }

    // 当前曲线段运行时间。
    @property({ visible: false })
    private _duration: number = 0;
    @property({ type: CCFloat, displayName: "运行时长", visible: true })
    public get duration(): number {
        return this._duration;
    }
    public set duration(v: number) {
        this._duration = v;
        if (this.owner) {
            this.owner.isReLoad = false
            this.owner.calculateCurveRunTimeInversion()
            this.owner.isReLoad = true
        }
    }
    public SetDuration(v: number) {
        this._duration = v;
    }

    // 当前曲线段缓动动画。
    @property({ visible: false })
    private _ease: EaseType = EaseType.Linear;
    @property({ type: Enum(EaseType), displayName: "缓动动画", visible: true })
    public get ease(): EaseType {
        return this._ease
    }
    public set ease(v: EaseType) {
        this._ease = v;
        if (this.owner)
            this.owner.isReLoad = false
    }

    // 当前曲线段重复次数。
    @property({ type: CCFloat, displayName: "重复次数", visible: true })
    private _repeatCount: number = 1;
    public get repeatCount(): number {
        return this._repeatCount;
    }
    public set repeatCount(v: number) {
        this._repeatCount = v;
    }

    public line: Node;
    /** 下一条曲线段，用于编辑器链表遍历。 */
    public nextCurve: CurveSegment;
    /** 上一条曲线段，用于编辑器链表遍历。 */
    public prevCurve: CurveSegment;

    /** 曲线绘制采样密度。数值越高，编辑器绘制越平滑。 */
    @property({ type: CCFloat, visible: false })
    public smoothness: number = 300;

    @property({ type: Graphics, visible: false })
    public lineRenderer: Graphics;

    private lineColor: Color = Color.GREEN;
    private subLineColor: Color = Color.RED;

    @property({ visible: false })
    public angleOffset: number = null;

    /**
     * 初始化曲线段。
     *
     * @param points 控制点坐标。
     * @param duration 当前段运行时长。
     * @param color 曲线颜色。
     * @param width 曲线宽度。
     * @param owner 所属 BezierCurve。
     */
    public init(points: Vec3[], duration: number, color?: Color, width?: number, owner?: BezierCurve) {
        log("Curve Init")
        this.controlPoints = []
        this.points = []
        this.line = new Node("line");
        this.line.layer = Layers.Enum.UI_2D;

        this.line.scale = v3(1, 1, 1);
        this.lineRenderer = this.line.addComponent(Graphics);
        this.lineRenderer.lineJoin = Graphics.LineJoin.ROUND;
        // 添加控制点
        if (points) {
            for (let i = 0; i < points.length; i++) {
                this.addPoint(points[i]);
            }
        }
        this._duration = duration
        this.lineRenderer.strokeColor = color
        this.lineRenderer.lineWidth = width
        this.owner = owner
        this.updatePoints();
        this.updateSubLine();
        return this
    }

    /**
     * 新增一个控制点，并同步创建编辑器控制点节点。
     */
    private prePoint: CurvePoint
    public addPoint(pos: Vec3) {
        let go = new Node()
        go.layer = Layers.Enum.UI_2D;

        let point = go.addComponent(CurvePoint).init(15)
        let i = this.points.length;
        point.setIndex(i)
        point.setPosition(pos)
        point.setParent(this.line)
        point.setName("point_" + i)
        point.setOwner(this);
        point.setLabelColor(Color.BLACK)
        if (i == 0) {
            point.setColor(this.lineColor)
            this.prePoint = point
        } else {
            point.setColor(this.subLineColor)
            if (this.prePoint) {
                point.setColor(this.lineColor)
                this.prePoint = point
            }
        }

        this.controlPoints[i] = go;
        this.points[i] = pos;
    }

    public setLineColor(color: Color) {
        this.lineColor = color;
        this.updatePoints();
        this.updateSubLine();
    }

    public setSubLineColor(color: Color) {
        this.subLineColor = color;
        this.updatePoints();
        this.updateSubLine();
    }

    public setWidth(width: number) {
        this.lineRenderer.lineWidth = width;
        this.updatePoints();
        this.updateSubLine();
    }

    public setSmoothness(value: number) {
        this.smoothness = value;
    }

    public setEase(value: EaseType) {
        this._ease = value;
    }

    public setAngleOffset(value: number) {
        this.angleOffset = value;
    }

    public update() {
        this.updatePoints();
        this.updateSubLine();
        this.points = [...this.points];
    }

    /**
     * 刷新曲线主线。
     *
     * 这里会根据 controlPoints 的当前位置重新采样曲线并绘制到 Graphics。
     */
    public updatePoints() {
        if (this.lineRenderer) {
            let posList = this.controlPoints.map(node => {
                if (node) {
                    return node.position as any;
                }
            })
            let posArr = Bezier.getCurvePointList(posList, 1, EaseType.Linear, this.smoothness);
            this.drawLine(posArr, this.lineColor);
        }
    }

    private drawLine(posArr: Vec3[], color: Color, isClear: boolean = true) {
        if (this.lineRenderer == null)
            return
        if (isClear)
            this.lineRenderer.clear();
        if (posArr.length <= 0) {
            return
        }
        this.lineRenderer.strokeColor = color;

        this.lineRenderer.moveTo(posArr[0].x, posArr[0].y);

        posArr.forEach(pos => {
            this.lineRenderer.lineTo(pos.x, pos.y);
        });

        this.lineRenderer.stroke();
    }

    /**
     * 绘制控制点之间的辅助折线。
     */
    private updateSubLine() {
        if (!this.controlPoints) {
            return
        }
        let posList = this.controlPoints.map(node => {
            return node.position as any;
        })
        if (posList && posList.length > 0) {
            posList.forEach((pos, i) => {
                if (posList[i + 1]) {
                    this.drawLine([pos, posList[i + 1]], this.subLineColor, false);
                }
            });
        }
    }

    updatePointColor() {
        this.controlPoints.forEach((node, i) => {
            let point = node.getComponent(CurvePoint);
            if (point) {
                if (i == 0 || i == this.points.length - 1) {
                    point.setColor(this.lineColor)
                } else {
                    point.setColor(this.subLineColor)
                }
            }
        })
    }

    /**
     * 检查编辑器控制点节点是否被拖动。
     *
     * 如果位置变化，会把 controlPoints 上的节点位置同步回 points 数据。
     */
    public checkPositionChanged(): boolean {
        let isChange = false;

        this.controlPoints.forEach((node, i) => {
            var prePos = this.points[i];
            var curPos = node.position.clone();

            if (!curPos.equals(prePos)) {
                // log('equals', curPos, prePos);

                isChange = true;
                this.points[i] = curPos;
            }
        })


        log('change1212    ', isChange);
        return isChange;
    }

    public removeLineRender() {
        if (this.line) {
            this.line.destroy();
            this.lineRenderer = null
            this.line = null
        }
    }

    public resetLineNodeProperty() {
        if (this.line) {
            this.line.position = v3(0);
            this.line.scale = v3(1, 1, 1);
        }
    }

    public deletePoint(index: number) {
        let corPoint = this.controlPoints[index]
        if (corPoint) {
            this.controlPoints[index].destroy()
            this.controlPoints.splice(index, 1)
            this.points.splice(index, 1);
        }
    }

    public delete() {
        this.line.destroy()
        this.points = null
        this.controlPoints = null
        if (this.owner) {
            this.owner.deleteCurve(this)
        }
    }

    /**
     * 当前段近似长度。
     *
     * length 是懒计算缓存：第一次读取时会调用 getPointList 采样计算。
     * 控制点变化后应把 length 设为 null，避免继续使用旧长度。
     */
    private pointList: BVector2[] = [];
    private prevPos: BVector2;
    public _length: number;
    public set length(v: number) {
        this._length = v;
    }
    public get length() {
        if (this._length == null) {
            this.getPointList()
        }
        return this._length
    }

    private resetData() {
        this.pointList = [];
        this.length = 0;
        this.prevPos = new BVector2(this.points[0], 0, 0);
    }

    /**
     * 获取当前段的采样点列表。
     *
     * 每个采样点记录当前位置以及上一采样点到当前采样点的距离。
     */
    public getPointList(): BVector2[] {
        this.resetData();
        let duration = this.duration;
        let smoothness = 100; this.smoothness ? this.smoothness : 300;

        let step = duration / smoothness;
        if (step <= 0)
            return this.pointList;
        for (let i = 0; i <= duration; i += step) {
            if (i + step > duration) {
                i = duration
            }
            this.calculateBezier(i)
        }
        return this.pointList;
    }

    private calculateBezier(curTime: number) {
        let t = Evaluate.calculate(this.ease, curTime, this.duration);
        let pos = Bezier.getCurTimePos(this.points, t)

        let length = Math.sqrt(Math.pow(this.prevPos.pos.x - pos.x, 2) + Math.pow(this.prevPos.pos.y - pos.y, 2));
        let v3 = new BVector2(pos, length, 0);

        this.pointList.push(v3);
        this.prevPos = v3;
        this._length += length;
    }

    public isFollowRotate(): boolean {
        return this.angleOffset != null
    }

    public getAngle(pos: Vec3) {
        return 0;
        let fmPos = this.prevRunPos;
        let toPos = pos;
        let dir: Vec3 = Vec3.ZERO;
        dir = toPos.subtract(fmPos);

        let radians = v2(Vec3.RIGHT.x, Vec3.RIGHT.y).signAngle(v2(dir.x, dir.y))
        let angle = misc.radiansToDegrees(radians) - this.angleOffset
        return angle;
    }

    /**
     * 克隆曲线段数据。
     *
     * 只克隆运行/控制点数据，不克隆编辑器绘制节点。
     */
    public clone() {
        let curveSegment = new CurveSegment();
        curveSegment.duration = this.duration;
        this.points.forEach(pos => {
            curveSegment.points.push(pos.clone())
        })
        curveSegment.ease = this.ease;
        curveSegment.repeatCount = this.repeatCount;
        return curveSegment;
    }
}
