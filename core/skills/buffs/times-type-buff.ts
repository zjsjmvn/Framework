import { BuffSkill } from "./buff-skill";

// 次数类型。比如下两次攻击为双倍伤害。
export default class TimesTypeBuff extends BuffSkill {
    public times: number = 0;
    meetRemoveCondition(): boolean {
        if (this.times <= 0) return true;
        return false;
    }
}

