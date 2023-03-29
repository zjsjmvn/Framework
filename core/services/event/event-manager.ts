import { error, log, warn } from 'cc';
import { singleton } from '../../utils/decorator/singleton';

interface EventListener {
    callBack: Function,
    target: any,
}
@singleton
export class EventManager {
    /**
     * @description 单例,只是为了智能提示。instance会被singleton装饰器赋值。
     * @static
     * @type {AdsManager}
     * @memberof AdsManager
     */
    public static instance: EventManager = null
    private _eventListeners: Map<string, Array<EventListener>> = new Map();
    /**
     * @description 无主的事件，当发射的事件没有listener时，就存在这里。
     * @private
     * @type {Map<string, { eventData: any, pickTimes: number }>}
     * @memberof EventManager
     */
    private _unattendedEventsMap: Map<string, { eventData: any, pickTimes: number }> = new Map();
    private getEventListenersIndex(eventName: string, callBack: Function, target?: any): number {
        let index = -1;
        const handlers = this._eventListeners.get(eventName);
        for (let i = 0; i < handlers.length; i++) {
            if (handlers[i].callBack == callBack && handlers[i].target == target) {
                index = i;
                break;
            }
        }
        return index;
    }

    addEventListener(eventName: string, callBack: Function, target?: any): boolean {
        if (!eventName) {
            warn("eventName is empty" + eventName);
            return;
        }
        if (null == callBack) {
            log('addEventListener callBack is null');
            return false;
        }
        let handler: EventListener = { callBack: callBack, target: target };
        const handlers = this._eventListeners.get(eventName);
        if (handlers) {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (index == -1) {
                handlers.push(handler);
            }
        } else {
            this._eventListeners.set(eventName, [handler]);
        }
        return true;
    }
    on(eventName: string, callBack: Function, target?: any): boolean {
        return this.addEventListener(eventName, callBack, target);
    }


    removeEventListener(eventName: string, callBack: Function, target?: any) {
        const handlers = this._eventListeners.get(eventName);
        if (null != handlers) {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (-1 != index) {
                handlers.splice(index, 1);
            }
        }
    }
    off(eventName: string, callBack: Function, target?: any) {
        return this.removeEventListener(eventName, callBack, target);
    }
    /**
     * @description 
     * @param {string} eventName
     * @param {*} [eventData]
     * @param {number} [pickTimes]  被拾取的次数。
     * @memberof EventManager
     */
    public fireEvent(eventName: string, eventData?: any, pickTimes?: number) {
        // 如果获取不到，不代表要丢弃，有可能战斗场景中发出的消息需要在主场景中监听，但是主场景当前不存在
        if (null != this._eventListeners.get(eventName)) {
            // 将所有回调提取出来，再调用，避免调用回调的时候操作了事件的删除
            let eventHandlers: EventListener[] = [];
            for (const iterator of this._eventListeners.get(eventName)) {
                eventHandlers.push({ callBack: iterator.callBack, target: iterator.target });
            }
            for (const iterator of eventHandlers) {
                iterator.callBack.call(iterator.target, eventData);
            }
        } else if (null == this._eventListeners.get(eventName) && !!!pickTimes) {
            error('eventName:' + eventName + ' 不存在listener');
        }
        if (pickTimes > 0) {
            this._unattendedEventsMap.set(eventName, { eventData, pickTimes });
        }
    }

    public emit(eventName: string, eventData?: any, pickTimes?: number) {
        this.fireEvent(eventName, eventData, pickTimes);
    }

    /** 
    主动拾取事件，主要用途：如玩家在游戏内获得金币，回到主界面时，主界面的金币Label要显示一些动画。这时，在回到主界面时，先注册事件，然后在主动拾取事件。
    eg:
        // 注册事件。
        EventManager.instance.addEventListener(EventNames.MainCoin, this.coinUpdate, this);
        // 主动拾取事件
        EventManager.instance.pickAndFireEvent(EventNames.MainCoin);
    */
    public pickEvent(eventName: string) {
        let event = this._unattendedEventsMap.get(eventName);
        if (event) {
            event.pickTimes--;
            this.fireEvent(eventName, event.eventData);
            if (event.pickTimes == 0) {
                this._unattendedEventsMap.delete(eventName);
            }
        }
    }



}
