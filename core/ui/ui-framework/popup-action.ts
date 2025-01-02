import { _decorator } from 'cc';
import Thor from '../ui-killer/thor';
import { Component } from 'cc';
import { UIOpacity } from 'cc';
import { tween } from 'cc';
import { v3 } from 'cc';
import PromiseUtil from '../../utils/promise-util';
const PREFAB_UI_DIR = 'Prefab/UI/';

const { property, ccclass } = _decorator


@ccclass("PopupAction")
export class PopupAction extends Component {

    private backgroundOriginalOpacity: { opacity: number } = null;
    protected duration: number = 0.2;

    runOpenAction() {



        // Promise.all

        this.runBgAction();
        this.runContainerAction();


    }
    runBgAction() {
        const background = this.node.getChildByName('Bg');
        if (background) {
            const oldOpacity = background.getComponent(UIOpacity).opacity;
            if (!this.backgroundOriginalOpacity) {
                this.backgroundOriginalOpacity = { opacity: oldOpacity }
            }
            background.active = true;
            background.getComponent(UIOpacity).opacity = 0;
            // 播放背景遮罩动画
            tween(background.getComponent(UIOpacity))
                .to(this.duration * 0.8, { opacity: this.backgroundOriginalOpacity.opacity })
                .start();
        }
    }
    runContainerAction() {
        const container = this.node.getChildByName('Container');
        if (container) {
            container.active = true;
            container.scale = v3(0.5, 0.5, 0.5);
            container.getComponent(UIOpacity).opacity = 0;
            // 播放弹窗主体动画
            tween(container)
                .to(this.duration, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                .call(() => {
                })
                .start();

            tween(container.getComponent(UIOpacity))
                .to(this.duration, { opacity: 255 }, { easing: 'backOut' })
                .call(() => {
                })
                .start();
        }
    }

    async runCloseAction(): Promise<boolean> {
        const background = this.node.getChildByName('Bg')
        if (background) {
            tween(background.getComponent(UIOpacity))
                .delay(this.duration * 0.2)
                .to(this.duration * 0.8, { opacity: 0 })
                .start();
        }

        const container = this.node.getChildByName('Container');
        if (container) {
            // 播放弹窗主体动画
            tween(container)
                .to(this.duration, { scale: v3(0.5, 0.5, 0.5) }, { easing: 'backIn' })
                .call(() => {

                })
                .start();

            tween(container.getComponent(UIOpacity))
                .to(this.duration, { opacity: 0 }, { easing: 'backIn' })
                .call(() => {

                })
                .start();
        }
        await PromiseUtil.delay(this.duration * 1000);
        return Promise.resolve(true);
    }


}
