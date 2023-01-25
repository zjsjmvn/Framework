import { PassiveCondition } from './conditions/PassiveCondition';
import BaseSkill from '../BaseSkill';
export enum PassiveConditionMeetMode {
    MeetOne,
    MeetAll,
}

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
        return false;
    }
    trigger(target?, args?) {

    }
}