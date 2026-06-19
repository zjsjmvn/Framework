import { BuffSkill } from "./buff-skill";




/**
 * @description 有持续时间的定时类型的buff，比如每秒恢复100生命持续5秒（5秒后buff结束）
 * @export
 * @class TickTypeBuff
 * @extends {BuffSkill}
 */
export default abstract class TickTypeBuffWithDuration extends BuffSkill {

    // 这里保留为抽象占位：具体项目如果需要“定时触发 + 持续时间”的 Buff，
    // 应在子类里定义 tick、剩余时长和触发效果，避免框架层假设具体战斗语义。
}
