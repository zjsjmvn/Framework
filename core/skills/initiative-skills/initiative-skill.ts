import BaseSkill from "../base-skill";

/** 主动技能基类，当前只继承基础生命周期，具体释放逻辑由业务技能扩展。 */
export default class InitiativeSkill extends BaseSkill {
    public init() {
    }

}
