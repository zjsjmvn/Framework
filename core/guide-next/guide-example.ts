import { GuideFlowConfig, GuideService, GuideStepKind, GuideTargetMissPolicy, getOrAddGuideAnchor } from './index';
import { Node } from 'cc';

/** 示例流程：演示点击、拖拽和等待业务事件三类常用步骤。 */
export const ExampleGameGuideFlow: GuideFlowConfig = {
    guideId: 'game.first-play',
    version: 1,
    autoSaveProgress: true,
    debug: true,
    steps: [
        {
            id: 'tap-first-box',
            kind: GuideStepKind.Tap,
            target: 'game.first-box',
            text: '点击这个箭头盒',
            targetMissPolicy: GuideTargetMissPolicy.Wait,
            waitTargetTimeout: 8,
            passThrough: true,
        },
        {
            id: 'drag-box-to-shoot-zone',
            kind: GuideStepKind.Drag,
            from: 'game.first-box',
            to: 'game.shoot-zone',
            text: '移动到射击区域',
            targetMissPolicy: GuideTargetMissPolicy.Wait,
            passThrough: true,
        },
        {
            id: 'wait-first-pig-killed',
            kind: GuideStepKind.WaitEvent,
            eventName: 'guide:first-pig-killed',
            text: '',
            timeout: 15,
        },
    ],
};

/** 示例：动态节点生成后给它补 GuideAnchor。 */
export function registerDynamicGuideAnchor(node: Node, guideId: string) {
    return getOrAddGuideAnchor(node, guideId);
}

/** 示例：启动上面的流程。真实项目可传 Canvas 或当前界面根节点作为 parent。 */
export function startExampleGameGuide(parent?: Node) {
    return GuideService.start(ExampleGameGuideFlow, { parent });
}
