export const TTCanIUse: MethodDecorator = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const sourceMethod = descriptor.value;
    descriptor.value = function (...args: any) {
        if (window['tt'] && tt?.canIUse(propertyKey)) {
            cc.log('tt.canIUse');
            sourceMethod.apply(this, args);
        } else {
            cc.warn(propertyKey, "方法不被支持")
        }
    }
}

export const TT_onTouchEnd: MethodDecorator = (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const sourceMethod = descriptor.value;
    descriptor.value = function (...args: any) {
        let func = () => {
            cc.log('tt.onTouchEnd');
            sourceMethod.apply(this, args);
            tt.offTouchEnd(func);
        }
        tt.onTouchEnd(func);
    }
}
