
import RedDotManager from './RedDotManager';



/**
 * @description 
 *              RedDotManager会根据节点的类型进行删除。比如动态节点不需要展示红点时，会将动态部分删除，以节约内存。
 *              而静态部分是经常变化的，不需要删除，否则会频繁删除增加。
 * @export
 * @enum {number}
 */
export enum NodeType {
    Static, // 静态节点，比如打开背包的按钮。打开装备界面的按钮。这些不会变化
    Dynamic,   // 动态节点，比如背包内的物品，这些都是会变化的，不会一直存在，动态节点的特点是多。
}
export default class TreeNode {
    private _childrenMap: Map<string, TreeNode> = new Map();
    public get childrenMap() {
        return this._childrenMap;
    }
    private onValueChangeCallback: Function = null;
    public name: string = ''
    public _fullPath: string = ''
    public nodeType: NodeType;
    get fullPath() {
        if (!!!this._fullPath) {
            if (this.parent == null || this.parent == RedDotManager.instance.root) {
                this._fullPath = this.name;
            }
            else {
                this._fullPath = this.parent.fullPath + RedDotManager.instance.splitChar + this.name;
            }
        }
        return this._fullPath;
    }

    public value: number = 0
    public parent: TreeNode = null;
    constructor(name: string, fullPath?: string, parent?: TreeNode, nodeType: NodeType = NodeType.Static) {
        this.name = name;
        this.value = 0;
        this.nodeType = nodeType;
        this.onValueChangeCallback = null;
        if (parent) {
            this.parent = parent;
        }
    }

    public setListener(callback) {
        this.onValueChangeCallback = callback;
    }

    public getListener() {
        return this.onValueChangeCallback;
    }

    public removeListener() {
        this.onValueChangeCallback = null;
    }

    public removeAllListener() {
        this.onValueChangeCallback = null;
    }

    public updateValue(newValue?) {
        if (newValue !== undefined && newValue !== null) {
            if (this._childrenMap != null && this._childrenMap.size != 0) {
                cc.error("不允许直接改变非叶子节点的值：" + this.fullPath);
            }

        } else {
            newValue = 0;
            if (this._childrenMap != null && this._childrenMap.size != 0) {
                this._childrenMap.forEach((value, key) => {
                    newValue += value.value;
                })
            }
        }
        if (this.value == newValue) {
            return;
        }
        this.value = newValue > 0 ? newValue : 0;
        cc.log('updateValue', this.fullPath, this.value);
        this.onValueChangeCallback && this.onValueChangeCallback(newValue);
        this.parent && this.parent.updateValue();
        if (this.value == 0 && this.nodeType == NodeType.Dynamic) {
            RedDotManager.instance.clean(this.fullPath);
        }
    }

    public addValue(value: number) {
        this.updateValue(value + this.value)
    }

    public getChildByName(key: string) {
        let child = this._childrenMap.get(key);
        return child;
    }


    public addChild(node: TreeNode, name) {
        if (this._childrenMap.has(name)) {
            cc.error("子节点" + name + "添加失败，不允许重复添加：");
        } else {
            this._childrenMap.set(name, node);
        }
    }

    public removeFromParent() {
        this.parent?.removeChild(this.name);
    }

    public removeChild(key: string) {
        if (this._childrenMap == null || this._childrenMap.size == 0) {
            return false;
        }
        let child = this.getChildByName(key);
        if (child != null) {
            this._childrenMap.delete(key);
            child.parent = null;
            this.updateValue();
            return true;
        }
        return false;
    }

    public toString() {
        return this.fullPath;
    }

    private internalChangeValue(newValue) {

    }
}


