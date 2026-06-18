import IService from "../i-service";

/** 平台服务入口，负责初始化当前宿主平台能力。 */
export default class PlatformService implements IService {



    initPlatform() {
        // 具体平台初始化由子类或注入的 provider 扩展；基类保持空实现。

    }



}
