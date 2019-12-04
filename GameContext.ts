import IService from "./IService";
import Dictionary from './Collections/Dictionary';
import { singleton } from './Tools/Singleton';

@singleton
export default class GameContext {

    /**
     * @description only for intellisense 
     * @static
     * @type {GameContext}
     * @memberof GameContext
     */
    public static instance: GameContext = null;
    public player: EntityExt = null;
    public static serviceClassDict: Dictionary<string, any> = new Dictionary();
    public static serviceNameArr: Array<string> = new Array();
    private _servicesDictionary: Dictionary<string, IService> = new Dictionary<string, IService>();


    constructor() {
        this.registerServices();
    }


    public registerServices() {
        GameContext.serviceClassDict.forEach((key, value) => {
            let service: IService = new value();
            this._servicesDictionary.setValue(key, service);
        })


        let canvas = cc.director.getScene().getChildByName("Canvas");

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
                throw new Error("can`t find service in all components");
            }

            console.log("registServices s", s);
            this._servicesDictionary.setValue(s, services[0]);
        }
    }

    public getService<T extends IService>(c: { new(): T; }): T {
        let service = <T>this._servicesDictionary.getValue(c.serviceName);
        if (!!service) {
            return service;
        }
        throw new Error("get service fail ,make sure you have already register it ");



    }


    onDebugTouch() {
        GameContext.instance.player.PlayerComponent.coins += 10000;
    }

}
