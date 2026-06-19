
import { _decorator, Component, Node } from 'cc';
import { ECS } from './ecs';
const { ccclass, property } = _decorator;

/** Cocos 节点到 ECS 实体的轻量桥接，只保存 eid，实体销毁后 getEntity 可能返回空。 */
@ccclass('EntityLink')
export class EntityLink extends Component {

    eid: number = -1;

    /** 绑定当前节点代表的 ECS 实体 id。 */
    link(eid: number) {
        this.eid = eid;
    }

    /** 解除节点和实体的关联，通常在节点回收或组件 init 时调用。 */
    unlink() {
        this.eid = -1;
    }

    /** 读取当前关联实体；实体被销毁或 eid 无效时返回 null/undefined。 */
    getEntity<T extends ECS.Entity>() {
        if (this.eid === -1) {
            return null;
        }
        else {
            return ECS.getEntityByEid<T>(this.eid);
        }
    }
}
