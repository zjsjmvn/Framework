import { Node, UITransform, Vec2, Vec3 } from 'cc';
export default class NodeUtil {


    /**
     * 节点之间坐标互转
     * @param a         A节点
     * @param b         B节点
     * @param aPos      A节点空间中的相对位置
     */
    public static calculateASpaceToBSpacePos(a: Node, b: Node, aPos?: Vec3) {
        let nodePos: Vec3;
        if (aPos) {
            nodePos = a.getComponent(UITransform).convertToWorldSpaceAR(aPos);
        } else {
            nodePos = a.getComponent(UITransform).convertToWorldSpaceAR(a.getPosition());
        }
        return b.getComponent(UITransform).convertToNodeSpaceAR(nodePos);
    }


    public static getNodeWorldPosition(a: Node) {
        return a.getComponent(UITransform).convertToWorldSpaceAR(a.getPosition());
    }

    // public static convertToNodeSpaceAR()
}