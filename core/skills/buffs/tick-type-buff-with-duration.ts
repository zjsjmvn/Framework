import { BuffSkill } from "./buff-skill";




/**
 * @description 有持续时间的定时类型的buff，比如每秒恢复100生命持续5秒（5秒后buff结束）
 * @export
 * @class TickTypeBuff
 * @extends {BuffSkill}
 */
export default abstract class TickTypeBuffWithDuration extends BuffSkill {

    // public tick: number = 0;
    // public currentTick: number = 0;

    // constructor(caster: Entity, target: Entity, tick: number) {
    //     super(caster, target);
    //     this.tick = tick;
    // }
    // public onTick(dt) {
    //     this.currentTick -= dt;
    //     if (this.currentTick <= 0) {
    //         // do something
    //         this.currentTick = this.tick;
    //     }
    // }
    // abstract meetRemoveCondition(): boolean;
}