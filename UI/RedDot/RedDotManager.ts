import TreeNode, { NodeType } from './TreeNode';
import { singleton } from '../../Tools/Decorator/Singleton';


/**
 * @description 文档请看同目录下readme.md
 * @export
 * @class RedDotManager
 */
@singleton
export default class RedDotManager {
    // 此变量单纯为了提示用的，可以不写。在singleton里已经存在。
    public static instance: RedDotManager;
    private allNodesMap: Map<string, TreeNode>;
    public nodeValueChangeCallback;
    public splitChar: string = '_';
    public root: TreeNode;
    /**
     * @description 携带这个字符串的节点，将视为动态节点，动态节点会被RedDotManager清楚，而非动态节点
     * @memberof RedDotManager
     */
    public dynamicRedDotNodeFlag = '----540ec1b6-61fe-4a0f-bcc8-8ee7ad4bbc3f----';
    constructor() {
        this.allNodesMap = new Map<string, TreeNode>();
        this.root = new TreeNode("Root");
    }

    public addPathAndBindListener(path: string, callback) {
        cc.log('addPathAndBindListener', path);
        this.addPath(path);
        this.bindListenerToPath(path, callback);
    }

    public addPath(path: string) {
        cc.log('addPath', path);
        if (!!!path) {
            cc.error("路径不合法，不能为空");
        }
        let node = this.allNodesMap.get(path);
        if (node) {
            // 路径已经存在的话，那么就是计算过了、没必要在执行一次了。
            return;
        }
        let theSplitPathArr = path.split(this.splitChar);
        cc.log('path', theSplitPathArr);
        let hasEmptyString = theSplitPathArr.find((str) => {
            return str == '';
        });
        if (hasEmptyString) {
            cc.error('path 定义错误，含有非法字符。');
        }
        // 指针，指向root
        let pointer = this.root;
        let nodePath = ''
        let forEachIndex = 0;
        theSplitPathArr.forEach((str) => {
            if (forEachIndex == 0) {
                nodePath += str;
            } else {
                nodePath += ('_' + str);
            }
            forEachIndex++;
            cc.log('nodePath', nodePath)
            let child = pointer.getChildByName(str);
            if (!child) {
                if (str.match(this.dynamicRedDotNodeFlag)) {
                    //表示这个节点是动态节点。 
                    child = new TreeNode(str, nodePath, pointer, NodeType.Dynamic);
                } else {
                    child = new TreeNode(str, nodePath, pointer);
                }
                pointer.addChild(child, str);
                this.addNodeToNodesMap(nodePath, child);
            }
            // 指针更换指向。
            pointer = child;
        })
        return pointer;
    }

    public bindListenerToPath(path: string, listener: Function) {
        let finalNode = this.getTreeNode(path);
        if (!finalNode) {
            finalNode = this.addPath(path);
        }
        finalNode.setListener(listener);
        if (this.getValue(path) > 0) {
            listener && listener(this.getValue(path));
        }
    }

    public addValue(path, addValue: number) {
        cc.log('addValue', path, addValue);
        let node = this.getTreeNode(path);
        node.addValue(addValue);
    }


    public clean(path: string) {
        let finalNode = this.getTreeNode(path, false);
        if (!finalNode) {
            return;
        }
        if (finalNode.nodeType == NodeType.Dynamic) {
            finalNode.removeFromParent();
            this.removeNodeFromNodesMap(path);
        } else {
            finalNode.removeListener();
        }
    }

    public removeListener(path: string) {
        let finalNode = this.getTreeNode(path, false);
        if (!finalNode) {
            return;
        }
        finalNode.removeListener();

    }

    public changeValue(path: string, newValue: number) {
        let node = this.getTreeNode(path);
        node.updateValue(newValue);
    }

    public getValue(path, createIfInexistence: boolean = true) {
        let node = this.getTreeNode(path, createIfInexistence);
        if (!node) {
            return 0;
        }
        return node.value;
    }

    /**
     * @description 
     * @param {string} path
     * @returns 
     * @memberof RedDotManager
     */
    public getTreeNode(path: string, createIfInexistence: boolean = true) {
        if (!!!path) {
            cc.error("路径不能为空");
        }
        let node = this.allNodesMap.get(path);
        if (!node && createIfInexistence) {
            node = this.addPath(path);
        }
        return node;
    }


    public hasTreeNode(path: string) {
        return this.allNodesMap.has(path);
    }

    private addNodeToNodesMap(key: string, value: TreeNode) {
        cc.log('addNodeToNodesMap', key);
        this.allNodesMap.set(key, value);
    }

    public removeNodeFromNodesMap(key: string) {
        this.allNodesMap.delete(key);
    }


    public showValues() {
        this.allNodesMap.forEach((value, key) => {
            cc.log('showValues：', key, value.value);
        })
    }

}

