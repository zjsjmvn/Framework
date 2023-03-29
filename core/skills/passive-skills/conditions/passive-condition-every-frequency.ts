import { PassiveCondition } from "./passive-condition";

/**
 * 每频率次条件 每频率（frequency）次都触发
 * 如每五次普通攻击触发一次击晕。击退
 */
export class PassiveCondition_EveryFrequency extends PassiveCondition {
    protected currentTimes = 0;       //  当前使用次数
    protected frequency = 0;
    constructor(frequency: number) {
        super()
        this.frequency = frequency;
    }

    init() {

    }
    meet() {
        if (this.currentTimes % this.frequency === 0) {
            return true;
        }
        return false;
    }
}