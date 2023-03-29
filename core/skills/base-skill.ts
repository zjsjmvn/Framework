export default class BaseSkill {
    public skillType: any;

    onAdd() {

    }

    onRemove() {

    }

    applyNewLevel() {
        this.onRemove();
        this.onAdd();
    }
}

