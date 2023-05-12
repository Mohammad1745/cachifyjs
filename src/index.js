import CachifyCore from "./lib/main.js";

export const cachify = async (axiosConfig, cacheConfig) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.cachify(axiosConfig, cacheConfig)
}
export const getCache = async (config) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.get(config)
}
export const setCache = async (config, data) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.set(config, data)
}
export const updateCache = async (config, data) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.set(config, data)
}
export const removeCache = async (config) => {
    let cachifyCore = new CachifyCore()
    return await cachifyCore.remove(config)
}