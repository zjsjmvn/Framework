import { Component } from "cc";
export class ExtendCCComponent extends Component {
    protected onDestroy() {
        this.stopAllScheduler();

    }
    //#region //! 调度功能
    private __im_SchedulerMap: Map<string, Function> = null;
    private get _I_SchedulerMap(): Map<string, Function> { if (this.__im_SchedulerMap === null) { this.__im_SchedulerMap = new Map(); } return this.__im_SchedulerMap; }
    protected hasScheduler(key: string): boolean { return (this.__im_SchedulerMap !== null) && this.__im_SchedulerMap.has(key); }
    protected registerScheduler(key: string, func: Function) {
        if (this.hasScheduler(key)) {
            console.error(`${this.name}.RegisterScheduler >> 已注册有调度函数 >> 关键字${key}`)
        }
        this._I_SchedulerMap.set(key, func);
    }
    protected startScheduler(key: string, func: Function, interval: number, repeat: number = cc.macro.REPEAT_FOREVER, delay: number = 0): void {
        if (!this.hasScheduler(key)) {
            this.registerScheduler(key, func);
            this.schedule(func, interval, repeat, delay);
        }
    }
    protected stopScheduler(key): void {
        if (this.hasScheduler(key)) {
            let scheduler = this.__im_SchedulerMap.get(key)
            this.__im_SchedulerMap.delete(key);
            this.unschedule(scheduler);
        }
    }
    private stopAllScheduler() {
        if (this.__im_SchedulerMap !== null) {
            let m = this.__im_SchedulerMap;
            this.__im_SchedulerMap = null;
            m.forEach(func => this.unschedule(func));
            m.clear();
        }
    }
    //#endregion
}
