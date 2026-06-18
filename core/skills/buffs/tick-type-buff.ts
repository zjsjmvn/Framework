import { BuffSkill } from "./buff-skill";




/**
 * @description 定时类型的buff，比如每秒恢复100生命。
 * @export
 * @class TickTypeBuff
 * @extends {BuffSkill}
 */
export default abstract class TickTypeBuff extends BuffSkill {

    public tick: number = 0;
    public currentTick: number = 0;

    constructor(tick: number) {
        super();
        this.tick = tick;
        this.currentTick = this.tick;
    }
    public onTick(dt) {
        this.currentTick -= dt;
        if (this.currentTick <= 0) {
            // 到达触发间隔；具体效果由子类在扩展 onTick 或组合技能逻辑时实现。
            this.currentTick = this.tick;
        }
    }
    abstract meetRemoveCondition(): boolean;
}
