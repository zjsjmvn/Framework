import { ECS } from '../../../libs/ecs/ECS';
import BaseSkill from '../BaseSkill';
import { log } from 'cc';

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