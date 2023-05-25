import { director } from 'cc';
import { VM_EMIT_HEAD, ViewModel, getValueFromPath, setValueFromPath } from './view-model';
/**
 * VM 对象管理器(工厂)
 */
class VMManager {
    /**静态数组，保存创建的 mv 组件 */
    private viewModels: Array<{ tag: string, vm: ViewModel<any> }> = [];

    /**
     * 绑定一个数据，并且可以由VM所管理
     * @param data 需要绑定的数据
     * @param tag 对应该数据的标签(用于识别为哪个VM，不允许重复)
     * @param activeRootObject 激活主路径通知，可能会有性能影响，一般不使用
     */
    add<T>(data: T, tag: string = 'global', activeRootObject: boolean = false) {
        let vm = new ViewModel<T>(data, tag);
        let has = this.viewModels.find(v => v.tag === tag);
        if (tag.includes('.')) {
            console.error('cant write . in tag:', tag);
            return;
        }
        if (has) {
            console.error('already set VM tag:' + tag);
            return;
        }

        vm.emitToRootPath = activeRootObject;
        this.viewModels.push({ tag: tag, vm: vm });

    }

    /**
     * 移除并且销毁 VM 对象
     * @param tag 
     */
    remove(tag: string) {
        let index = this.viewModels.findIndex(v => v.tag === tag);
        if (index >= 0) this.viewModels.splice(index, 1);
    }

    /**
     * 获取绑定的数据
     * @param tag 数据tag
     */
    get<T>(tag: string): ViewModel<T> {
        let res = this.viewModels.find(v => v.tag === tag);
        if (res == null) {
            console.error('cant find VM from:', tag);
        } else {
            return res.vm;
        }
    }

    /**
     * 通过全局路径,而不是 VM 对象来 设置值
     * @param path - 全局取值路径
     * @param value - 需要增加的值
     */
    addValue(path: string, value: any) {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if (rs.length < 2) { console.error('Cant find path:' + path) };
        let vm = this.get(rs[0]);
        if (!vm) { console.error('Cant Set VM:' + rs[0]); return; };
        let resPath = rs.slice(1).join('.');
        vm.setValue(resPath, vm.getValue(resPath) + value);
    }

    /**
     * 通过全局路径,而不是 VM 对象来 获取值
     * @param path - 全局取值路径
     * @param def - 如果取不到值的返回的默认值
     */
    getValue(path: string, def?: any): any {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if (rs.length < 2) { console.error('Get Value Cant find path:' + path); return; };
        let vm = this.get(rs[0]);
        if (!vm) { console.error('Cant Get VM:' + rs[0]); return; };
        return vm.getValue(rs.slice(1).join('.'), def);
    }

    /**
     * 通过全局路径,而不是 VM 对象来 设置值
     * @param path - 全局取值路径
     * @param value - 需要设置的值
     */
    setValue(path: string, value: any) {
        path = path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if (rs.length < 2) { console.error('Set Value Cant find path:' + path); return; };
        let vm = this.get(rs[0]);
        if (!vm) { console.error('Cant Set VM:' + rs[0]); return; };
        vm.setValue(rs.slice(1).join('.'), value);

    }

    setObjValue = setValueFromPath;
    getObjValue = getValueFromPath;

    /**等同于 director.on */
    bindPath(path: string, callback: Function, target?: any, useCapture?: boolean): void {
        path = path.trim();//防止空格,自动剔除
        if (path == '') {
            console.error(target.node.name, '节点绑定的路径为空');
            return;
        }
        if (path.split('.')[0] === '*') {
            console.error(path, '路径不合法,可能错误覆盖了 VMParent 的onLoad 方法, 或者父节点并未挂载 VMParent 相关的组件脚本');
            return;
        }
        //@ts-ignore
        director.on(VM_EMIT_HEAD + path, callback, target, useCapture);
    }

    /**等同于 director.off */
    unbindPath(path: string, callback: Function, target?: any): void {
        path = path.trim();//防止空格,自动剔除
        if (path.split('.')[0] === '*') {
            console.error(path, '路径不合法,可能错误覆盖了 VMParent 的onLoad 方法, 或者父节点并未挂载 VMParent 相关的组件脚本');
            return;
        }
        //@ts-ignore
        director.off(VM_EMIT_HEAD + path, callback, target);
    }


    /**冻结所有标签的 VM，视图将不会受到任何信息 */
    inactive(): void {
        this.viewModels.forEach(mv => {
            mv.vm.active = false;
        })
    }

    /**激活所有标签的 VM*/
    active(): void {
        this.viewModels.forEach(mv => {
            mv.vm.active = true;
        })
    }

}

//   整数、小数、时间、缩写

export let VM = new VMManager();