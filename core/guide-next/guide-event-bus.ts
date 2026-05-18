import { EventManager } from '../services/event/event-manager';
import { IGuideEventBus } from './guide-types';

/** 引导事件总线适配器：把 guide-next 的事件步骤接到项目已有 EventManager。 */
export class GuideEventBus implements IGuideEventBus {
    /** 监听项目事件。 */
    public on(eventName: string, callback: (data?: any) => void, target?: any): any {
        return EventManager.instance.on(eventName, callback, target);
    }

    /** 取消监听项目事件。 */
    public off(eventName: string, callback: (data?: any) => void, target?: any): void {
        EventManager.instance.off(eventName, callback, target);
    }

    /** 派发项目事件。 */
    public emit(eventName: string, data?: any): void {
        EventManager.instance.emit(eventName, data);
    }
}
