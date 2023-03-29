import { PassiveCondition } from "./passive-condition";

/**
 * 同时触发次数。如果同时触发次数为1，那么就是触发的时候，不能在触发了。
 */
export class PassiveConditionTrigerTimesAtTheSameTime extends PassiveCondition {
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