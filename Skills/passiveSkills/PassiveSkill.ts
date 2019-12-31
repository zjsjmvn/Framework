export class ResDT_SkillPassiveCondition {
    public dwConditionType = 0;
    public conditionParam = new Array<number>();

}
export class PassiveSkillConfigData {
    public iCfgID;
    public passiveName;
    public passiveDesc;
    public coolDownTimeLength;
    public iSkillType;
    public dwPassiveEventType;
    public iPassiveEventParam1;
    public iPassiveEventParam2;
    public iPassiveEventParam3;
    public iPassiveEventParam4;
    public iPassiveEventParam5;
    public bPassiveConditonMode;
    public passiveConditon = Array<ResDT_SkillPassiveCondition>();
    public AgeImmeExcute;
    public PassiveExposing;
    public ActionName;
}

export class PassiveSkill {
    private confData: PassiveSkillConfigData;

    init(conf: PassiveSkillConfigData) {
        this.confData = conf;
    }
    meet(): boolean {
        return false;
    }
    triger(target) {

    }
}