import { BuffSkill } from "./BuffSkill";

/**
 * 持续一定时间类型的buff
 */
export default class DurationTypeBuff extends BuffSkill {
    public lifeTime: number = 0;    //生命时长

    constructor(lifeTime: number) {
        super();
        this.lifeTime = lifeTime;
    }
    public onUpdate(dt) {
        if (this.lifeTime <= 0) return;
        this.lifeTime -= dt;
        this.lifeTime = this.lifeTime <= 0 ? 0 : this.lifeTime;
    }
    meetRemoveCondition(): boolean {
        if (this.lifeTime <= 0) return true;
        return false;
    }
}