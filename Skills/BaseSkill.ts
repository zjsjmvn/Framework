import { UUID } from '../ECS/Entitas/utils/UUID';
export default class BaseSkill {
    public skillType: any;
    public id: string = UUID.randomUUID();

    onAdd() {

    }

    onRemove() {

    }

    applyNewLevel() {
        this.onRemove();
        this.onAdd();
    }
}

