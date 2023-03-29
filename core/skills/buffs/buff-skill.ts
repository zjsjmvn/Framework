
import { log } from 'cc';
import BaseSkill from '../base-skill';

export abstract class BuffSkill extends BaseSkill {
    public buffLevel: number;          //buff等级
    constructor() {
        super()
    }

    onAdd() {

    }

    onRemove() {
    }

    onKill() {

    }

    onAttacked() {

    }

    onAttack() {

    }

    onAttackFinished() {

    }


    abstract meetRemoveCondition(): boolean

}