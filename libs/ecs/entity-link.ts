
import { _decorator, Component, Node } from 'cc';
import { ECS } from './ecs';
const { ccclass, property } = _decorator;

@ccclass('EntityLink')
export class EntityLink extends Component {

    eid: number = -1;

    link(eid: number) {
        this.eid = eid;
    }

    unlink() {
        this.eid = -1;
    }

    getEntity<T extends ECS.Entity>() {
        if (this.eid === -1) {
            return null;
        }
        else {
            return ECS.getEntityByEid<T>(this.eid);
        }
    }
}