import { Node, UITransform, Vec2, Vec3 } from 'cc';
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
        let nodePos: Vec3;
        nodePos = a.parent.getComponent(UITransform).convertToWorldSpaceAR(a.getPosition());
        return b.getComponent(UITransform).convertToNodeSpaceAR(nodePos);
    }

    /**
     * @description 转换A子节点的坐标到b子节点的坐标
     * @param {Node} a
     * @param {Node} b
     * @memberof NodeUtil
     */
    public static convertAChildPosToBChildPos(a: Node, b: Node, aChildPos: Vec3) {
        let nodePos: Vec3;
        nodePos = a.getComponent(UITransform).convertToWorldSpaceAR(aChildPos);
        return b.getComponent(UITransform).convertToNodeSpaceAR(nodePos);
    }
}