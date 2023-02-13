export default class TouchUtil {
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
}