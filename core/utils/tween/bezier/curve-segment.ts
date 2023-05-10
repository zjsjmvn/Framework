import { CCFloat, Color, Enum, Graphics, Layers, Node, Vec3, _decorator, log, misc, v2, v3 } from "cc";
import { BVector2, Bezier } from "./tools/bezier";
import { EaseType, Evaluate } from "./tools/ease-type";
import { CurveState } from "./curve";
import { BezierCurve } from "./bezier-curve";
import CurvePoint from "./curve-point";
const { ccclass, property, executeInEditMode, inspector, menu } = _decorator;


/**
 * @description 曲线片段，由曲线片段组成曲线。
 * @export
 * @class CurveSegment
 * @implements {CurveAction}
 */
@ccclass('CurveSegment')
export class CurveSegment {

    public prevRunPos: Vec3 = Vec3.ZERO;
    // 当前运行时间
    public curTime: number = 0;

    // 完成回调
    public completeCallBack: () => void = () => { }

    // 状态
    private _state: CurveState;
    public get state(): CurveState {
        return this._state
    }
    public set state(v: CurveState) {
        this._state = v;
    }



    // 所属者索引
    private _index: number = 0;
    public get index(): number {
        return this._index;
    }
    public set index(v: number) {
        this._index = v;
    }

    private _owner: BezierCurve = null
    public get owner(): BezierCurve {
        return this._owner
    }
    public set owner(v: BezierCurve) {
        this._owner = v;
    }

    // 控制节点
    @property({ visible: false })
    public controlPoints: Node[] = null;

    // 控制点
    @property({ visible: false })
    private _points: Vec3[] = [];
    @property({ type: Vec3, tooltip: "控制点列表", visible: true })
    public get points(): Vec3[] {
        return this._points;
    }
    public set points(v: Vec3[]) {
        this._points = v;
    }

    // 曲线运行时间
    @property({ visible: false })
    private _duration: number = 0;
    @property({ type: CCFloat, displayName: "运行时长", visible: true })
    public get duration(): number {
        return this._duration;
    }
    public set duration(v: number) {
        this._duration = v;
        // console.error("set duration:"+v)
        if (this.owner) {
            this.owner.isReLoad = false
            this.owner.calculateCurveRunTimeInversion()
            this.owner.isReLoad = true
        }
    }
    public SetDuration(v: number) {
        this._duration = v;
    }

    // 缓动动画
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

    public line: Node;
    public nextCurve: CurveSegment;
    public prevCurve: CurveSegment;

    @property({ type: CCFloat, visible: false })
    public smoothness: number = 300;

    @property({ type: Graphics, visible: false })
    public lineRenderer: Graphics;

    private lineColor: Color = Color.GREEN;
    private subLineColor: Color = Color.RED;
    // private lineMat: Material;

    @property({ visible: false })
    public angleOffset: number = null;

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
        // this.smoothness = smoothness
        this.lineRenderer.strokeColor = color
        this.lineRenderer.lineWidth = width
        this.owner = owner
        // 添加辅助线
        this.updatePoints();
        this.updateSubLine();
        return this
    }

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
        // 起点和终点
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

    // public SetLineMat(mat: Material) {
    //     this.lineMat = mat;
    //     this.lineRenderer.setMaterial(0, mat);
    //     this.UpdatePoints();
    //     this.UpdateSubLine();
    // }

    public setWidth(width: number) {
        this.lineRenderer.lineWidth = width;
        this.updatePoints();
        this.updateSubLine();
    }

    // 设置平滑度
    public setSmoothness(value: number) {
        this.smoothness = value;
        // this.UpdatePoints();
        // this.UpdateSubLine();
    }

    public setEase(value: EaseType) {
        this._ease = value;
        // this.UpdatePoints();
        // this.UpdateSubLine();
    }

    public setAngleOffset(value: number) {
        this.angleOffset = value;
    }


    public update() {
        this.updatePoints();
        this.updateSubLine();
    }

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
                // 起点和终点
                if (i == 0 || i == this.points.length - 1) {
                    point.setColor(this.lineColor)
                } else {
                    point.setColor(this.subLineColor)
                }
            }

        })
    }

    // 检测坐标是否变化
    public checkPositionChanged(): boolean {
        let isChange = false;

        this.controlPoints.forEach((node, i) => {
            var prePos = this.points[i];
            var curPos = node.position.clone();

            if (!curPos.equals(prePos)) {
                log('equals', curPos, prePos);

                isChange = true;
                this.points[i] = curPos
            }
        })
        return isChange;

        // return true;
    }

    public removeLineRender() {
        if (this.line) {
            this.line.destroy();
            this.lineRenderer = null
            this.line = null
        }
    }

    /**
     * 重置line node属性
     */
    public resetLineNodeProperty() {
        if (this.line) {
            this.line.position = v3(0);
            // this.line.position = TransformUtils.TransformPosition(new Vec3(0), this.line.position.constructor.name);

            // this.line.angle = 0;
            this.line.scale = v3(1, 1, 1);
            // this.line.skewX = 0;
            // this.line.skewY = 0;
        }
    }

    /**
     * 删除点
     * @param index 索引
     */
    public deletePoint(index: number) {
        let corPoint = this.controlPoints[index]
        if (corPoint) {
            this.controlPoints[index].destroy()
            this.controlPoints.splice(index, 1)
            this.points.splice(index, 1);
        }
    }

    /** */
    public delete() {
        this.line.destroy()
        this.points = null
        this.controlPoints = null
        if (this.owner) {
            this.owner.deleteCurve(this)
        }
    }



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
    // 重置数据
    private resetData() {
        // 点集合
        this.pointList = [];
        // 线段总长度
        this.length = 0;
        // 初始位置
        this.prevPos = new BVector2(this.points[0], 0, 0);
    }

    public getPointList(): BVector2[] {
        this.resetData();
        let duration = this.duration;
        //TODO: 优化

        let smoothness = 100; this.smoothness ? this.smoothness : 300;

        let step = duration / smoothness;
        if (step <= 0)
            return this.pointList;
        // 开始分割曲线
        for (let i = 0; i <= duration; i += step) {
            if (i + step > duration) {
                i = duration
            }
            this.calculateBezier(i)
        }
        return this.pointList;
    }
    /**
     * 计算贝塞尔点
     */
    private calculateBezier(curTime: number) {
        let t = Evaluate.calculate(this.ease, curTime, this.duration);
        let pos = Bezier.getCurTimePos(this.points, t)

        // 计算两点距离
        let length = Math.sqrt(Math.pow(this.prevPos.pos.x - pos.x, 2) + Math.pow(this.prevPos.pos.y - pos.y, 2));
        let v3 = new BVector2(pos, length, 0);

        // 存储当前节点z
        this.pointList.push(v3);
        this.prevPos = v3;
        // 累计长度
        this._length += length;
    }




    // 是否跟随旋转
    public isFollowRotate(): boolean {
        return this.angleOffset != null
    }

    // 获取当前位置的旋转角度
    public getAngle(pos: Vec3) {
        return 0;
        let fmPos = this.prevRunPos;
        let toPos = pos;
        let dir: Vec3 = Vec3.ZERO;
        dir = toPos.subtract(fmPos);

        // let radians = Vec3.RIGHT.signAngle(dir)
        let radians = v2(Vec3.RIGHT.x, Vec3.RIGHT.y).signAngle(v2(dir.x, dir.y))
        let angle = misc.radiansToDegrees(radians) - this.angleOffset
        return angle;
    }


    public clone() {
        let curveSegment = new CurveSegment();
        curveSegment.duration = this.duration;
        this.points.forEach(pos => {
            curveSegment.points.push(pos.clone())
        })
        curveSegment.ease = this.ease;
        return curveSegment;
    }
}
