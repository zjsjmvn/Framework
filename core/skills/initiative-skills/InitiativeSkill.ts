import BaseSkill from '../BaseSkill';
import EntityExt from '../../../GamePlay/ECS/extensions/EntityExt';
export default class InitiativeSkill extends BaseSkill {
    public owner: EntityExt = null;
    public init(entity: EntityExt) {
        this.owner = entity;
    }

}