import { Canvas, tween } from "cc";

export default class PromiseUtil {


    /**
     * @description     //let [err, res] = await PromiseUtil.PromiseHandler(HttpService.login());
     * @static
     * @param {*} promise
     * @return {*}  
     * @memberof PromiseUtil
     */
    public static promiseHandler(promise): [] {
        return promise.then(data => [null, data]).catch(err => [err])
    }

    /**
     * @description ms
     * @static
     * @param {*} delayTime ms
     * @returns {Promise<void>}
     * @memberof Utils
     */
    public static delay(delayTime): Promise<void> {
        if (delayTime === 0) { delayTime = 100; }
        // delayTime -= 18;
        return new Promise(function (resolve, reject) {
            // delayTime(delayTime);
            let a = {};
            tween(a).delay(delayTime / 1000).call(() => {
                resolve();
            }).start();

            // settimeout不准。、
            // director.getScheduler().scheduleOnce()l
            // setTimeout(function () {
            // resolve();
            // }, delayTime);
        });
    }

    /**
     * @description 
     * @static
     * @param {*} delayTime ms
     * @param {function} callback
     * @memberof Utils
     */
    public static delayWithCallBack(delayTime, callback) {
        let a = {};
        tween(a).delay(delayTime / 1000).call(() => {
            callback();
        }).start();
        // return new Promise(res => Canvas.instance.scheduleOnce(res, time));

    }

}