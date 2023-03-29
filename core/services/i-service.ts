import GameContext from '../game-context';

export default interface IService {
}


/**
 * 
 * @param serviceName 
 * @param CCComponent 
 * 
 * 需要注意，在打包时，会将类名压缩成e i d t等类似的单个字母注入时如果用name则会无法get
 */
export function InjectService(serviceName: string, CCComponent?: boolean) {
    return function (target: { new(param?) }) {
        if (!!!serviceName) {
            throw new Error("必须为注入的service 注入 serviceName，并且serviceName必须和类名相同");
        }

        target.serviceName = serviceName;
        if (CCComponent) {
            GameContext.serviceNameArr.push(serviceName);
        } else {
            GameContext.serviceClassDict.set(serviceName, target);
        }
    }
}

