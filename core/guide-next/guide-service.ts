import { director, instantiate, Node, Prefab, resources, UITransform, v3 } from 'cc';
import { GuideDefaultOverlay } from './guide-default-overlay';
import { GuideFlowComponent } from './guide-flow-component';
import { GuideRunner } from './guide-runner';
import { GuideFlowConfig, GuideStartOptions, IGuideOverlay } from './guide-types';

/** 引导服务入口：负责创建遮罩、启动 runner，并保证同一时间只有一条引导在跑。 */
export class GuideService {
    /** 当前活动中的 runner。 */
    private static activeRunner: GuideRunner | null = null;

    /** 启动一条引导流程。传入 GuideFlowComponent 时会先转换成 GuideFlowConfig。 */
    public static async start(flow: GuideFlowConfig | GuideFlowComponent, options: GuideStartOptions = {}): Promise<GuideRunner> {
        const flowConfig = flow instanceof GuideFlowComponent ? flow.toFlowConfig() : flow;
        if (!flowConfig || !flowConfig.guideId) {
            throw new Error('[GuideNext] guideId is required.');
        }
        if (!flowConfig.steps || flowConfig.steps.length === 0) {
            throw new Error(`[GuideNext] guide "${flowConfig.guideId}" has no steps.`);
        }

        this.stopActive('new guide started');

        // 全局只保留一个活动 runner，避免多个遮罩和触摸处理互相抢输入。
        const overlay = options.overlay || await this.createOverlay(options);
        this.applyOverlayDefaults(flowConfig, overlay);
        if (flowConfig.debug) {
            console.log(`[GuideNext] start guide: ${flowConfig.guideId}, steps=${flowConfig.steps.length}`);
        }
        const runner = new GuideRunner(flowConfig, overlay, options);
        this.activeRunner = runner;

        runner.start().then(() => {
            if (this.activeRunner === runner) {
                this.activeRunner = null;
            }
        }).catch((error) => {
            if (this.activeRunner === runner) {
                this.activeRunner = null;
            }
            options.onError?.(error);
            console.error('[GuideNext] guide failed', error);
        });

        return runner;
    }

    /** 停止当前引导。没有活动引导时什么也不做。 */
    public static stopActive(reason: string = 'stopped'): void {
        if (!this.activeRunner) {
            return;
        }

        const runner = this.activeRunner;
        this.activeRunner = null;
        if (runner.flow.debug) {
            console.log(`[GuideNext] stop active guide: ${runner.flow.guideId}, reason=${reason}`);
        }
        runner.stop(reason);
    }

    /** 获取当前活动 runner，业务可用于 emit 事件或调试。 */
    public static getActiveRunner(): GuideRunner | null {
        return this.activeRunner;
    }

    /** 创建默认遮罩；如果传了 overlayPrefabPath，则加载 prefab。 */
    private static async createOverlay(options: GuideStartOptions): Promise<IGuideOverlay> {
        if (options.overlayPrefabPath) {
            return this.createOverlayFromPrefab(options);
        }

        // 默认遮罩挂在 Canvas 下并铺满父节点，坐标习惯和普通 UI 保持一致。
        const parent = options.parent || this.findDefaultParent();
        const node = new Node('GuideNextOverlay');
        node.layer = parent.layer;
        const parentTransform = parent.getComponent(UITransform);
        const transform = node.addComponent(UITransform);
        transform.anchorX = 0.5;
        transform.anchorY = 0.5;
        transform.setContentSize(parentTransform.width, parentTransform.height);
        node.setPosition(v3(0, 0, 0));
        parent.addChild(node);
        if (options.childIndex !== undefined && options.childIndex !== null) {
            node.setSiblingIndex(options.childIndex);
        }

        return node.addComponent(GuideDefaultOverlay);
    }

    /** 把流程级默认遮罩配置应用到默认遮罩。自定义遮罩保持业务自己处理。 */
    private static applyOverlayDefaults(flow: GuideFlowConfig, overlay: IGuideOverlay): void {
        const defaults = flow.overlayDefaults;
        if (!defaults || !(overlay instanceof GuideDefaultOverlay)) {
            return;
        }

        if (defaults.maskOpacity !== undefined) {
            overlay.maskOpacity = defaults.maskOpacity;
        }
        if (defaults.holeRadius !== undefined) {
            overlay.holeRadius = defaults.holeRadius;
        }
        if (defaults.fingerMoveSpeed !== undefined) {
            overlay.fingerMoveSpeed = defaults.fingerMoveSpeed;
        }
        if (defaults.fingerSpritePath !== undefined) {
            overlay.fingerSpritePath = defaults.fingerSpritePath;
        }
    }

    /** 从 resources 加载遮罩 prefab，并确保节点上有 GuideDefaultOverlay。 */
    private static createOverlayFromPrefab(options: GuideStartOptions): Promise<IGuideOverlay> {
        return new Promise((resolve, reject) => {
            resources.load(options.overlayPrefabPath, Prefab, (error, prefab) => {
                if (error) {
                    reject(error);
                    return;
                }

                const parent = options.parent || this.findDefaultParent();
                const node = instantiate(prefab);
                node.layer = parent.layer;
                node.setPosition(v3(0, 0, 0));
                parent.addChild(node);
                if (options.childIndex !== undefined && options.childIndex !== null) {
                    node.setSiblingIndex(options.childIndex);
                }

                let overlay = node.getComponent(GuideDefaultOverlay);
                if (!overlay) {
                    overlay = node.addComponent(GuideDefaultOverlay);
                }
                resolve(overlay);
            });
        });
    }

    /** 查找默认 Canvas。没有 Canvas 时要求调用方显式传 parent。 */
    private static findDefaultParent(): Node {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        if (!canvas) {
            throw new Error('[GuideNext] Canvas not found. Pass GuideStartOptions.parent explicitly.');
        }
        return canvas;
    }
}
