import { log, warn } from 'cc';
export const TTCanIUse: MethodDecorator = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const sourceMethod = descriptor.value;
    descriptor.value = function (...args: any) {
        if (window['tt'] && tt?.canIUse(propertyKey)) {
            log('tt.canIUse');
            sourceMethod.apply(this, args);
        } else {
            warn(propertyKey, "方法不被支持")
        }
    }
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
