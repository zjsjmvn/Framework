import { Entity } from '../../ECS/Entitas/Entity';
import BaseSkill from '../BaseSkill';
import { UUID } from '../../ECS/Entitas/utils/UUID';

export class BuffSkill extends BaseSkill {
    public casterEntity: Entity;       // 释放者，释放这个buff的人
    public effectEntity: Entity;       // 影响者。被buff影响的人。 TODO: 可能被影响的人是一堆。
    public buffID: number;             //buffid
    public buffLevel: number;          //buff等级
    constructor(caster: Entity, target: Entity) {
        super()
        this.casterEntity = caster;
        this.effectEntity = target;
    }

    onAdd() {

    }

    onRemove() {
        cc.log('onRemove');
    }

    onKill() {

    }

    onAttacked() {

    }

    onAttack() {

    }

    onAttackFinished() {

    }


    meetRemoveCondition(): boolean {
        return true;
    }


}