import { GuideController } from "./GuideController";
import { GuideView } from "./GuideView";
import { GuideStep } from "./GuideStep";

export module GuideHelper {
    export class Locator {

        /**
         * 定位解析
         * @param locatorName
         * @returns {Array}
         */
        public static parse(locatorName) {

            //使用正则表达示分隔名字
            let names = locatorName.split(/[.,//,>,#]/g);
            let segments = names.map((name) => {
                let index = locatorName.indexOf(name);
                let symbol = locatorName[index - 1] || '>';     // >表示节点为首节点
                return { symbol: symbol, name: name.trim() };
            });
            return segments;
        }

        /**
         * 通过节点名搜索节点对象
         * @param root
         * @param name
         * @returns {*}
         */
        public static seekNodeByName(root, name) {
            if (!root)
                return null;
            if (root.getName() == name)
                return root;
            let arrayRootChildren = root.getChildren();
            let length = arrayRootChildren.length;
            for (let i = 0; i < length; i++) {
                let child = arrayRootChildren[i];
                let res = this.seekNodeByName(child, name);
                if (res != null)
                    return res;
            }
            return null;
        }

        /**
         * deprecated
         * 通过Tag搜索节点
         * @param root
         * @param tag
         * @returns {*}
         */
        public static seekNodeByTag(root, tag) {
            if (!root)
                return null;
            if (root.getTag() == tag)
                return root;
            let arrayRootChildren = root.getChildren();
            let length = arrayRootChildren.length;
            for (let i = 0; i < length; i++) {
                let child = arrayRootChildren[i];
                let res = this.seekNodeByTag(child, tag);
                if (res != null)
                    return res;
            }
            return null;
        }

        /**
         * 在root节点中，定位locator
         * @param root
         * @param locateNodes
         * @param cb
         */
        public static locateNode(root, locateNodes, cb = null): Array<cc.Node> {

            let nodes = [];
            //mmgg
            for (let i in locateNodes) {
                let segments = this.parse(locateNodes[i]);
                let child, node = root;

                for (let j = 0; j < segments.length; j++) {
                    let item = segments[j];
                    cc.log('item', JSON.stringify(item));
                    switch (item.symbol) {
                        case '/': child = node.getChildByName(item.name); break;
                        case '.': child = node[item.name]; break;
                        case '>': child = this.seekNodeByName(node, item.name); break;
                        case '#': child = this.seekNodeByTag(node, item.name); break;
                    }
                    if (!child) {
                        node = null;
                        break;
                    }
                    node = child;
                }

                if (!!child) {
                    nodes.push(child);
                }
            }
            if (cb) {
                cb(nodes);

            }
            return nodes;
        }
    }
    export class GuideConfig {
        public guideName: string = "";
        public task: Array<GuideStep> = new Array<GuideStep>();

    }
    export enum TouchEvent {
        START,
        MOVE,
        END,
        CANCEL,
        LONG,
    }
    /**
     * 
     * @param target 为目标节点添加引导层
     * @param guidConfig 引导配置文件
     * @param childIndex 
     * @param guidePrePath 引导层预制体路径
     */
    export function createGuide(target, guidConfig: GuideConfig, guidePrePath, exitCallback = null, childIndex = 0) {
        cc.resources.load(guidePrePath, cc.Prefab, (error, data) => {
            if (!error) {
                let guideNode: cc.Node = cc.instantiate(data);
                guideNode.position = cc.v2(0, 0);
                let guideView = guideNode.getComponent(GuideView);
                let guideController: GuideController = guideNode.getComponent(GuideController);
                guideController._guideView = guideView;
                guideController._target = target;
                guideController._guideConfig = guidConfig;
                guideController._exitCallback = exitCallback;
                if (childIndex) {
                    cc.director.getScene().getChildByName('Canvas').addChild(guideNode, childIndex);
                } else {
                    cc.director.getScene().getChildByName('Canvas').addChild(guideNode);

                }
            } else {
                console.error("Guide create: " + error);
            }
        });
    }
}










