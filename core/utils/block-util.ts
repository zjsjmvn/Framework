/** 方法级防重复点击/请求工具，通过装饰器在一段时间内屏蔽重复调用。 */
export default class BlockUtil {
    /** 普通防抖：阻塞期内重复调用会直接忽略。 */
    static block(seconds: number) {
        return function (target, methodName: string, descriptor: PropertyDescriptor) {
            let oldMethod = descriptor.value
            let isBlock = false
            descriptor.value = function (...args: any[]) {
                if (isBlock) {
                    console.info('Util.block >> blocking')
                    return
                }
                isBlock = true
                setTimeout(() => {
                    isBlock = false
                }, seconds * 1000)
                oldMethod.apply(this, args)
            }
            return descriptor
        }
    }
    /** HTTP 防抖：阻塞期内返回统一的“请求太快”Promise 结果。 */
    static httpBlock(seconds: number) {
        return function (target, methodName: string, descriptor: PropertyDescriptor) {
            let oldMethod = descriptor.value
            let isBlock = false
            descriptor.value = function (...args: any[]) {
                if (isBlock) {
                    console.info('Util.block >> blocking')
                    return Promise.resolve(["请求太快", null]);
                }
                isBlock = true
                setTimeout(() => {
                    isBlock = false
                }, seconds * 1000)
                oldMethod.apply(this, args)
            }
            return descriptor
        }
    }

}
