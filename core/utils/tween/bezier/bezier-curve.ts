import { EDITOR } from 'cc/env';
import { } from './curve';
import { EaseType } from './tools/ease-type';
import { CCFloat, CCObject, Color, Component, Enum, Layers, Node, Vec3, _decorator, color, log, screen, v3, view } from 'cc';
import { Bezier } from './tools/bezier';
import { CurveSegment } from './curve-segment';
const { ccclass, property, executeInEditMode, inspector, menu } = _decorator;

const PathNodeName = "_BezierPathNode";

export enum State {
    None,
    DurationSetting,
}

@ccclass('BezierCurve')
@executeInEditMode
@menu('Bezier')
// @inspector("packages://bezier/inspector.js")
export class BezierCurve extends Component {

    private defaultPoints: Vec3[] = [
        new Vec3(-150, 0),
        new Vec3(-150, 200),
        new Vec3(150, 200),
        new Vec3(150, 0),
    ];

    @property({ type: CurveSegment, visible: false })
    public curve: CurveSegment;
    // 是否编辑
    @property({ visible: false })
    private _isEdit: boolean = true;
    @property({ displayName: "编辑", })
    public get isEdit(): boolean {
        if (!EDITOR) {
            return false;
        }
        return this._isEdit;
    }
    public set isEdit(v: boolean) {
        this._isEdit = v;
        this.edit();
    }

    // 是否绘制路径
    @property({ visible: false })
    private _isDrawPath: boolean = true;
    @property({ displayName: "运行时绘制路径", })
    public get isDrawPath(): boolean {
        return this._isDrawPath;
    }
    public set isDrawPath(v: boolean) {
        log('set isDrawPath', v);
        this._isDrawPath = v;
        if (!this.isEdit) {
            this.drawPath()
        }
    }

    // 根节点
    @property({ type: Node, displayName: "路径根节点", visible: true, readonly: true })
    private pathNode: Node = null;


    //曲线宽度
    @property({ type: CCFloat, visible: false })
    private _curveWidth: number = 5;

    @property({ type: CCFloat, slide: true, range: [0, 10], displayName: "曲线宽度", })
    public get curveWidth(): number {
        return this._curveWidth;
    }
    public set curveWidth(v: number) {
        this._curveWidth = v;
        this.setCurveWidth(v);
    }

    //曲线颜色
    @property({ visible: false })
    private _curveColor: Color = Color.GREEN.clone();

    @property({ displayName: "曲线颜色", })
    public get curveColor(): Color {
        return this._curveColor;
    }
    public set curveColor(v: Color) {
        log('set curveColor', v);
        this._curveColor = v;
        this.setCurveColor(v);
        console.warn("curveColor")
    }

    //辅助线颜色
    @property({ visible: false })
    private _subLineColor: Color = Color.RED.clone();

    @property({ displayName: "辅助线颜色", })
    public get subLineColor(): Color {
        return this._subLineColor;
    }
    public set subLineColor(v: Color) {
        log('set subLineColor', v);

        this._subLineColor = v;
        this.setCurveSubLineColor(v);
    }

    // //曲线material
    // @property({ visible: false })
    // private _curveMat: any;

    // @property({ displayName: "曲线材质", })
    // public get curveMat(): any {
    //     return this._curveMat;
    // }
    // public set curveMat(v: any) {
    //     this._curveMat = v;
    //     this.SetCurveMat(v);
    //     console.warn("curveMat")
    // }

    //曲线平滑度
    // @property({ type: Float, visible: false })
    // private _curveSmoothness: number = 80;

    // @property({ type: Float, displayName: "曲线平滑度", tooltip: "", slide: true, range: [10, 500] })
    // public get curveSmoothness(): number {
    //     return this._curveSmoothness;
    // }
    // public set curveSmoothness(v: number) {
    //     this._curveSmoothness = v;
    //     this.SetCurveSmoothness(v);
    // }

    private _isReLoad: boolean = true
    public get isReLoad(): boolean {
        return this._isReLoad
    }
    public set isReLoad(v: boolean) {
        console.warn("set isReLoad", v)
        this._isReLoad = v;
    }

    // 曲线列表
    @property({ visible: false })
    private _curveList: CurveSegment[] = [];
    @property({ type: CurveSegment, displayName: "曲线列表", visible: true })
    public get curveList(): CurveSegment[] {
        return this._curveList;
    }
    public set curveList(v: CurveSegment[]) {
        this._curveList = v;
        if (this.isReLoad) {
            this.reLoadCurveList()
            this.calculateCurveRunTimeInversion()
        } else {
            console.error("不能重载", this.isReLoad)
        }
        this.isReLoad = true
    }
    // public SetCurveList(v: Curve[]) {
    //     this._curveList = v;
    // }

    // 缓动动画
    @property({ type: CCFloat, visible: false })
    private _ease: EaseType = EaseType.Linear;
    @property({ type: Enum(EaseType), displayName: "缓动动画", visible: true })
    public get ease(): number {
        return this._ease;
    }
    public set ease(v: number) {
        this._ease = v;
        this.setEase(v);
        this.isReLoad = true
    }

    // 持续时间
    @property({ type: CCFloat, visible: false })
    private _duration = 1;
    @property({ type: CCFloat, displayName: "运行时间", visible: true })
    public get duration(): number {
        return this._duration;
    }
    public set duration(v: number) {
        this._duration = v;
        this.calculateCurveRunTime();
    }
    public SetDuration(v: number) {
        this._duration = v;
    }

    //是否跟随路径旋转
    @property({ visible: false })
    private _isRotate: boolean = false;
    @property({ displayName: "跟随旋转", tooltip: "是否跟随轨迹旋转", })
    public get isRotate(): boolean {
        return this._isRotate;
    }
    public set isRotate(v: boolean) {
        this._isRotate = v;
        if (!v) {
            this.setAngleOffset(null);
        }
    }
    // 角度偏移
    @property({ visible: false })
    private _angleOffset: number = 0;
    @property({
        displayName: "偏移角度",
        visible() {
            return this.isRotate
        }
    })
    public get angleOffset(): number {
        if (!this.isRotate) {
            return null
        }
        return this._angleOffset;
    }
    public set angleOffset(v: number) {
        // if (!this.isRotate) {
        //     return null
        // }
        this._angleOffset = v;
        this.setAngleOffset(v);
    }

    //是否整体采用一个Ease缓动动画
    @property({ visible: false })
    private _isWholeRun: boolean = false;
    @property({ displayName: "整体运行", tooltip: "是否整体采用一个Ease缓动动画(尽量不勾选)", })
    public get isWholeRun(): boolean {
        return this._isWholeRun;
    }
    public set isWholeRun(v: boolean) {
        this._isWholeRun = v;
    }



    onLoad() {

    }

    onEnable() {
        let list = this.node.getComponents(BezierCurve)
        if (list.length > 1) {
            if (EDITOR) {
                console.warn("该节点已有Bezier组件，不能重复添加！")
            } else {
                console.warn("该节点已有Bezier组件，不能重复添加！")
            }
            this.destroy()
            return
        }

        this._isEdit = true
        this.init()
    }

    onDisable() {
        this.destroyPathNode()
    }

    onDestroy() {
    }

    init() {
        if (!EDITOR) {
            this.isEdit = false
            return
        }
        if (this.curveList.length > 0) {
            this.reLoadCurveList()
        } else {
            this.clear()
            this.addCurve_M(this.createRandomCurve());
        }
        this.calculateCurveRunTime();
    }

    private preCurve: CurveSegment;
    private addCurve_M(curve: CurveSegment) {
        if (this.curve == null) {
            log('AddCurve_M', null);
            this.curve = curve;
            this.pathNode = new Node(this.node.name + PathNodeName);
            this.pathNode.layer = Layers.Enum.UI_2D;

            this.pathNode.parent = this.node.parent;
            this.preCurve = curve

            // this.pathNode.on(Node.EventType.POSITION_CHANGED, () => {
            //     console.warn("Can't change pathNode position")
            //     // this.ResetLineNodeProperty()
            // }, this);
            // this.pathNode.on(Node.EventType.child, () => {
            //     console.warn("Can't change pathNode position")
            //     // this.ResetLineNodeProperty()
            // }, this);
        }
        else {
            curve.prevCurve = this.preCurve
            this.preCurve.nextCurve = curve;
            this.preCurve = curve
        }
        if (curve.line) {
            curve.line.parent = this.pathNode;
            // this.pathNode.setSiblingIndex(0)
        }
        this.setCurveColor(this.curveColor);
        this.setCurveSubLineColor(this.subLineColor);
        this.setCurveWidth(this.curveWidth);
        // 添加控制点列表
        this._curveList.push(curve)
        curve.index = this._curveList.length - 1;
        return curve
    }

    update(deltaTime: number) {
        this.resetLineNodeProperty()
        if (EDITOR) {
            this.foreachCurve(this.curve, (curve, i) => {
                if (curve.checkPositionChanged()) {
                    curve.update();
                    this.updateControlPointList(curve, i);
                }
            })
            // this.CheckPathNodeState()
        }
    }

    private resetLineNodeProperty() {
        if (!this.pathNode)
            return

        this.pathNode.position = Vec3.ZERO;
        this.pathNode.scale = v3(1, 1, 1);
        // this.pathNode.skewX = 0;
        // this.pathNode.skewY = 0;

        this.curveList.forEach(c => {
            c.resetLineNodeProperty()
        })
    }

    private checkPathNodeState() {
        if (this.pathNode == null) {
            this.reLoadCurveList()
        }
    }

    private updateControlPointList(curve: CurveSegment, i: number) {
        // console.warn("UpdateControlPointList")
    }

    private setCurveColor(color: Color = Color.WHITE) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setLineColor(color);
            curve.updatePointColor()
        })
    }
    private setCurveSubLineColor(color: Color = Color.WHITE) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setSubLineColor(color);
            curve.updatePointColor()
        })
    }
    // private SetCurveMat(mat: any) {
    //     this.ForeachCurve(this.curve, (curve, i) => {
    //         curve.SetLineMat(mat);
    //         curve.UpdatePointColor()
    //     })
    // }
    private setCurveWidth(width: number = 2) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setWidth(width);
        })
    }
    // 平滑度
    private setCurveSmoothness(value: number = 100) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setSmoothness(value);
        })
    }

    // ease
    private setEase(value: EaseType = EaseType.Linear) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setEase(value);
        })
    }

    // 偏移角度
    private setAngleOffset(angle: number) {
        this.foreachCurve(this.curve, (curve, i) => {
            curve.setAngleOffset(angle);
        })
    }

    private clear() {
        this._curveList = []
        this.curve = null;
        this.destroyPathNode()
    }

    private destroyPathNode() {
        if (this.pathNode) {
            this.pathNode.destroy()
            this.pathNode = null
        }
        if (this.curveList) {
            this.curveList.forEach(v => {
                v.removeLineRender()
            })
        }
    }

    private destroyPointNode() {
        if (this.pathNode) {
            this.pathNode.children.forEach(line => {
                line.destroyAllChildren()
            })
        }
    }
    private hideNodeInHierarchy(node: Node) {
        if (node) {
            node["_objFlags"] |= (CCObject["Flags"].LockedInEditor | CCObject["Flags"].HideInHierarchy);
        }
    }

    /**
     * 重新加载曲线
     */
    public reLoadCurveList() {
        // if (!CC_EDITOR) {
        //     return
        // }

        this.destroyPathNode()
        let posTemp = this._curveList
        this._curveList = []
        this.curve = null;
        posTemp.forEach(curve => {
            this.reLoadCurve(curve);
        })
    }

    private foreachCurve(node: CurveSegment, func: (curve: CurveSegment, index: number) => void): void {
        var curNode = node;
        let index = 0
        while (curNode != null) {
            func(curNode, index);
            curNode = curNode.nextCurve;
            index++
        }
    }
    // 编辑
    private edit() {
        if (!this.enabled) {
            return
        }

        if (this.isEdit) {
            this.reLoadCurveList()
        } else {
            this.destroyPathNode()
            this.drawPath()
        }
    }

    // 绘制路径
    private drawPath() {
        if (!this.enabled) {
            return
        }

        if (this.isDrawPath) {
            log("DrawPath")
            this.reLoadCurveList()
            this.foreachCurve(this.curve, (curve, i) => {
                curve.updatePoints();
            })
            // this.DestroyPointNode()
            // this.HideNodeInHierarchy(this.pathNode)
        } else {
            this.destroyPathNode()
        }


    }
    private getRandomPos() {
        let canvasSize = screen.windowSize;
        let randX = Math.random() * canvasSize.width - canvasSize.width * 0.5;
        let randY = Math.random() * canvasSize.height - canvasSize.height * 0.5;
        return new Vec3(randX, randY)
    }

    private createRandomCurve() {
        let curve = new CurveSegment().init(
            [this.getRandomPos(), this.getRandomPos(), this.getRandomPos(), this.getRandomPos()],
            // [...this.defaultPoints],
            this.duration,
            this.curveColor,
            this.curveWidth,
            this
        )
        curve.setEase(this.ease)
        return curve;
    }

    private reLoadCurve(curve: CurveSegment) {
        if (curve == null) {
            log('curve is null')

            curve = this.createRandomCurve()
        }
        let points = curve.points
        let duration = curve.duration || this.duration
        let ease = curve.ease || this.ease
        let angleOffset = curve.angleOffset || this.angleOffset
        let c = new CurveSegment().init(
            [...points],
            duration,
            this.curveColor,
            this.curveWidth,
            this
        );
        curve = this.addCurve_M(c
        );
        curve.setEase(ease)
        curve.setAngleOffset(angleOffset)

        // this.AddCurve_M(curve)
    }

    private calculateCurveRunTime() {
        if (this.curveList.length == 0) {
            return
        }
        if (this.curveList.length == 1) {
            this.curveList[0].duration = this.duration
            return
        }
        let totalLength = 0
        let lengthList = this.curveList.map(curve => {
            let len = curve.length
            totalLength += len
            return len
        });
        let timeScale = this.duration / totalLength
        this.isReLoad = false
        this.curveList.forEach((curve, i) => {
            let time = lengthList[i] * timeScale
            curve.SetDuration(Math.round(time * 100) / 100)
        })
        this.isReLoad = true
    }
    public calculateCurveRunTimeInversion() {
        console.warn("CalculateCurveRunTimeInversion: ", this.curveList)
        if (this.curveList.length == 1) {
            this._duration = this.curveList[0].duration
            return
        }
        let totalDuration = 0
        this.curveList.forEach((curve, i) => {
            console.warn("curve.duration:" + curve.duration)
            totalDuration += curve.duration
        })
        this.isReLoad = false
        this.SetDuration(totalDuration)
    }


    //-------------------------------------------------外部API----------------------------------------------
    private _completeCallBack: () => void;
    /**
     * 设置回调
     * @param callBack 完成回调
     */
    public setCompleteCallBack(callBack?: () => void) {
        this._completeCallBack = callBack
    }

    private bezier: Bezier;
    /**
     * 播放
     */
    public play(): void {
        if (this.isWholeRun) {
            this.bezier = Bezier.runBezierAction(this.node, this.curveList, this.duration, this.ease, this._completeCallBack);

        } else {
            this.bezier = Bezier.moveQueue(this.node, this.curveList, this._completeCallBack)
        }
    }
    /**
     * 停止
     */
    public stop(): void {
        if (this.bezier) {
            this.bezier.stop()
        }
    }
    /**
     * 暂停
     */
    public pause(): void {
        if (this.bezier) {
            this.bezier.pause()
        }
    }
    /**
     * 恢复
     */
    public resume(): void {
        if (this.bezier) {
            this.bezier.resume()
        }
    }

    /**
     * 添加曲线
     * @param curve 曲线
     */
    public addCurve(curve: CurveSegment): void {
        this._curveList.push(curve);
    }

    /**
     * 删除曲线
     * @param curve 曲线
     */
    public deleteCurve(curve: CurveSegment): void;
    /**
     * 删除曲线
     * @param index 索引
     */
    public deleteCurve(index: number): void;
    public deleteCurve(param: any) {
        let curve: CurveSegment;
        let i: number;
        if (typeof param == "number") {
            i = param
            curve = this._curveList[param]
        } else if (typeof param == "object" && param.constructor.name == CurveSegment.name) {
            curve = param
            i = curve.index
        }
        // 删除
        if (curve.prevCurve == null) {
            this.curve = curve.nextCurve
        } else {
            curve.prevCurve.nextCurve = curve.nextCurve
        }
        this._curveList.splice(i, 1);
        // 更新索引
        this._curveList.forEach((c, index) => {
            c.index = index
        })
    }


    /**
     * 删除点
     * @param curveIndex 曲线索引
     * @param pointIndex 点索引
     */
    public deleteCurvePoint(curveIndex: number, pointIndex: number) {
        let curve = this._curveList[curveIndex]
        if (curve) {
            curve.deletePoint(pointIndex)
            this.reLoadCurveList()
        }
    }


    // 编辑器
    /**
     * 添加一个随机曲线
     */
    public addRandomCurve() {
        this.addCurve_M(this.createRandomCurve())
        this.reLoadCurveList()
    }

}
