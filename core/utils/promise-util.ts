import { Canvas, Component, director, tween } from "cc";

export default class PromiseUtil {


    /**
     * @description     //let [err, res] = await PromiseUtil.promiseHandler(HttpService.login());
     * @static
     * @param {*} promise
     * @return {*}  
     * @memberof PromiseUtil
     */
    public static promiseHandler<T>(promise: Promise<T>): Promise<[Error | null, T]> {
        return promise
            .then(data => [null, data] as [null, T])
            .catch(err => [err, null] as [Error, null]);
    }

    /**
     * @description ms,注意：最小值不会低于一帧。时间越小，精度越差。
     * @static
     * @param {*} delayTime ms
     * @returns {Promise<void>}
     * @memberof Utils
     */
    public static delay(delayTime): Promise<void> {
        if (delayTime === 0) { delayTime = 100; }
        return new Promise(function (resolve, reject) {
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