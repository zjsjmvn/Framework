import EntityExt, { BuffType } from "../../../GamePlay/ecs/extensions/EntityExt";

export class BuffSkill {
    public buffType: BuffType = BuffType.BuffNone;
    public casterEntity: EntityExt;       // 释放者，释放这个buff的人
    public effectEntity: EntityExt;  // 影响者。被buff影响的人。
    public buffID: number;     //buffid
    public buffLevel: number;  //buff等级
    constructor(caster: EntityExt, target: EntityExt) {
        this.casterEntity = caster;
        this.effectEntity = target;
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


    meetRemoveCondition(): boolean {
        return true;
    }
}