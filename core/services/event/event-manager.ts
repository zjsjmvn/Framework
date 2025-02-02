import { error, log, warn } from 'cc';
import { singleton } from '../../utils/decorator/singleton';
import { Component } from 'cc';
import { Node } from 'cc';

// 定义事件监听器的类
class EventListener<T = any> {
    public eventName: string;
    public callBack: (data: T) => void; // 回调函数，接受一个泛型参数
    public target?: any; // 回调的目标对象
    public tag?: string; // 可选的标签
    constructor(eventName, callBack: (data: T) => void, target?: any, tag?: string) {
        this.eventName = eventName;
        this.callBack = callBack;
        this.target = target;
        this.tag = tag;
    }


    bindToDestroyableTarget(target: Node | Component) {
        let removeFunc = () => {
            if (!!this.tag) {
                EventManager.instance.removeEventListenerByTag(this.eventName, this.tag);
            } else {
                EventManager.instance.removeEventListener(this.eventName, this.callBack, this.target);
            }
        };

        let node: Node = null;
        if (target instanceof Node) {
            node = target;
        } else if (target instanceof Component) {
            node = target.node;
        }
        node.once(Node.EventType.NODE_DESTROYED, removeFunc);
    }
}

@singleton
export class EventManager {
    public static instance: EventManager = null;

    // 使用泛型约束事件监听器
    private _eventListeners: Map<string, EventListener<any>[]> = new Map();


    /**
     * 获取事件监听器的索引
     * @param eventName 事件名称
     * @param callBack 回调函数
     * @param target 目标对象
     * @returns 监听器的索引，如果未找到则返回 -1
     */
    private getEventListenersIndex<T>(eventName: string, callBack: (data: T) => void, target?: any): number {
        const handlers = this._eventListeners.get(eventName);
        if (!handlers) return -1;

        return handlers.findIndex(handler =>
            handler.callBack === callBack && handler.target === target
        );
    }

    /**
     * 添加事件监听器
     * @param eventName 事件名称
     * @param callBack 回调函数
     * @param target 目标对象
     * @param tag 可选的标签
     * @returns 是否添加成功
     */
    public addEventListener<T>(eventName: string, callBack: (data: T) => void, target?: any, tag?: string): EventListener {
        if (!eventName) {
            warn(`Event name is empty: ${eventName}`);
            return null;
        }
        if (!callBack) {
            log('Callback is null');
            return null;
        }

        let handler = new EventListener(eventName, callBack, target, tag);
        const handlers = this._eventListeners.get(eventName);
        if (handlers) {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (index == -1) {
                handlers.push(handler);
            }
        } else {
            this._eventListeners.set(eventName, [handler]);
        }
        return handler;
    }

    /**
     * 添加事件监听器（简写）
     * @param eventName 事件名称
     * @param callBack 回调函数
     * @param target 目标对象
     * @returns 是否添加成功
     */
    public on<T>(eventName: string, callBack: (data: T) => void, target?: any): EventListener {
        return this.addEventListener(eventName, callBack, target);
    }

    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param callBack 回调函数
     * @param target 目标对象
     */
    public removeEventListener<T>(eventName: string, callBack: (data: T) => void, target?: any): void {
        const handlers = this._eventListeners.get(eventName);
        if (!handlers) return;

        const index = this.getEventListenersIndex(eventName, callBack, target);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * 通过标签移除事件监听器
     * @param eventName 事件名称
     * @param tag 标签
     * @returns 是否移除成功
     */
    public removeEventListenerByTag(eventName: string, tag: string): boolean {
        if (!eventName) {
            warn(`Event name is empty: ${eventName}`);
            return false;
        }

        const handlers = this._eventListeners.get(eventName);
        if (!handlers) return false;

        for (let i = handlers.length - 1; i >= 0; i--) {
            if (handlers[i].tag === tag) {
                handlers.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * 移除指定事件的所有监听器
     * @param eventName 事件名称
     */
    public removeAllSpecifiedEventListeners(eventName: string): void {
        this._eventListeners.delete(eventName);
    }

    /**
     * 移除事件监听器（简写）
     * @param eventName 事件名称
     * @param callBack 回调函数
     * @param target 目标对象
     */
    public off<T>(eventName: string, callBack: (data: T) => void, target?: any): void {
        this.removeEventListener(eventName, callBack, target);
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param eventData 事件数据
     */
    public fireEvent<T>(eventName: string, eventData?: T): void {
        const handlers = this._eventListeners.get(eventName);
        if (handlers) {
            // 创建副本以避免在回调中修改监听器时出现问题
            const eventHandlers = handlers.map(handler => ({
                callBack: handler.callBack,
                target: handler.target
            }));

            eventHandlers.forEach(handler => {
                if (handler.target) {
                    handler.callBack.call(handler.target, eventData);
                } else {
                    handler.callBack(eventData);
                }
            });
        } else {
            error(`Event name: ${eventName} does not have any listeners`);
        }
    }

    /**
     * 触发事件（简写）
     * @param eventName 事件名称
     * @param eventData 事件数据
     */
    public emit<T>(eventName: string, eventData?: T): void {
        this.fireEvent(eventName, eventData);
    }


}