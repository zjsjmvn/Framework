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

declare module 'cc' {
    interface Node {
        /**x轴坐标 */
        x: number,
        /**y轴坐标 */
        y: number,
        /**z轴坐标 */
        z: number,
        /**x轴缩放 */
        scaleX: number,
        /**y轴缩放 */
        scaleY: number,
        /**z轴缩放 */
        scaleZ: number,
        /**x轴旋转 */
        angleX: number,
        /**y轴旋转 */
        angleY: number,
        /**z轴旋转, 等同于angle */
        angleZ: number,
    }
}

Object.defineProperty(Node.prototype, 'x', {
    get: function () {
        return this.position.x;
    },
    set: function (v: number) {
        this.position.set(v, this.position.y, this.position.z);
        this.setPosition(this.position);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'y', {
    get: function () {
        return this.position.y;
    },
    set: function (v: number) {
        this.position.set(this.position.x, v, this.position.z);
        this.setPosition(this.position);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'z', {
    get: function () {
        return this.position.z;
    },
    set: function (v: number) {
        this.position.set(this.position.x, this.position.y, v);
        this.setPosition(this.position);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'scaleX', {
    get: function () {
        return this.scale.x;
    },
    set: function (v: number) {
        this.scale.set(v, this.scale.y, this.scale.z);
        this.setScale(this.scale);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'scaleY', {
    get: function () {
        return this.scale.y;
    },
    set: function (v: number) {
        this.scale.set(this.scale.x, v, this.scale.z);
        this.setScale(this.scale);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'scaleZ', {
    get: function () {
        return this.scale.z;
    },
    set: function (v: number) {
        this.scale.set(this.scale.x, this.scale.y, v);
        this.setScale(this.scale);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'angleX', {
    get: function () {
        return this.eulerAngles.x;
    },
    set: function (v: number) {
        this.eulerAngles.set(v, this.eulerAngles.y, this.eulerAngles.z);
        this.setRotationFromEuler(this.eulerAngles);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'angleY', {
    get: function () {
        return this.eulerAngles.y;
    },
    set: function (v: number) {
        this.eulerAngles.set(this.eulerAngles.x, v, this.eulerAngles.z);
        this.setRotationFromEuler(this.eulerAngles);
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Node.prototype, 'angleZ', {
    get: function () {
        return this.eulerAngles.z;
    },
    set: function (v: number) {
        this.eulerAngles.set(this.eulerAngles.x, this.eulerAngles.y, v);
        this.setRotationFromEuler(this.eulerAngles);
    },
    enumerable: true,
    configurable: true,
});

