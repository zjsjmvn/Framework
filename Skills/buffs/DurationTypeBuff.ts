import { BuffSkill } from "./BuffSkill";
import { Entity } from '../../ECS/Entitas/Entity';

/**
 * 持续一定时间类型的buff
 */
export default class DurationTypeBuff extends BuffSkill {
    public lifeTime: number = 0;    //生命时长

    constructor(caster: Entity, target: Entity, lifeTime: number) {
        super(caster, target);
        this.lifeTime = lifeTime;
    }
    public onUpdate(dt) {
        // 如果生命时长为NaN，说明是永久的，不需要更新
        if (this.lifeTime == Number.NaN) return;
        if (this.lifeTime <= 0) return;
        this.lifeTime -= dt;
        this.lifeTime = this.lifeTime <= 0 ? 0 : this.lifeTime;
    }
    meetRemoveCondition(): boolean {
        if (this.lifeTime <= 0) return true;
        return false;
    }
}