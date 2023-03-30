import { log } from "cc";

export type Singleton<T extends new (...args: any[]) => any> = T & {
    instance: T extends new (...args: any[]) => infer I ? I : never
}

/**
 * @description 单例装饰器。不能使用在Component上.因在引擎生成组件的时候没有调用proxy的construct
 * @export
 * @template T
 * @param {T} classTarget
 * @returns 
 */
export function singleton<T extends new (...args: any[]) => any>(classTarget: T) {
    return new Proxy(classTarget, {
        construct(target: Singleton<T>, argumentsList, newTarget) {
            // Skip proxy for children
            log("construct");
            if (target.prototype !== newTarget.prototype) {
                return Reflect.construct(target, argumentsList, newTarget)
            }
            if (!target.instance) {
                target.instance = Reflect.construct(target, argumentsList, newTarget)
            }
            return target.instance
        },
        get(target: Singleton<T>, key) {
            // log(`key ${key.toString()}`)
            if (key == "instance") {
                if (!!!target["instance"]) {
                    Reflect.set(target, 'instance', new classTarget);
                }
                return Reflect.get(target, 'instance');
            }

            return target[key]
        }
    })

}



