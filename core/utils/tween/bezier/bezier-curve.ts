import { EDITOR } from 'cc/env';
import { Curve } from './curve';
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
/**
 * Bezier 编辑器组件。
 *
 * 挂到一个节点上后，会在编辑器中生成控制点和路径绘制节点，方便手动编辑曲线。
 * 运行时可以直接调用 play() 播放自身节点，也可以从外部读取 curveList 后构造 Curve，
 * 再用 Bezier.runBezierAction(target, curve) 驱动其他节点。
 *
 * 注意：
 * - 曲线点是本地 position 数据，播放其他节点时要保证坐标系一致。
 * - 不要同时在同一个节点挂多个 BezierCurve，onEnable 会自动阻止重复组件。
 */
export class BezierCurve extends Component {

    private defaultPoints: Vec3[] = [
        new Vec3(-150, 0),
        new Vec3(-150, 200),
        new Vec3(150, 200),
        new Vec3(150, 0),
    ];

    @property({ type: CurveSegment, visible: false })
    public curve: CurveSegment;
    // 是否处于编辑状态。编辑状态下会显示控制点和辅助线。
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

    // 是否在运行时仍绘制路径。关闭编辑时才会生效。
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

    // 编辑器中生成的路径根节点，保存控制点和线段绘制节点。
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

    // 曲线列表。每个 CurveSegment 是一段贝塞尔曲线，多段按数组顺序播放。
    @property({ visible: false })
    private _curveList: CurveSegment[] = [];
    @property({ type: CurveSegment, displayName: "曲线列表", visible: true })
    public get curveList(): CurveSegment[] {
        return this._curveList;
    }
    public set curveList(v: CurveSegment[]) {

        log("set curveList", v)
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

    // 整体缓动动画。isWholeRun 开启时会作为整条曲线的缓动使用。
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

    // 整条路径总运行时间。多段曲线会按长度比例重新分配每段 duration。
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

    // 是否跟随路径方向旋转节点。
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
    // 跟随旋转时的角度偏移，用于修正资源默认朝向。
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

    // 是否整体采用一个 Ease 缓动动画。
    // 开启：整条路径共享 duration/ease。
    // 关闭：按 CurveSegment 队列播放，保留每段自身 duration。
    @property({ visible: false })
    private _isWholeRun: boolean = false;
    @property({ displayName: "整体运行", tooltip: "是否整体采用一个Ease缓动动画(尽量不勾选)", })
    public get isWholeRun(): boolean {
        return this._isWholeRun;
    }
    public set isWholeRun(v: boolean) {
        this._isWholeRun = v;
    }

    // 一次性工具开关：勾选后把后一条曲线起点设置为前一条曲线终点，然后自动取消勾选。
    // 这不是持续约束；后续手动拖动控制点不会自动保持连接。
    @property({ visible: false })
    private _isConnectHeadTail: boolean = false;
    @property({ displayName: "设置一次首尾相连", tooltip: "多条曲线时，前一条曲线的末尾点作为下一条曲线的起始点" })
    public get isConnectHeadTail(): boolean {
        return this._isConnectHeadTail;
    }
    public set isConnectHeadTail(v: boolean) {
        this._isConnectHeadTail = v;
        if (v) {
            this.syncConnectedCurvePoints();
            this.calculateCurveRunTime();
            this._isConnectHeadTail = false;
        }
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
    /**
     * 将一段曲线加入当前编辑器组件。
     *
     * 这里同时维护链表关系(prevCurve/nextCurve)、显示线节点父级、曲线样式和 index。
     */
    private addCurve_M(curve: CurveSegment) {
        if (this.curve == null) {
            log('AddCurve_M', null);
            this.curve = curve;
            this.pathNode = new Node(this.node.name + PathNodeName);
            this.pathNode.layer = Layers.Enum.UI_2D;
            this.pathNode.setWorldPosition(v3(0, 0, 0));

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
                    // curve.length = null;
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

    /**
     * 按 curveList 数组顺序执行一次首尾连接。
     *
     * 第 i 条曲线的第 0 个点会被设置为第 i-1 条曲线的最后一个点。
     */
    private syncConnectedCurvePoints() {
        if (!this._curveList || this._curveList.length <= 1) {
            return
        }

        for (let i = 1; i < this._curveList.length; i++) {
            this.syncCurveStartWithPrevious(this._curveList[i - 1], this._curveList[i]);
        }
    }

    /**
     * 把 curve 的起点同步为 prevCurve 的终点。
     *
     * 同步后会清空 curve.length 缓存，并刷新控制点节点和线段显示。
     */
    private syncCurveStartWithPrevious(prevCurve: CurveSegment, curve: CurveSegment) {
        if (!prevCurve || !curve) {
            return
        }
        let prevPoints = prevCurve.points;
        if (!prevPoints || prevPoints.length == 0 || !curve.points || curve.points.length == 0) {
            return
        }

        let endPos = prevPoints[prevPoints.length - 1].clone();
        if (curve.points[0].equals(endPos)) {
            return
        }
        curve.points[0] = endPos.clone();
        curve.length = null;

        let controlPoint = curve.controlPoints && curve.controlPoints[0];
        if (controlPoint) {
            controlPoint.position = endPos.clone();
        }
        curve.update();
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
     * 重新加载曲线编辑节点。
     *
     * Cocos 序列化保存的是 CurveSegment 数据；编辑器显示用的控制点节点和 Graphics 线条
     * 需要在这里重新创建。
     */
    public reLoadCurveList() {
        // if (!CC_EDITOR) {
        //     return
        // }

        log("reload")
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
    // 切换编辑/非编辑状态。
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

    // 非编辑状态下按配置绘制或隐藏路径。
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


        c.repeatCount = curve.repeatCount;
        curve = this.addCurve_M(c);
        curve.setEase(ease)
        curve.setAngleOffset(angleOffset)

    }

    /**
     * 根据每段曲线长度，按总 duration 自动分配每段运行时长。
     *
     * 适合“总时间固定，长段跑久一点，短段跑快一点”的编辑方式。
     */
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
    /**
     * 根据每段 CurveSegment.duration 反推整条路径 duration。
     *
     * 适合用户手动编辑每段运行时长后，同步总运行时间显示。
     */
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
     * 播放当前 BezierCurve 所在节点。
     *
     * 如果要让其他节点沿这条路径移动，请读取 curveList 构造 Curve 后调用 Bezier.runBezierAction。
     */
    public play(): void {
        if (this.isWholeRun) {
            this.bezier = Bezier.runBezierAction(this.node, new Curve(this.curveList), 0, this.duration, this.ease, this._completeCallBack);

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
