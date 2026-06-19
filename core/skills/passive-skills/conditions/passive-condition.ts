/** 被动技能触发条件基类；子类重写 meet 表达具体判定。 */
export class PassiveCondition{





    meet(){
        // 默认不满足，防止空条件被当作可触发条件。
        return false;
    }
}
