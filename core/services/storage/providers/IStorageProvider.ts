export interface IStorageProvider {
    read(key: string, def?: any);
    write(key: string, value: any);
    readObj<T>(key: string, def?: T): T

}