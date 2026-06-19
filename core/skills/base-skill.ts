/** 技能基类，提供添加、移除和升级重应用的最小生命周期。 */
export default class BaseSkill {
    public skillType: any;

    /** 技能挂载到拥有者时调用。 */
    onAdd() {

    }

    /** 技能从拥有者移除时调用。 */
    onRemove() {

    }

    /** 等级变化时先清旧效果再应用新效果。 */
    applyNewLevel() {
        this.onRemove();
        this.onAdd();
    }
}
