// // Learn TypeScript:
// //  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

// const { ccclass, property } = _decorator;

// @ccclass
// export default class XPageView extends PageView {
//     //this is for nested scrollview
//     hasNestedViewGroup(event, captureListeners) {
//         if (event.eventPhase !== Event.CAPTURING_PHASE) return;

//         var touch = event.touch;
//         if (!touch) return;
//         var deltaMove = touch.getLocation().sub(touch.getStartLocation())
//         if (deltaMove.x > 7 || deltaMove.x < -7)
//             return false;
//         // if (deltaMove.y > 7 || deltaMove.y < -7)
//         //     return false;
//         if (captureListeners) {
//             //captureListeners are arranged from child to parent
//             for (var i = 0; i < captureListeners.length; ++i) {
//                 var item = captureListeners[i];

//                 if (this.node === item) {
//                     if (event.target.getComponent(ViewGroup)) {
//                         return true;
//                     }
//                     return false;
//                 }

//                 if (item.getComponent(ViewGroup)) {
//                     return true;
//                 }
//             }
//         }

//         return false;
//     }

//     // update (dt) {}
// }
