import { PassiveCondition } from "./PassiveCondition";

/**
 * 随机条件
 */
export class PassiveConditionRandom extends PassiveCondition {
    private chanceValue = 0;
    constructor(chance: number) {
        super()
        this.chanceValue = chance;
    }

    init() {

    }
    meet() {
        let random = Math.random() * 100;
        if (random <= this.chanceValue) {
            return true;
        }
        return false;
    }
}