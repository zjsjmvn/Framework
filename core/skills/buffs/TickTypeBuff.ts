import { BuffSkill } from "./BuffSkill";
import { Entity } from '../../ECS/Entitas/Entity';




/**
 * @description 定时类型的buff，比如每秒恢复100生命。
 * @export
 * @class TickTypeBuff
 * @extends {BuffSkill}
 */
export default abstract class TickTypeBuff extends BuffSkill {

    public tick: number = 0;
    public currentTick: number = 0;

    constructor(caster: Entity, target: Entity, tick: number) {
        super(caster, target);
        this.tick = tick;
        this.currentTick = this.tick;
    }
    public onTick(dt) {
        this.currentTick -= dt;
        if (this.currentTick <= 0) {
            // do something
            this.currentTick = this.tick;
        }
    }
    abstract meetRemoveCondition(): boolean;
}