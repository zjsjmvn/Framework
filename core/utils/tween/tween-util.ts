import { easing, IColor, IMat3Like, IVec3Like, math, Node, Tween, tween, UIOpacity, UIRenderer, v2, v3, Vec2, Vec3 } from "cc";

/** 动画表演管理 */
export default class TweenUtil {

    /** 左右小幅度抖动 */
    static shakeHorizontally(node: Node) {
        tween(node).by(0.1, { position: v3(8, 0, 0) }).reverseTime().start();
    }

    /** scale翻转 翻转 */
    static flipScale(node: Node, turnCall: Function, endCall: Function = null, time = 1, endScaleX = node.scale.x) {
        const endScale = node.scale.clone();
        endScale.x = 0;
        const finalScale = node.scale.clone();
        finalScale.x = endScaleX;

        tween(node)
            .to(time / 2, { scale: endScale })
            .call(turnCall)
            .to(time / 2, { scale: finalScale })
            .call(endCall)
            .start();
    }

    /** 角度变化 */
    static rotateToAngle(node: Node, angle: number, call?: Function, angleSpeedSec = 120) {
        const time = Math.abs(node.angle - angle) / angleSpeedSec;
        return tween(node).to(time, { angle }).call(call).start();
    }

    /** 
     * 旋转抖动
     * 根据偏移圆心旋转一周
     * 回到起点
     */
    static rotateShake(node: Node, call?: Function, center: Vec2 = v2(0, 5), time = 0.2) {
        const angle = center.signAngle(v2(1, 0));
        const len = center.length();
        const startPos = node.position.clone();

        const action = tween(node).to(time, {}, {
            onUpdate(target?, ratio?) {
                const curAngle = angle + ratio * Math.PI * 2;
                const x = startPos.x + Math.cos(curAngle) * len + center.x;
                const y = startPos.y + Math.sin(curAngle) * len + center.y;
                node.position = v3(x, y, startPos.z);
            },
        });

        if (call) action.call(call);
        action.start();

        return time;
    }

    /** 
     * 大小跳动
     * 比例变化
     * 恢复
     */
    static bounceScale(node: Node, call?: Function, scale = 0.15, time = 0.3) {
        const action = tween(node)
            .by(time, { scale: v3(scale, scale, 0) })
            .by(time, { scale: v3(-scale, -scale, 0) });

        if (call) action.call(call);
        action.start();

        return time;
    }

    /** 
     * 大小跳动
     * 比例变化
     * 恢复
     */
    static bounceScaleInfinite(node: Node, call?: Function, scale = 0.15, time = 0.3) {
        const action = tween(node)
            .by(time, { scale: v3(scale, scale, 0) })
            .by(time, { scale: v3(-scale, -scale, 0) })
            .union()
            .repeatForever();

        if (call) action.call(call);
        action.start();

        return time;
    }

    /** 移动到某点 */
    static moveToPosition(node: Node, toPos: IVec3Like, time: number, isWPos = false, call?: Function, autoStart = true) {
        return this._move(node, toPos, time, isWPos, call, autoStart, 'to');
    }

    /** 按偏移量移动 */
    static moveByOffset(node: Node, byPos: IVec3Like, time: number, isWPos = false, call?: Function, autoStart = true) {
        return this._move(node, byPos, time, isWPos, call, autoStart, 'by');
    }

    private static _move(node: Node, pos: IVec3Like, time: number, isWPos: boolean, call?: Function, autoStart: boolean, type: 'to' | 'by') {
        const currentPos = (isWPos ? node.worldPosition : node.position).clone();
        const action = tween(currentPos)[type](time, { x: pos.x, y: pos.y, z: pos.z }, {
            onUpdate: () => {
                if (isWPos) node.worldPosition = currentPos;
                else node.position = currentPos;
            },
            onComplete: () => call && call(),
        });

        if (autoStart) action.start();
        return action;
    }

    /** 缩放到某比例 */
    static scaleToSize(node: Node, toScale: IVec3Like, time: number, call?: Function, autoStart = true) {
        return this._scale(node, toScale, time, call, autoStart, 'to');
    }

    /** 按比例缩放 */
    static scaleByFactor(node: Node, byScale: IVec3Like, time: number, call?: Function, autoStart = true) {
        return this._scale(node, byScale, time, call, autoStart, 'by');
    }

    private static _scale(node: Node, scale: IVec3Like, time: number, call?: Function, autoStart: boolean, type: 'to' | 'by') {
        const currentScale = node.scale.clone();
        const action = tween(currentScale)[type](time, { x: scale.x, y: scale.y, z: scale.z }, {
            onUpdate: () => node.scale = currentScale,
            onComplete: () => call && call(),
        });

        if (autoStart) action.start();
        return action;
    }

    /** 颜色变化 */
    static changeColorTo(sp: UIRenderer, toColor: IColor, time: number, call?: Function, autoStart = true) {
        const color = sp.color.clone();
        const action = tween(color).to(time, { r: toColor.r, g: toColor.g, b: toColor.b, a: toColor.a }, {
            onUpdate: () => {
                sp.color = color;
                // @ts-ignore
                sp._updateColor();
            },
            onComplete: () => call && call(),
        });

        if (autoStart) action.start();
        return action;
    }

    /** 淡入淡出 */
    static fadeToOpacity(ui: UIOpacity, to: number, time: number, call?: Function, autoStart = true) {
        const action = tween(ui).to(time, { opacity: to }, {
            onComplete: () => call && call(),
        });

        if (autoStart) action.start();
        return action;
    }
}