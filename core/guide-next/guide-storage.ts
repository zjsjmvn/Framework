import { sys } from 'cc';
import { GuideProgressData, IGuideStorage } from './guide-types';

/** 本地存储 key 前缀，后面会拼 guideId 和 version。 */
const STORAGE_PREFIX = 'guide-next-progress:';

/** 默认进度存储：使用 Cocos sys.localStorage 保存每条引导的完成进度。 */
export class GuideLocalStorage implements IGuideStorage {
    /** 读取指定 guideId + version 的进度。解析失败或版本不匹配时返回 null。 */
    public loadProgress(guideId: string, version: number): GuideProgressData | null {
        const raw = sys.localStorage.getItem(this.getKey(guideId, version));
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.guideId === guideId && parsed.version === version) {
                return parsed;
            }
        } catch (error) {
            console.warn(`[GuideNext] parse progress failed: ${guideId}`, error);
        }

        return null;
    }

    /** 保存当前流程进度。 */
    public saveProgress(progress: GuideProgressData): void {
        if (!progress || !progress.guideId) {
            return;
        }

        sys.localStorage.setItem(this.getKey(progress.guideId, progress.version), JSON.stringify(progress));
    }

    /** 清理进度。传 version 只清指定版本，不传则清理该 guideId 的全部版本。 */
    public clearProgress(guideId: string, version?: number): void {
        if (version !== undefined && version !== null) {
            sys.localStorage.removeItem(this.getKey(guideId, version));
            return;
        }

        // 不传 version 时清理该 guideId 下的所有版本进度。
        const prefix = `${STORAGE_PREFIX}${guideId}:`;
        const keys: string[] = [];
        for (let i = 0; i < sys.localStorage.length; i++) {
            const key = sys.localStorage.key(i);
            if (key && key.indexOf(prefix) === 0) {
                keys.push(key);
            }
        }

        keys.forEach((key) => sys.localStorage.removeItem(key));
    }

    /** 生成本地存储 key。 */
    private getKey(guideId: string, version: number): string {
        return `${STORAGE_PREFIX}${guideId}:${version || 1}`;
    }
}
