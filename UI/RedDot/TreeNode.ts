import RedDotManager from './RedDotManager';

/// <summary>
/// 树节点
/// </summary>
export default class TreeNode {

    /// <summary>
    /// 子节点
    /// </summary>
    private children: Map<string, TreeNode>;

    /// <summary>
    /// 节点值改变回调
    /// </summary>
    private changeCallback: Function;

    /// <summary>
    /// 节点名
    /// </summary>
    public name: string


    /// <summary>
    /// 完整路径
    /// </summary>
    public _fullPath: string

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

    /// <summary>
    /// 节点值
    /// </summary>
    public value: number

    /// <summary>
    /// 父节点
    /// </summary>
    public parent: TreeNode


    constructor(name: string, parent?) {
        this.name = name;
        this.value = 0;
        this.changeCallback = null;
        if (parent) {
            this.parent = parent;
        }
    }


    /// <summary>
    /// 添加节点值监听
    /// </summary>
    public addListener(callback) {
        this.changeCallback = callback;
    }

    /// <summary>
    /// 移除节点值监听
    /// </summary>
    public removeListener(callback) {
        this.changeCallback = callback;
    }

    /// <summary>
    /// 移除所有节点值监听
    /// </summary>
    public removeAllListener() {
        this.changeCallback = null;
    }

    public changeValue(newValue?) {
        if (newValue !== undefined && newValue !== null) {
            if (this.children != null && this.children.size != 0) {
                cc.error("不允许直接改变非叶子节点的值：" + this.fullPath);
            }
        } else {
            newValue = 0;
            if (this.children != null && this.children.size != 0) {
                this.children.forEach((value, key) => {
                    newValue += value.value;
                })
            }
        }

        if (this.value == newValue) {
            return;
        }
        this.value = newValue;
        this.changeCallback && this.changeCallback(newValue);
        this.parent && this.parent.changeValue();
    }


    /// <summary>
    /// 获取子节点，如果不存在则添加
    /// </summary>
    public getOrAddChild(key: string): TreeNode {
        let child = this.getChild(key);
        if (child == null) {
            child = this.addChild(key);
        }
        return child;
    }

    /// <summary>
    /// 获取子节点
    /// </summary>
    public getChild(key: string) {
        if (this.children == null) {
            return null;
        }
        let child = this.children.get(key);
        return child;
    }

    /// <summary>
    /// 添加子节点
    /// </summary>
    public addChild(key: string) {
        if (this.children == null) {
            this.children = new Map<string, TreeNode>();
        }
        else if (this.children.has(key)) {
            cc.error("子节点添加失败，不允许重复添加：" + this.fullPath);
        }

        let lastIndex = key.lastIndexOf(RedDotManager.instance.splitChar);

        let child = new TreeNode(key.substring(lastIndex + 1, key.length), this);
        this.children.set(key, child);
        RedDotManager.instance.addNodeToAllNodes(key, child);
        RedDotManager.instance.nodeNumChangeCallback?.Invoke();
        return child;
    }

    /// <summary>
    /// 移除子节点
    /// </summary>
    public removeChild(key: string) {
        if (this.children == null || this.children.size == 0) {
            return false;
        }
        let child = this.getChild(key);
        if (child != null) {
            this.children.delete(key);
            child.parent = null;
            this.changeValue();
            return true;
        }
        return false;
    }

    /// <summary>
    /// 移除所有子节点
    /// </summary>
    public removeAllChild() {
        if (this.children == null || this.children.size == 0) {
            return;
        }
        this.children.clear();
        RedDotManager.instance.markDirtyNode(this);
        RedDotManager.instance.nodeNumChangeCallback?.Invoke();
    }

    public toString() {
        return this.fullPath;
    }

    /// <summary>
    /// 改变节点值
    /// </summary>
    private internalChangeValue(newValue) {

    }
}


