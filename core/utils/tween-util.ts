export default class TweenUtil {

    bezier2(p0: number, p1: number, p2: number, t: number) {
        let t1 = 1 - t;
        return t1 * t1 * p0 + 2 * t * t1 * p1 + t * t * p2;
    }
}