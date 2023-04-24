import CachifyJS from "./lib/main";

export default async function cachify (axiosConfig, cacheConfig) {
    let cachifyjs = new CachifyJS()
    return await cachifyjs.get(axiosConfig, cacheConfig)
};