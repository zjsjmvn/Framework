import { log, warn } from 'cc';
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

export const TT_onTouchEnd: MethodDecorator = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const sourceMethod = descriptor.value;
    descriptor.value = function (...args: any) {
        tt.onTouchEnd(() => {
            log('tt.onTouchEnd');
            sourceMethod.apply(this, args);
        });
    }
}
