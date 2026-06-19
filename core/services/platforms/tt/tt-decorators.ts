import { log, warn } from 'cc';

/** 抖音平台能力保护装饰器：宿主不支持对应 API 时返回兜底值。 */
export function TTCanIUse(failReturn: any = null) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            if (window['tt'] && tt?.canIUse(propertyKey)) {
                return originalMethod.apply(this, args);
            } else {
                warn(propertyKey, "方法不被支持")
                return failReturn;
            }
        };
        return descriptor;
    };
}

/** 抖音触摸结束回调装饰器，用平台 tt.onTouchEnd 包一层原方法。 */
export const TT_onTouchEnd: MethodDecorator = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const sourceMethod = descriptor.value;
    descriptor.value = function (...args: any) {
        tt.onTouchEnd(() => {
            log('tt.onTouchEnd');
            sourceMethod.apply(this, args);
        });
    }
}
