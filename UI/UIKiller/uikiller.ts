import { TouchEvent } from '../../Guide/GuideHelper';

/**
 * 注意：
 * 和git的uikiller不同
 * 303行和原版不一致，原版为touchstart返回false才会穿透，move不会。改为false也会穿透。
 */

const DEFAULT_EVENT_NAMES = [
    '_onTouchStart',
    '_onTouchMove',
    '_onTouchEnd',
    '_onTouchCancel',
];
/**
 * ### 绑定规则。
 * 被bindComponent绑定的组件，
 * - 自身会绑定触摸事件。为_onTouchStart,_onTouchMove,_onTouchEnd,_onTouchCancel。
 * - 其子节点按顺序绑定其node上。如nodeA.nodeB.nodeC.nodeD。可以链式访问。
 * - 特别的:
 *  - 如果子节点是下划线_开头，则会监听触摸事件。并且直接绑定到脚本上。可以使用脚本直接访问。
 *  - 如果子节点是下划线+名字+$+数字。如：_image$1，则为其绑定触摸事件。事件类型为           
 *          `_on${name}TouchStart`,
            `_on${name}TouchMove`,
            `_on${name}TouchEnd`,
            `_on${name}TouchCancel`,
      并且节点下添加$属性。$值为其后面的数字。   
 * @example
 * ```js
 * 
 * ```
 */
export default class UIKiller {

    private static _prefix: string = '_'
    private static _plugins: Array<any> = [];

    /**
     * 绑定组件
     * @param {cc.Component} component  要绑定的组件 
     * @param {Object} options          绑定选项
     */
    public static bindComponent(componentScript, options?) {
        componentScript.$options = options || {};
        let root = componentScript.node;
        //绑定根节点触摸事件
        this._bindTouchEvent(root, componentScript, DEFAULT_EVENT_NAMES);
        //绑定所有组件子节点
        this._bindNode(root, componentScript);
    }


    /**
     * 递归绑定节点
     * @param {cc.Node} nodeObject //当前要绑定的节点
     * @param {Object} rootNodeScript // 根节点的脚本。主要用于下划线开头的子节点的触摸事件 绑定到根节点的脚本上。
     */
    private static _bindNode(nodeObject: cc.Node, rootNodeScript) {

        //绑定组件到自身node节点上,在node下直接使用$+组件类型即可访问。
        if (nodeObject.name[0] === this._prefix) {
            nodeObject._components.forEach((component) => {
                let name = this._getComponentName(component);
                name = `$${name}`;
                if (nodeObject[name]) {
                    return;
                }
                nodeObject[name] = component;
                //检查组件 onBind 函数,通知组件,target 对象在绑定自己
                if (this.isFunction(component.onBind)) {
                    component.onBind(rootNodeScript);
                }
            });
        }

        //绑定子节点
        nodeObject.children.forEach((child) => {
            let name = child.name;
            // 子节点绑定到父节点上。通过 父节点node.子节点名字访问。如：nodeA.nodeB.nodeC;
            if (!nodeObject[name]) {
                nodeObject[name] = child;
            }
            // 如果子节点是下划线开头的则绑定其触摸事件，并且直接绑定到脚本上
            if (name[0] === this._prefix) {
                // 如果是下划线开头，并且name中包含$+数字则去掉$可以直接访问。如：_image$1  访问方式为：_image1 并且为其_image绑定触摸事件。
                let index = name.indexOf('$');
                if (index !== -1) {
                    child.$eventName = name.substr(0, index);
                    child.$ = name.substr(index + 1);
                    name = child.$eventName + child.$[0].toUpperCase() + child.$.substr(1);
                    if (!CC_EDITOR) {
                        child.name = name;
                    }
                }
                if (rootNodeScript[name]) {
                    cc.warn(`${rootNodeScript.name}.${name} property is already exists`);
                } else {
                    this._bindTouchEvent(child, rootNodeScript);
                    rootNodeScript[name] = child;
                }
            }
            this._bindNode(child, rootNodeScript);
        });
    }
    /**
     * 获取组件名字
     * @param {cc.Component} component 
     */
    static _getComponentName(component) {
        return component.name.match(/<.*>$/)[0].slice(1, -1);
    }
    /**
     * 绑定触摸事件
     * @param {cc.Node} node 
     * @param {String} event 
     */
    private static _getTouchEventName(node, event?): any {
        let name = node.$eventName || node.name;
        if (name) {
            name = name[this._prefix.length].toUpperCase() + name.slice(this._prefix.length + 1);
        }


        if (event) {
            return `_on${name}${event}`;
        }

        return [
            `_on${name}TouchStart`,
            `_on${name}TouchMove`,
            `_on${name}TouchEnd`,
            `_on${name}TouchCancel`,
        ];
    }

    /**
     * 绑定事件
     * @param {cc.Node} node
     */
    private static _bindTouchEvent(node: cc.Node, rootNodeScript, defaultNames?) {
        //todo: EditBox 组件不能注册触摸事件,在原生上会导致不能被输入
        if (node.getComponent(cc.EditBox)) {
            return;
        }

        const eventNames = defaultNames || this._getTouchEventName(node);

        const eventTypes = [
            cc.Node.EventType.TOUCH_START,
            cc.Node.EventType.TOUCH_MOVE,
            cc.Node.EventType.TOUCH_END,
            cc.Node.EventType.TOUCH_CANCEL,
        ];

        eventNames.forEach((eventName, index) => {
            const tempEvent = rootNodeScript[eventName];
            if (!tempEvent && !node.getComponent(cc.Button)) {
                return;
            }


            node.on(eventTypes[index], (event: cc.Event.EventTouch) => {
                //被禁用的node 节点不响应事件
                let eventNode = event.currentTarget;
                if (eventNode.interactable === false || eventNode.active === false) {
                    return;
                }

                //检查button组件是否有事件处理函数，有则执行插件事件处理
                const button = eventNode.getComponent(cc.Button);
                if (button && button.interactable === false) {
                    return;
                }
                const eventFunc = rootNodeScript[eventName];

                //是否有效事件
                const isValidEvent = eventFunc || (button && button.clickEvents.length);
                if (isValidEvent) {
                    this._beforeHandleEventByPlugins(eventNode, event, !!eventFunc);
                } else {
                    // cc.log('isValidEvent false')
                }

                //执行事件函数，获取返回值
                let eventResult;
                if (eventFunc) {
                    //cc.log("eventNode._touchListener"+eventNode._touchListener.swallowTouches+" eventFunc "+eventFunc);
                    // if( event.type === cc.Node.EventType.TOUCH_START ||
                    //     event.type != cc.Node.EventType.TOUCH_START && eventNode._touchListener.swallowTouches
                    // )
                    {


                        eventResult = eventFunc.call(rootNodeScript, event);
                        //cc.log("target, eventNode, event"+target+eventNode+event);
                        //只要是触摸事件返回fasle，都使节点可穿透
                        //event.type === cc.Node.EventType.TOUCH_START &&




                        let result = true;
                        if (eventResult instanceof Promise) {
                            eventResult.then((value) => {
                                result = value;
                            })
                        } else if (typeof eventResult == "boolean") {
                            result = eventResult;
                        }


                        if (result === false) {
                            eventNode._touchListener.setSwallowTouches(false);
                        } else {
                            eventNode._touchListener.setSwallowTouches(true);
                            event.stopPropagation();
                        }
                    }
                }

                //检查button组件是否有事件处理函数，有则执行插件事件处理
                if (isValidEvent) {
                    this._afterHandleEventByPlugins(eventNode, event, !!eventFunc, eventResult);
                }
            });
        });

        //绑定长按事件
        this._bindTouchLongEvent(node, rootNodeScript);
    }

    /**
     * 绑定长按事件
     * @param {cc.Node} node
     */
    private static _bindTouchLongEvent(nodeObject, rootNodeScript) {
        const node = nodeObject;
        const eventName = this._getTouchEventName(node, 'TouchLong');
        const touchLong = rootNodeScript[eventName];
        if (!this.isFunction(touchLong)) {
            return;
        }

        node._touchLongTimer = null;
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (node._touchLongTimer) {
                clearTimeout(node._touchLongTimer);
                node._touchLongTimer = 0;
                delete node.interactable;
            }
        });

        node.on(cc.Node.EventType.TOUCH_START, (event) => {
            node._touchLongTimer = setTimeout(() => {
                //准备触发touchLong事件
                node.interactable = !!touchLong.call(rootNodeScript, node, event);
                node._touchLongTimer = 0;
            }, node.touchLongTime || 1000);
        });
    }

    /**
     * 拿所有插件去检查node 节点, onCheckNode返回为 false 的,此节点将不被绑定
     * @param node
     * @param target
     * @returns {boolean}
     * @private
     */

    public static registerPlugin(plugins) {
        if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }

        plugins.forEach((plugin) => {
            //插件能不重复
            let findPlugin = this._plugins.find(item => item.name === plugin.name || item === plugin);
            if (findPlugin) {
                return;
            }

            //执行插件注册事件
            this._plugins.push(plugin);
            if (plugin.onRegister) {
                plugin.onRegister();
            }
        });
    }

    public static unregisterPlugin(plugin) {
        if (plugin || plugin.name) {
            let index = this._plugins.findIndex(item => item.name === plugin.name || item === plugin);
            if (index >= 0) {
                this._plugins.splice(index, 1);
            }

        }
    }

    /**
     * 插件响应节点触摸前事件
     * @param node
     * @param event
     * @private
     */
    static _beforeHandleEventByPlugins(node, event, hasEventFunc) {
        this._plugins.forEach((item) => {
            if (item.onBeforeHandleEvent) {
                item.onBeforeHandleEvent(node, event, hasEventFunc);
            }
        });
    }

    /**
     * 插件响应节点触摸后事件
     * @param node
     * @param event
     * @private
     */
    static _afterHandleEventByPlugins(node, event, hasEventFunc, eventResult) {
        this._plugins.forEach((item) => {
            if (item.onAfterHandleEvent) {
                item.onAfterHandleEvent(node, event, hasEventFunc, eventResult);
            }
        });
    }

    static isFunction = function (value) {
        return typeof value === 'function';
    };
}