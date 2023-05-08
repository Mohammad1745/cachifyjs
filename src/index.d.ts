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

interface CachifyResponse {
    data: any;
}
interface CacheUpdateConfig {
    key: string; // same as the cached key
    lifetime?: number | string;
    encryption?: {
        secretKey: string;
    };
    afterUpdate?: {
        callback: (response: any) => any;
    };
}
interface CacheRemoveConfig {
    key: string;
}

export function cachify(
    axiosConfig: AxiosConfig,
    cacheConfig: CacheConfig
): Promise<CachifyResponse>;

export function updateCache(
    config: CacheUpdateConfig,
    data: any
): Promise<void>;

export function removeCache(
    config: CacheRemoveConfig
): Promise<void>;
