import { EDITOR } from "cc/env";
import { assetManager, log, resources, warn } from 'cc';


/**
 * 编辑器工具类
 */
export default class EditorTool {
    /**
     * 编辑器模式下加载资源
     * @param url db://assets/
     */
    public static load<T>(url: string): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            if (!EDITOR) {
                resolve(null);
                return;
            }
            let uuid = await Editor.Message.request("asset-db", "query-uuid", `db://assets/${url}`);
            log(uuid);
            assetManager.loadAny(uuid, (err, result: T) => {
                if (err || !result) {
                    resolve(null);
                    warn(`[EditorTool.load] 资源加载失败 url: ${url},${err}`);
                    return;
                }
                resolve(result);
            })
            // resources.load({ type: "uuid", uuid: uuid }, (err: any, result: T) => {
            //     if (err || !result) {
            //         resolve(null);
            //         warn(`[EditorTool.load] 资源加载失败 url: ${url},${err}`);
            //         return;
            //     }
            //     resolve(result);
            // });

            // Editor.Assetdb.queryUuidByUrl(`db://assets/${url}`, (error: any, uuid: string) => {
            //     if (error || !uuid) {
            //         resolve(null);
            //         cc.warn(`[EditorTool.load] uuid查询失败 url: ${url}`);
            //         return;
            //     }
            //     //@ts-ignore
            //     resources.load({ type: "uuid", uuid: uuid }, (error: any, result: T) => {
            //         if (error || !result) {
            //             resolve(null);
            //             cc.warn(`[EditorTool.load] 资源加载失败 url: ${url}`);
            //             return;
            //         }
            //         resolve(result);
            //     });
            // });
        });
    }


}
