import IService from "./Services/IService";
import { singleton } from './Tools/Decorator/Singleton';


@singleton
export default class GameContext {

    /**
     * @description only for ide intellisense 
     * @static
     * @type {GameContext}
     * @memberof GameContext
     */
    public static instance: GameContext = null;
    public static serviceClassDict: Map<string, any> = new Map();
    public static serviceNameArr: Array<string> = new Array();
    private _servicesDictionary: Map<string, IService> = new Map<string, IService>();


    constructor() {
        this.registerServices();
    }


    public registerServices() {
        GameContext.serviceClassDict.forEach((value, key) => {
            let service: IService = new value();
            this._servicesDictionary.set(key, service);
        })


        let canvas = cc.director.getScene()?.getChildByName("Canvas");

        for (let s of GameContext.serviceNameArr) {


            let services = canvas.getComponents(s);

            if (services.length > 1) {
                throw new Error("service must be only");
            }
            if (services.length === 0) {
                services = canvas.getComponentsInChildren(s);
                if (services.length > 1) {
                    throw new Error("service must be only");
                }

            }
            if (services.length === 0) {
                cc.warn(`can not find service: ${s} in all components`);
            }

            // console.log("registServices s", s);
            this._servicesDictionary.set(s, services[0]);
        }
    }

    public getService<T extends IService>(c: { new(): T; }): T {
        let service = <T>this._servicesDictionary.get(c.serviceName);
        if (!!service) {
            return service;
        }
        throw new Error("get service fail ,make sure you have already register it ");

    }

    public manualRegisterService(name, service) {
        this._servicesDictionary.set(name, service);
    }

}
