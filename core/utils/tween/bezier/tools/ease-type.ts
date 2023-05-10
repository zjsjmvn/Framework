import { Bounce } from "./bounce";
import { Flash } from "./flash";
//https://easings.net/zh-cn


export enum EaseType {
    Constant,
    Linear,
    InQuad,
    OutQuad,
    InCubic,
    OutCubic,
    InSine,
    OutSine,
    InOutSine,
    InOutQuad,
    InOutCubic,
    InQuart,
    OutQuart,
    InOutQuart,
    InQuint,
    OutQuint,
    InOutQuint,
    InExpo,
    OutExpo,
    InOutExpo,
    InCirc,
    OutCirc,
    InOutCirc,
    InElastic,
    OutElastic,
    InOutElastic,
    InBack,
    OutBack,
    InOutBack,
    InBounce,
    Flash,
    OutBounce,
    InOutBounce,
    InFlash,
    OutFlash,
    InOutFlash,
}

export class Evaluate {
    public static calculate(easeType: EaseType, time: number, duration: number, period: number = 0, overshootOrAmplitude: number = 1) {
        if (duration <= 0) {
            return 0
        }
        switch (easeType) {
            case EaseType.Linear:
                return time / duration;
            case EaseType.InSine:
                return 0 - Math.cos(time / duration * (Math.PI / 2)) + 1;
            case EaseType.OutSine:
                return Math.sin(time / duration * (Math.PI / 2));
            case EaseType.InOutSine:
                return -0.5 * (Math.cos(Math.PI * time / duration) - 1);
            case EaseType.InQuad:
                return (time /= duration) * time;
            case EaseType.OutQuad:
                return (0 - (time /= duration)) * (time - 2);
            case EaseType.InOutQuad:
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * time * time;
                }
                return -0.5 * ((time -= 1) * (time - 2) - 1);
            case EaseType.InCubic:
                return (time /= duration) * time * time;
            case EaseType.OutCubic:
                return (time = time / duration - 1) * time * time + 1;
            case EaseType.InOutCubic:
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * time * time * time;
                }
                return 0.5 * ((time -= 2) * time * time + 2);
            case EaseType.InQuart:
                return (time /= duration) * time * time * time;
            case EaseType.OutQuart:
                return 0 - ((time = time / duration - 1) * time * time * time - 1);
            case EaseType.InOutQuart:
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * time * time * time * time;
                }
                return -0.5 * ((time -= 2) * time * time * time - 2);
            case EaseType.InQuint:
                return (time /= duration) * time * time * time * time;
            case EaseType.OutQuint:
                return (time = time / duration - 1) * time * time * time * time + 1;
            case EaseType.InOutQuint:
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * time * time * time * time * time;
                }
                return 0.5 * ((time -= 2) * time * time * time * time + 2);
            case EaseType.InExpo:
                if (time != 0) {
                    return Math.pow(2.0, 10 * (time / duration - 1));
                }
                return 0;
            case EaseType.OutExpo:
                if (time == duration) {
                    return 1;
                }
                return 0 - Math.pow(2.0, -10 * time / duration) + 1;
            case EaseType.InOutExpo:
                if (time == 0) {
                    return 0;
                }
                if (time == duration) {
                    return 1;
                }
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * Math.pow(2.0, 10 * (time - 1));
                }
                return 0.5 * (0 - Math.pow(2.0, -10 * (time -= 1)) + 2);
            case EaseType.InCirc:
                return 0 - (Math.sqrt(1 - (time /= duration) * time) - 1);
            case EaseType.OutCirc:
                return Math.sqrt(1 - (time = time / duration - 1) * time);
            case EaseType.InOutCirc:
                if ((time /= duration * 0.5) < 1) {
                    return -0.5 * (Math.sqrt(1 - time * time) - 1);
                }
                return 0.5 * (Math.sqrt(1 - (time -= 2) * time) + 1);
            case EaseType.InElastic:
                {
                    if (time == 0) {
                        return 0;
                    }
                    if ((time /= duration) == 1) {
                        return 1;
                    }
                    if (period == 0) {
                        period = duration * 0.3;
                    }
                    let num3;
                    if (overshootOrAmplitude < 1) {
                        overshootOrAmplitude = 1;
                        num3 = period / 4;
                    }
                    else {
                        num3 = period / (Math.PI * 2) * Math.asin(1 / overshootOrAmplitude);
                    }
                    return 0 - overshootOrAmplitude * Math.pow(2.0, 10 * (time -= 1)) * Math.sin((time * duration - num3) * (Math.PI * 2) / period);
                }
            case EaseType.OutElastic:
                {
                    if (time == 0) {
                        return 0;
                    }
                    if ((time /= duration) == 1) {
                        return 1;
                    }
                    if (period == 0) {
                        period = duration * 0.3;
                    }
                    let num2;
                    if (overshootOrAmplitude < 1) {
                        overshootOrAmplitude = 1;
                        num2 = period / 4;
                    }
                    else {
                        num2 = period / (Math.PI * 2) * Math.asin(1 / overshootOrAmplitude);
                    }
                    return overshootOrAmplitude * Math.pow(2.0, -10 * time) * Math.sin((time * duration - num2) * (Math.PI * 2) / period) + 1;
                }
            case EaseType.InOutElastic:
                {
                    if (time == 0) {
                        return 0;
                    }
                    if ((time /= duration * 0.5) == 2) {
                        return 1;
                    }
                    if (period == 0) {
                        period = duration * 0.450000018;
                    }
                    let num;
                    if (overshootOrAmplitude < 1) {
                        overshootOrAmplitude = 1;
                        num = period / 4;
                    }
                    else {
                        num = period / (Math.PI * 2) * Math.asin(1 / overshootOrAmplitude);
                    }
                    if (time < 1) {
                        return -0.5 * (overshootOrAmplitude * Math.pow(2.0, 10 * (time -= 1)) * Math.sin((time * duration - num) * (Math.PI * 2) / period));
                    }
                    return overshootOrAmplitude * Math.pow(2.0, -10 * (time -= 1)) * Math.sin((time * duration - num) * (Math.PI * 2) / period) * 0.5 + 1;
                }
            case EaseType.InBack:
                return (time /= duration) * time * ((overshootOrAmplitude + 1) * time - overshootOrAmplitude);
            case EaseType.OutBack:
                return (time = time / duration - 1) * time * ((overshootOrAmplitude + 1) * time + overshootOrAmplitude) + 1;
            case EaseType.InOutBack:
                if ((time /= duration * 0.5) < 1) {
                    return 0.5 * (time * time * (((overshootOrAmplitude *= 1.525) + 1) * time - overshootOrAmplitude));
                }
                return 0.5 * ((time -= 2) * time * (((overshootOrAmplitude *= 1.525) + 1) * time + overshootOrAmplitude) + 2);
            case EaseType.InBounce:
                return Bounce.easeIn(time, duration, overshootOrAmplitude, period);
            case EaseType.OutBounce:
                return Bounce.easeOut(time, duration, overshootOrAmplitude, period);
            case EaseType.InOutBounce:
                return Bounce.easeInOut(time, duration, overshootOrAmplitude, period);
            case EaseType.Flash:
                return Flash.ease(time, duration, overshootOrAmplitude, period);
            case EaseType.InFlash:
                return Flash.easeIn(time, duration, overshootOrAmplitude, period);
            case EaseType.OutFlash:
                return Flash.easeOut(time, duration, overshootOrAmplitude, period);
            case EaseType.InOutFlash:
                return Flash.easeInOut(time, duration, overshootOrAmplitude, period);
            default:
                //OutQuad
                return (0 - (time /= duration)) * (time - 2);
        }
    }
}

