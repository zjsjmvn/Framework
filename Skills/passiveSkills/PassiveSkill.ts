import { PassiveCondition } from './conditions/PassiveCondition';
export enum PassiveConditionMeetMode {
    MeetOne,
    MeetAll,
}
/**
 * 被动技能有触发cd时间间隔 也可能没有
 * 暂时先按照面向对象的方式来写。然后在按照ecs的方式来写
 * 先不要写太复杂了。
 */
export class PassiveSkill {
    protected conditions: Array<PassiveCondition> = null;
    constructor() {
        this.conditions = new Array<PassiveCondition>();

    }
    addCondition(condition: PassiveCondition) {
        this.conditions.push(condition);
    }
    init() {
    }

    meet(): boolean {
        return false;
    }
    trigger(target?) {

    }
}