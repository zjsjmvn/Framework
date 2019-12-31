import { PassiveCondition } from "./PassiveCondition";

/**
 * 随机条件
 */
export class PassiveConditionRamdom extends PassiveCondition{
    private probabilityValue = 0;
    constructor(prob:number){
        super()
        this.probabilityValue = prob;
    }

    init(){

    }
    meet(){
        let random = Math.random()*100;
        if(random<this.probabilityValue){
            return true;
        }
        return false;
    }
}