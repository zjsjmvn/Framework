import TreeNode from './TreeNode';
import { singleton } from '../../Tools/Decorator/Singleton';
/// <summary>
/// 红点管理器
/// </summary>
@singleton
export default class RedDotManager {
    public static instance: RedDotManager;
    /// <summary>
    /// 所有节点集合
    /// </summary>
    private allNodes: Map<string, TreeNode>;

    /// <summary>
    /// 脏节点集合
    /// </summary>
    private dirtyNodes: Array<TreeNode>;

    /// <summary>
    /// 临时脏节点集合
    /// </summary>
    private tempDirtyNodes: Array<TreeNode>;

    /// <summary>
    /// 节点数量改变回调
    /// </summary>
    public nodeNumChangeCallback;

    /// <summary>
    /// 节点值改变回调
    /// </summary>
    public nodeValueChangeCallback;//Action<TreeNode, int> NodeValueChangeCallback;

    /// <summary>
    /// 路径分隔字符
    /// </summary>
    public splitChar: string;


    /// <summary>
    /// 缓存的StringBuild
    /// </summary>
    public cachedSb: string;


    /// <summary>
    /// 红点树根节点
    /// </summary>
    public root: TreeNode;



    constructor() {
        this.splitChar = '/';
        this.allNodes = new Map<string, TreeNode>();
        this.root = new TreeNode("Root");
        this.dirtyNodes = new Array<TreeNode>();
        this.tempDirtyNodes = new Array<TreeNode>();
    }


    /// <summary>
    /// 移除所有节点值监听
    /// </summary>
    public removeAllListener(path) {
        let node = this.getTreeNode(path);
        node.removeAllListener();
    }

    addTreeNodeAndCallback(path: string, callback) {
        if (!!!path) {
            cc.error("路径不合法，不能为空");
        }
        let node = this.allNodes.get(path);
        if (node) {
            cc.error('已经存在路径');
        }
        let cur = this.root;
        let length = path.length;
        let startIndex = 0;
        for (let i = 0; i < length; i++) {
            if (path[i] == this.splitChar) {
                if (i == length - 1) {
                    cc.error("路径不合法，不能以路径分隔符结尾：" + path);
                }
                let endIndex = i - 1;
                if (endIndex < startIndex) {
                    cc.error("路径不合法，不能存在连续的路径分隔符或以路径分隔符开头：" + path);
                }
                let child = cur.getOrAddChild(path.substring(0, endIndex + 1));
                //更新startIndex
                startIndex = i + 1;
                cur = child;
            }
        }
        let target = cur.getOrAddChild(path);
        target.addListener(callback);
        return target;
    }

    /// <summary>
    /// 移除节点
    /// </summary>
    public removeTreeNode(path) {
        if (!this.allNodes.has(path)) {
            cc.error('removeTreeNode fail');
        }
        let node = this.getTreeNode(path);
        node.removeAllListener();
        this.removeNodeFromAllNodes(path);
        return node.parent.removeChild(path);
    }


    /// <summary>
    /// 改变节点值
    /// </summary>
    public changeValue(path, newValue) {
        let node = this.getTreeNode(path);
        node.changeValue(newValue);
    }

    /// <summary>
    /// 获取节点值
    /// </summary>
    public getValue(path) {
        let node = this.getTreeNode(path);
        if (node == null) {
            return 0;
        }
        return node.value;
    }

    /// <summary>
    /// 获取节点
    /// </summary>
    public getTreeNode(path: string) {
        if (!!!path) {
            cc.error("路径不合法，不能为空");
        }
        let node = this.allNodes.get(path);
        if (!!!node) {
            cc.error('getTreeNode fail')
        }
        return node;
    }



    addNodeToAllNodes(key: string, value: TreeNode) {
        this.allNodes.set(key, value);
    }
    removeNodeFromAllNodes(key: string) {
        this.allNodes.delete(key);
    }



    /// <summary>
    /// 移除所有节点
    /// </summary>
    public removeAllTreeNode() {
        this.root.removeAllChild();
        this.allNodes.clear();
    }

    /// <summary>
    /// 管理器轮询
    /// </summary>
    public update() {
        if (this.dirtyNodes.length == 0) {
            return;
        }
        this.tempDirtyNodes.splice(0);
        this.dirtyNodes.forEach(element => {
            this.tempDirtyNodes.push(element);
        });
        this.dirtyNodes.splice(0);
        //处理所有脏节点
        for (let i = 0; i < this.tempDirtyNodes.length; i++) {
            this.tempDirtyNodes[i].changeValue();
        }
    }

    /// <summary>
    /// 标记脏节点
    /// </summary>
    public markDirtyNode(node) {
        if (node == null || node.Name == this.root.name) {
            return;
        }
        this.dirtyNodes.push(node);
    }

}


