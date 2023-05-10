import { CCObject, Component, _decorator } from "cc";

const { ccclass, executeInEditMode } = _decorator;

@ccclass
@executeInEditMode
export default class PointLabel extends Component {

    onLoad() {
        this.node["_objFlags"] |= (CCObject["Flags"].LockedInEditor | CCObject["Flags"].HideInHierarchy);
    }
}
