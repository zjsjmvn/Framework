import { PassiveCondition } from "./PassiveCondition";

/**
 * 同时触发次数。如果同时触发次数为1，那么就是触发的时候，不能在触发了。
 * 如：同时触发次数为1，攻击时，有一定概率进入狂暴状态，那么狂暴状态下攻击就不会再进入狂暴状态了
 */
export class PassiveCondition_TriggerTimesAtTheSameTime extends PassiveCondition {
    public triggerTimes = 0;
    constructor(times: number) {
        super()
        this.triggerTimes = times;
    }

    init() {

    }
    meet() {
        if (this.triggerTimes === 0) {
            return false;
        }
        this.triggerTimes--;
        return true;
    }
}