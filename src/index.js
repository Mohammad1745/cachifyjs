import CachifyCore from "./lib/main.js";

export const cachify = async (axiosConfig, cacheConfig) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.get(axiosConfig, cacheConfig)
}
export const updateCache = async (config, data) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.update(config, data)
}
export const removeCache = async (config) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.remove(config)
}