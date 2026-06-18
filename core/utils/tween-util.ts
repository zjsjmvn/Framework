/** tween 数学工具，当前提供二阶贝塞尔插值计算。 */
export default class TweenUtil {

    /** 二阶贝塞尔曲线取点，p1 为控制点，t 取值通常为 0..1。 */
    bezier2(p0: number, p1: number, p2: number, t: number) {
        let t1 = 1 - t;
        return t1 * t1 * p0 + 2 * t * t1 * p1 + t * t * p2;
    }
}
