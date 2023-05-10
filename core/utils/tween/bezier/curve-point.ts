import { Color, Component, Graphics, Label, Layers, Node, UITransform, Vec3, _decorator, screen, view } from "cc";
import BezierManager from "./bezier-manager";
import { CurveSegment } from "./curve";
import PointLabel from "./point-label";

const { ccclass, property } = _decorator;

/**
 * @description 曲线片段是由CurvePoint组成的
 * @export
 * @class CurvePoint
 * @extends {Component}
 */
@ccclass
export default class CurvePoint extends Component {
    private graphics: Graphics
    private indexLabel: Label
    private index: number
    private owner: CurveSegment
    private size: number

    public init(size: number, color: Color = Color.RED) {
        this.size = size;
        this.node.name = "demo"
        this.node.addComponent(UITransform);
        this.node.getComponent(UITransform).width = size * 2
        this.node.getComponent(UITransform).height = size * 2
        this.graphics = this.node.addComponent(Graphics)
        this.graphics.circle(0, 0, size);
        this.graphics.fillColor = color
        this.graphics.fill();

        let labelNode = new Node();
        labelNode.layer = Layers.Enum.UI_2D;

        labelNode.addComponent(UITransform);
        this.indexLabel = labelNode.addComponent(Label)
        labelNode.getComponent(UITransform).width = size * 2
        labelNode.getComponent(UITransform).height = size * 2
        labelNode.parent = this.node
        this.indexLabel.overflow = Label.Overflow.SHRINK;
        this.indexLabel.horizontalAlign = Label.HorizontalAlign.CENTER
        // 锁定该节点
        labelNode.addComponent(PointLabel)
        // this.indexLabel["_objFlags"] |= Object['Flags'].LockedInEditor
        return this;
    }

    public setColor(color: Color) {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.size);
        this.graphics.fillColor = color
        this.graphics.fill();
    }

    public setLabelColor(color: Color) {
        this.indexLabel.node.getComponent(Label).color = color
    }

    public setPosition(pos: Vec3) {
        this.node.position = pos
    }

    public setParent(node: Node) {
        this.node.parent = node;
    }

    public setName(name: string) {
        this.node.name = name;
    }

    public setIndex(i: number) {
        this.indexLabel.string = i.toString();
        this.index = i;
    }

    public setOwner(owner: CurveSegment) {
        this.owner = owner;
    }


    // _onPreDestroy(){
    //     this.Delete()
    // }
    // ------------------------------------------------

    private getRandomPos() {
        let canvasSize = screen.windowSize;
        let randX = Math.random() * canvasSize.width - canvasSize.width * 0.5;
        let randY = Math.random() * canvasSize.height - canvasSize.height * 0.5;
        return new Vec3(randX, randY)
    }

    public delete() {
        if (this.owner) {
            this.owner.deletePoint(this.index)
            this.owner.owner.reLoadCurveList()
        }
    }

    public add() {
        if (this.owner) {
            this.owner.addPoint(this.getRandomPos())
            this.owner.owner.reLoadCurveList()
        }
    }

    public deleteCurve() {
        if (this.owner) {
            this.owner.delete()
            this.owner.owner.reLoadCurveList()
        }
    }
}
