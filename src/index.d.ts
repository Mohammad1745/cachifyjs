interface AxiosConfig {
    method: string;
    headers?: object;
    url: string;
}

interface CacheConfig {
    key: string;
    errorCallback?: (error: any) => void;
    lifetime?: number | string;
    encryption?: {
        secretKey: string;
    };
    preSync?: boolean;
    postSync?: {
        callback: (response: any) => void;
        syncTimeout?: number | string;
        syncInterval?: number | string;
    };
}

interface CacheGetConfig {
    key: string;
}
interface CacheSetConfig {
    key: string;
    lifetime?: number | string;
    encryption?: {
        secretKey: string;
    };
    after?: {
        callback: (response: any) => any;
    };
}
interface CacheUpdateConfig {
    key: string; // same as the cached key
    lifetime?: number | string;
    encryption?: {
        secretKey: string;
    };
    after?: {
        callback: (response: any) => any;
    };
}
interface CacheRemoveConfig {
    key: string;
}

export function cachify(
    axiosConfig: AxiosConfig,
    cacheConfig: CacheConfig
): Promise<any>;

export function getCache(
    config: CacheGetConfig
): Promise<void>;

export function setCache(
    config: CacheSetConfig,
    data: any
): Promise<void>;

export function updateCache(
    config: CacheUpdateConfig,
    data: any
): Promise<void>;

export function removeCache(
    config: CacheRemoveConfig
): Promise<void>;
