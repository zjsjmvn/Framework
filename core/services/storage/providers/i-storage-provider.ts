/** 本地存储 provider 接口，具体实现可选择明文、本地加密或平台存储。 */
export interface IStorageProvider {
    /** 读取基础类型值，缺失时返回默认值。 */
    read(key: string, def?: any);
    /** 写入值；部分实现会把 null 视为删除。 */
    write(key: string, value: any);
    /** 按 JSON 对象读取，解析失败时返回默认值。 */
    readObj<T>(key: string, def?: T): T

}
