import { EventTouch, Node, ScrollView, _decorator } from 'cc';

export enum ScrollViewDirection {
    HORIZONTAL,
    VERTICAL,
    NONE,
}
@_decorator.ccclass
export default class extends ScrollView {
    direction
    protected _onTouchBegan(event: EventTouch, captureListeners?: Node[]) {
        this.direction = ScrollViewDirection.NONE
        super["_onTouchBegan"](event, captureListeners)
        this.transmitEvent(event, Node.EventType.TOUCH_START)

    }
    protected _onTouchMoved(event: EventTouch, captureListeners: any) {
        if (this.direction == ScrollViewDirection.NONE) {
            var start = event.getStartLocation()
            var curre = event.getLocation()
            var xOffset = Math.abs(start.x - curre.x)
            var yOffset = Math.abs(start.y - curre.y)
            if (xOffset > yOffset) {
                // 本ScrollView滑动方向过程中达到一定偏移量是也可以向上发送事件
                if (this.vertical) {
                    if (xOffset - yOffset > 50) {
                        this.direction = ScrollViewDirection.HORIZONTAL
                    }
                }
                // this.direction = ScrollViewDirection.HORIZONTAL

            } else if (yOffset > xOffset) {
                // 本ScrollView滑动方向过程中达到一定偏移量是也可以向上发送事件
                if (this.horizontal) {
                    if (yOffset - xOffset > 50) {
                        this.direction = ScrollViewDirection.VERTICAL
                    }
                }
                // this.direction = ScrollViewDirection.VERTICAL
            }
        }
        var canTransmit = (this.vertical && this.direction === ScrollViewDirection.HORIZONTAL) || this.horizontal && this.direction == ScrollViewDirection.VERTICAL
        if (canTransmit) {
            this.transmitEvent(event, Node.EventType.TOUCH_MOVE)
            event.stopPropagation()
            return
        }
        super["_onTouchMoved"](event, captureListeners)

    }

    protected _onTouchEnded(event: EventTouch, captureListeners: any) {

        super["_onTouchEnded"](event, captureListeners)
        this.transmitEvent(event, Node.EventType.TOUCH_END)

    }
    protected _onTouchCancelled(event: EventTouch, captureListeners: any) {

        this.transmitEvent(event, Node.EventType.TOUCH_CANCEL)

        super["_onTouchCancelled"](event, captureListeners)
    }
    protected transmitEvent(event: any, eventType: string) {
        var e = new EventTouch(event.getTouches(), event.bubbles)
        e.type = eventType
        e.touch = event.touch
        let target: any = event.target
        target.parent.dispatchEvent(e)
    }
}