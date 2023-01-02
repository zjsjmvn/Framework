// import UIKiller from "./uikiller";






// // const UIKillerBindFilter = {



// export class UIKillerBindFilter{
//     name: 'UIKillerBindFilter'

//     onCheckNode(node, target) {
//         if (node === target.node) {
//             return true;
//         }

//         let options = target.$options;
//         if (UIKiller.isFunction(options.filter)) {
//             if (options.filter(node)) {
//                 return false;
//             }
//         }

//         if (node.name[0] === '@') {
//             return false;
//         }
//     }
// };

// const LANGUAGE_TABLE = {
//     hello: '你好XXX',
//     world: '世界',
//     '1': 'hello',
//     '2': 'wrold',
// }
// const UIKillerLabelLanguage = {
//     name: 'UIKillerLabelLanguage',
//     onCheckNode(node, target) {
//         let label = node.getComponent(Label);
//         if (!label) {
//             return;
//         }
//         let key = node.$ || node.name;
//         let str = LANGUAGE_TABLE[key];
//         if (str) {
//             label.string = str;
//         }
//     }
// };

// uikiller.registerPlugin(UIKillerBindFilter);
// uikiller.registerPlugin(UIKillerLabelLanguage);
