import { StringFormatFunction } from './string-format';

export interface CodeVMBindingVM {
    /**
     * 绑定监听前读取指定 VM 路径的当前值。
     */
    getValue(path: string, def?: unknown): unknown;

    /**
     * 监听一个 VM 路径，并在该路径变化时触发回调。
     */
    bindPath(path: string, callback: Function, target?: unknown, useCapture?: boolean): void;

    /**
     * 使用相同 callback 和 target 移除之前注册的路径监听。
     */
    unbindPath(path: string, callback: Function, target?: unknown): void;
}

export interface CodeVMLabelTarget {
    string: string;
}

export interface CodeVMProgressTarget {
    progress: number;
}

export interface CodeVMActiveTarget {
    active: boolean;
}

type UnbindCallback = () => void;

/**
 * 给不适合在 scene/prefab 上挂 MVVM 组件的视图使用的代码式绑定作用域。
 * 调用方需要在自身生命周期结束时调用 clear() 释放所有 VM 监听。
 */
export class CodeVMBindingScope {
    private readonly unbindCallbacks: UnbindCallback[] = [];

    public constructor(private readonly vm: CodeVMBindingVM) {
    }

    /**
     * 将类 Label 目标绑定到一个 VM 路径，并可选地格式化显示文本。
     */
    public label(target: CodeVMLabelTarget, path: string, format: string = '', def: unknown = ''): void {
        const applyValue = (value: unknown): void => {
            target.string = this.formatLabelValue(value, format);
        };
        applyValue(this.vm.getValue(path, def));
        this.bind(path, applyValue);
    }

    /**
     * 将进度目标绑定到当前值和最大值两个 VM 路径，并把归一化结果限制在合法范围内。
     */
    public progress(target: CodeVMProgressTarget, currentPath: string, maxPath: string): void {
        let current = this.toNumber(this.vm.getValue(currentPath, 0));
        let max = this.toNumber(this.vm.getValue(maxPath, 0));
        const applyProgress = (): void => {
            target.progress = this.clampProgress(max === 0 ? 0 : current / max);
        };
        const applyCurrent = (value: unknown): void => {
            current = this.toNumber(value);
            applyProgress();
        };
        const applyMax = (value: unknown): void => {
            max = this.toNumber(value);
            applyProgress();
        };
        applyProgress();
        this.bind(currentPath, applyCurrent);
        this.bind(maxPath, applyMax);
    }

    /**
     * 将类 Node 的 active 标记绑定到一个 VM 路径的布尔值语义。
     */
    public active(target: CodeVMActiveTarget, path: string, def: unknown = false): void {
        const applyValue = (value: unknown): void => {
            target.active = Boolean(value);
        };
        applyValue(this.vm.getValue(path, def));
        this.bind(path, applyValue);
    }

    /**
     * 监听多个 VM 路径，并用这些路径的最新值重新执行派生视图刷新。
     */
    public computed(paths: string[], applyValues: (values: unknown[]) => void): void {
        const values = paths.map(path => this.vm.getValue(path));
        const apply = (): void => applyValues(values.slice());
        paths.forEach((path, index) => {
            this.bind(path, value => {
                values[index] = value;
                apply();
            });
        });
        apply();
    }

    /**
     * 解绑该作用域创建的所有监听；调用方应在所属视图生命周期结束时调用。
     */
    public clear(): void {
        while (this.unbindCallbacks.length > 0) {
            const unbind = this.unbindCallbacks.pop();
            if (unbind) {
                unbind();
            }
        }
    }

    /**
     * 注册一个 VM 路径监听，并保存对应的解绑动作供 clear() 统一释放。
     */
    private bind(path: string, applyValue: (value: unknown) => void): void {
        const callback = (newValue: unknown): void => applyValue(newValue);
        this.vm.bindPath(path, callback, this);
        this.unbindCallbacks.push(() => this.vm.unbindPath(path, callback, this));
    }

    /**
     * 将 VM 原始值转换为 Label 文本；传入格式 token 时走 StringFormatFunction。
     */
    private formatLabelValue(value: unknown, format: string): string {
        if (format === '') {
            return value == null ? '' : `${value}`;
        }
        return StringFormatFunction.deal(value as number | string, format);
    }

    /**
     * 将任意 VM 值归一成有限数字，供进度计算使用。
     */
    private toNumber(value: unknown): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    /**
     * 将归一化进度值限制在 Cocos ProgressBar 可接受的范围内。
     */
    private clampProgress(value: number): number {
        if (!Number.isFinite(value)) return 0;
        return Math.max(0, Math.min(1, value));
    }
}
