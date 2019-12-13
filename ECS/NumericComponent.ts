

export enum NumericType {
    Final = 1000,
    Base = Final * 10 + 1,
    BaseAddValue = Final * 10 + 2,
    BaseAddPercent = Final * 10 + 3,
    FinalAddValue = Final * 10 + 4,
    FinalAddPercent = Final * 10 + 5,
}


export class NumericComponent {
    protected numericDic = new Map<NumericType, number>();
    public final: number = 0;

    public addByKey(key: NumericType, value: number) {
        if (key === NumericType.Base || key === NumericType.Final) {
            cc.error(`NumericType.Base and NumericType.Final 不允许直接加`);
        }
        let oldValue = this.getByKey(key);
        let newValue = oldValue + value;
        this.setByKey(key, newValue);
    }

    public getByKey(key: number) {
        let value = this.numericDic.get(key);
        if (!value) {
            return 0;
        }
        return value;
    }

    public setByKey(type: NumericType, value: number) {
        if (type !== NumericType.Base && type !== NumericType.BaseAddValue && type !== NumericType.BaseAddPercent && type !== NumericType.FinalAddValue && type !== NumericType.FinalAddPercent) {
            throw new Error('setByKey NumericType Value Error');
        }
        if (type == NumericType.BaseAddPercent || type == NumericType.FinalAddPercent) {
            if (value <= -100) {
                // value低于-100后base会计算出负值。
                cc.warn(`NumericComponent: setByKey ${NumericType[type]} is less than -100`);
            }
        }
        if (value === this.getByKey(type)) {
            return;
        }
        this.numericDic.set(type, value);
        this.update();
    }

    public update() {
        // 一个数值可能会多种情况影响，比如速度,加个buff可能增加基础速度100，也有些buff增加10%速度，还有些装备如时装等会增加最终速度10点，最终百分百提升20%等。
        this.final = ((this.getByKey(NumericType.Base) + this.getByKey(NumericType.BaseAddValue)) * (100 + this.getByKey(NumericType.BaseAddPercent)) / 100 + this.getByKey(NumericType.FinalAddValue)) * (100 + this.getByKey(NumericType.FinalAddPercent)) / 100;
        this.numericDic.set(NumericType.Final, this.final);
    }


}

/**
 * test
let a = new NumericComponent();
a.setByKey(NumericType.Base, 0.2);
a.setByKey(NumericType.BaseAddValue, 1000);
a.setByKey(NumericType.BaseAddPercent, 100);
a.setByKey(NumericType.FinalAddValue, 500);
a.setByKey(NumericType.FinalAddPercent, -150);

cc.log(a.getByKey(NumericType.Final));
cc.log(a.getBaseByFinal(a.getByKey(NumericType.Final)));

 */

