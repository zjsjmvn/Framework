import BaseSkill from "../base-skill";
import { PassiveCondition } from "./conditions/passive-condition";

export enum PassiveConditionMeetMode {
    MeetOne,
    MeetAll,
}

/** 被动技能基类，保存触发条件列表；具体 meet/trigger 逻辑由子类实现。 */
export class PassiveSkill extends BaseSkill {
    protected conditions: Array<PassiveCondition> = null;
    constructor() {
        super()
        this.conditions = new Array<PassiveCondition>();

    }
    addCondition(condition: PassiveCondition) {
        this.conditions.push(condition);
    }
    init() {
    }

    meet(): boolean {
        // 基类默认不满足，避免未实现条件判断的被动被误触发。
        return false;
    }
    trigger(target?, args?) {

    }
}
