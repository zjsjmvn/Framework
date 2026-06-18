import { CCObject, Component, _decorator } from "cc";

const { ccclass, executeInEditMode } = _decorator;

/** 贝塞尔编辑辅助点标签，编辑器中隐藏并锁定节点，避免误选。 */
@ccclass
@executeInEditMode
export default class PointLabel extends Component {

    onLoad() {
        this.node["_objFlags"] |= (CCObject["Flags"].LockedInEditor | CCObject["Flags"].HideInHierarchy);
    }
}
