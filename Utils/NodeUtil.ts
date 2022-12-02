export default class NodeUtil {


    /**
     * 节点之间坐标互转
     * @param a         A节点
     * @param b         B节点
     * @param aPos      A节点空间中的相对位置
     */
    public static calculateASpaceToBSpacePos(a: cc.Node, b: cc.Node, aPos?: cc.Vec2) {
        let nodePos: cc.Vec2;
        if (aPos) {
            nodePos = a.convertToWorldSpaceAR(aPos);
        } else {
            nodePos = a.convertToWorldSpaceAR(a.getPosition());
        }
        return b.parent.convertToNodeSpaceAR(nodePos);
    }

}