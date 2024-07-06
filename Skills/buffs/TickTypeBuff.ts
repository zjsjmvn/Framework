import { BuffSkill } from "./BuffSkill";
import { Entity } from '../../ECS/Entitas/Entity';
import DurationTypeBuff from "./DurationTypeBuff";




/**
 * @description 定时类型的buff，比如每秒恢复100生命。
 * @export
 * @class TickTypeBuff
 * @extends {BuffSkill}
 */
export default abstract class TickTypeBuff extends DurationTypeBuff {

    public tick: number = 0;
    public currentTick: number = 0;

    constructor(caster: Entity, target: Entity, tick: number, lifeTime: number) {
        super(caster, target, lifeTime);
        this.tick = tick;
        this.currentTick = this.tick;
    }

    public onUpdate(dt) {
        super.onUpdate(dt);
        if (this.lifeTime <= 0) return;
        this.currentTick -= dt;
        if (this.currentTick <= 0) {
            this.onTick(dt);
            this.currentTick = this.tick;
        }
    }
    public onTick(dt) {

    }
}