import { Component, Node, UITransform, Vec2, Vec3 } from 'cc';
export default class NodeUtil {



    public static getNodeWorldPosition(a: Node) {
        return a.parent.getComponent(UITransform).convertToWorldSpaceAR(a.getPosition());
    }


    /**
     * @description 转换A自己的坐标为b的子节点的坐标
     * @param {Node} a
     * @param {Node} b
     * @memberof NodeUtil
     */
    public static convertASelfPosToBChildPos(a: Node, b: Node) {
        let worldPos: Vec3;
        worldPos = a.parent.getComponent(UITransform).convertToWorldSpaceAR(a.getPosition());
        return b.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
    }

    static positionInTarget(node: Node, targetParent: Node): Vec3 {
        return this.convertASelfPosToBChildPos(node, targetParent);
    }

    /**
     * @description 转换A子节点的坐标到b子节点的坐标
     * @param {Node} a
     * @param {Node} b
     * @memberof NodeUtil
     */
    public static convertAChildPosToBChildPos(a: Node, b: Node, aChildPos: Vec3) {
        let worldPos: Vec3;
        worldPos = a.getComponent(UITransform).convertToWorldSpaceAR(aChildPos);
        return b.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
    }

    public static setPosX(node: Node, x) {
        let pos = node.getPosition();
        pos.x = x;
        node.setPosition(pos);
    }

    //setPosY
    public static setPosY(node: Node, y) {
        let pos = node.getPosition();
        pos.y = y;
        node.setPosition(pos);
    }

    public static setPosZ(node: Node, z) {
        let pos = node.getPosition();
        pos.z = z;
        node.setPosition(pos);
    }

    public static setWidth(node: Node, width) {
        node.getComponent(UITransform).width = width;
    }
    public static setHeight(node: Node, height) {
        node.getComponent(UITransform).height = height;
    }

    // 将 node 节点移动到 targetParent 节点，保持当前的位置不变
    static changeNodeParentTo(node: Node, targetParent: Node) {
        if (node.parent === targetParent) {
            return
        }
        let np = targetParent.getComponent(UITransform).convertToNodeSpaceAR(node.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO));
        node.removeFromParent();
        node.position = np
        targetParent.addChild(node)
    }
    // 获取组件，没有该组件时，添加一个；
    static getOrAddComponent<T extends Component>(node: Node, typ: { new(): T }): T {
        let comp = node.getComponent<T>(typ);
        if (!comp) {
            comp = node.addComponent<T>(typ);
        }
        return comp;
    }



}