export type WeChatLaunchSourceCategory =
    | "search"
    | "share"
    | "scan"
    | "ad"
    | "video_channel"
    | "official_account"
    | "mini_program"
    | "natural"
    | "other";

export interface WeChatLaunchOptions {
    scene?: number;
    query?: Record<string, any>;
    shareTicket?: string;
    referrerInfo?: {
        appId?: string;
        extraData?: any;
    };
}

export interface WeChatRegistrationSourceDto {
    sourceType: WeChatLaunchSourceCategory;
    scene: number;
    queryString: string;
    referrerAppId: string;
}

const SEARCH_SCENES = [1005, 1006];
const SHARE_SCENES = [1007, 1008, 1044];
const SCAN_SCENES = [1011, 1012, 1013];
const OFFICIAL_ACCOUNT_SCENES = [1020, 1035, 1043, 1427];
const VIDEO_CHANNEL_SCENES = [1198, 1206];
const NATURAL_SCENES = [1001, 1272];

export function getWeChatLaunchSourceCategory(options: WeChatLaunchOptions): WeChatLaunchSourceCategory {
    const scene = Number(options?.scene) || 0;
    const query = options?.query || {};

    if (query.wxgamepro || query.channel) {
        return "ad";
    }

    if (scene === 1428 || scene === 1187) {
        return "ad";
    }

    if (scene === 1037 && options?.referrerInfo?.appId) {
        return "mini_program";
    }

    if (OFFICIAL_ACCOUNT_SCENES.includes(scene)) {
        return "official_account";
    }

    if (SHARE_SCENES.includes(scene)) {
        return "share";
    }

    if (SCAN_SCENES.includes(scene)) {
        return "scan";
    }

    if (SEARCH_SCENES.includes(scene)) {
        return "search";
    }

    if (VIDEO_CHANNEL_SCENES.includes(scene)) {
        return "video_channel";
    }

    if (NATURAL_SCENES.includes(scene)) {
        return "natural";
    }

    return "other";
}

export function createWeChatRegistrationSource(options: WeChatLaunchOptions): WeChatRegistrationSourceDto {
    const scene = Number(options?.scene) || 0;
    return {
        sourceType: getWeChatLaunchSourceCategory(options),
        scene,
        queryString: stringifyQuery(options?.query),
        referrerAppId: options?.referrerInfo?.appId || "",
    };
}

export function createCurrentWeChatRegistrationSource(): WeChatRegistrationSourceDto {
    const wxObject = (globalThis as any)["wx"];
    if (!wxObject?.getLaunchOptionsSync) {
        return createWeChatRegistrationSource({});
    }

    return createWeChatRegistrationSource(wxObject.getLaunchOptionsSync());
}

function stringifyQuery(query?: Record<string, any>): string {
    if (!query) {
        return "";
    }

    return Object.keys(query)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
        .join("&");
}
