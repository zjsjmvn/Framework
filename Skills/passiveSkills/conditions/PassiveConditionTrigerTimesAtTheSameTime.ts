import { PassiveCondition } from "./PassiveCondition";

/**
 * 同时触发次数。如果同时触发次数为1，那么就是触发的时候，不能在触发了。
 */
export class PassiveConditionTrigerTimesAtTheSameTime extends PassiveCondition {
    public trigerTimes = 0;
    constructor(times: number) {
        super()
        this.trigerTimes = times;
    }

    init() {

    }
    meet() {
        if (this.trigerTimes === 0) {
            return false;
        }
        this.trigerTimes--;
        return true;
    }
}