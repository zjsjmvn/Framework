
export class Flash {
    public static ease(time: number, duration: number, overshootOrAmplitude: number, period: number) {
        let num = Math.ceil(time / duration * overshootOrAmplitude);
        let num2 = duration / overshootOrAmplitude;
        time -= num2 * (num - 1);
        let num3 = ((num % 2 != 0) ? 1 : (-1));
        if (num3 < 0) {
            time -= num2;
        }
        let res = time * num3 / num2;
        return this.weightedEase(overshootOrAmplitude, period, num, num2, num3, res);
    }

    public static easeIn(time: number, duration: number, overshootOrAmplitude: number, period: number) {
        let num = Math.ceil(time / duration * overshootOrAmplitude);
        let num2 = duration / overshootOrAmplitude;
        time -= num2 * (num - 1);
        let num3 = ((num % 2 != 0) ? 1 : (-1));
        if (num3 < 0) {
            time -= num2;
        }
        time *= num3;
        let res = (time /= num2) * time;
        return this.weightedEase(overshootOrAmplitude, period, num, num2, num3, res);
    }

    public static easeOut(time: number, duration: number, overshootOrAmplitude: number, period: number) {
        let num = Math.ceil(time / duration * overshootOrAmplitude);
        let num2 = duration / overshootOrAmplitude;
        time -= num2 * (num - 1);
        let num3 = ((num % 2 != 0) ? 1 : (-1));
        if (num3 < 0) {
            time -= num2;
        }
        time *= num3;
        let res = (0 - (time /= num2)) * (time - 2);
        return this.weightedEase(overshootOrAmplitude, period, num, num2, num3, res);
    }

    public static easeInOut(time: number, duration: number, overshootOrAmplitude: number, period: number) {
        let num = Math.ceil(time / duration * overshootOrAmplitude);
        let num2 = duration / overshootOrAmplitude;
        time -= num2 * (num - 1);
        let num3 = ((num % 2 != 0) ? 1 : (-1));
        if (num3 < 0) {
            time -= num2;
        }
        time *= num3;
        let res = (((time /= num2 * 0.5) < 1) ? (0.5 * time * time) : (-0.5 * ((time -= 1) * (time - 2) - 1)));
        return this.weightedEase(overshootOrAmplitude, period, num, num2, num3, res);
    }

    private static weightedEase(overshootOrAmplitude: number, period: number, stepIndex: number, stepDuration: number, dir: number, res: number) {
        let num = 0;
        let num2 = 0;
        if (dir > 0 && overshootOrAmplitude % 2 == 0) {
            stepIndex++;
        }
        else if (dir < 0 && overshootOrAmplitude % 2 != 0) {
            stepIndex++;
        }
        if (period > 0) {
            let num3 = Math.trunc(overshootOrAmplitude);
            num2 = overshootOrAmplitude - num3;
            if (num3 % 2 > 0) {
                num2 = 1 - num2;
            }
            num2 = num2 * stepIndex / overshootOrAmplitude;
            num = res * (overshootOrAmplitude - stepIndex) / overshootOrAmplitude;
        }
        else if (period < 0) {
            period = 0 - period;
            num = res * stepIndex / overshootOrAmplitude;
        }
        let num4 = num - res;
        res += num4 * period + num2;
        if (res > 1) {
            res = 1;
        }
        return res;
    }
}
