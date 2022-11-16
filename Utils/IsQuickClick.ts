import { singleton } from "./Decorator/Singleton";

@singleton
export default class IsQuickClick {
    public static instance: IsQuickClick;
    private TAG = 'IsQuickClick';
    private clickTime = {};

    /**
     * @description 是否频繁点击
     * @param 判断重点的一个id，用于区分不同时机 
     * @duration 少于该时长即认为发生了重复点击（毫秒）     
     **/
    public check(tag?: string, duration?: number): boolean {
        if (!tag) tag = 'normal';
        if (!this.clickTime) this.clickTime = {};
        if (this.clickTime[tag] == undefined) this.clickTime[tag] = 0;
        let gapTime = new Date().getTime() - this.clickTime[tag];
        if (!duration) duration = 500;
        if (gapTime < duration) {
            console.log(this.TAG, '请勿重复点击');
            return true;
        }
        this.clickTime[tag] = new Date().getTime();
        return false;
    }

}