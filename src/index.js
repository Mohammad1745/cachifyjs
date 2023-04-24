import CachifyJS from "./lib/main.js";

export default async function cachify (axiosConfig, cacheConfig) {
    let cachifyjs = new CachifyJS()
    return await cachifyjs.get(axiosConfig, cacheConfig)
};