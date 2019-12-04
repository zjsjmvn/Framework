

/**
 * @description 为类注入mvvm path，被注入的类会携带mvvmPath变量，存在的原因是release会压缩类名，导致无法搜索到路径
 * @date 2019-09-03
 * @export
 * @param {string} path
 * @returns
 */
export function InjectMVVMPath(path: string) {
    return function (target: Function) {
        target.prototype.mvvmPath = path;
    }
}