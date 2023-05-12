import axios from "axios";
import toMs from "./ts.js";
import {getData, setData, removeData} from "./storage.js";

class CachifyCore {
    axiosConfig;
    errorCallback;
    lifetime;
    preSync;
    postSync;
    after;
    key;
    response;

    constructor () {
        this.axiosConfig = null;
        this.errorCallback = null;
        this.lifetime = '7d';
        this.preSync = null;
        this.postSync = null;
        this.after = null;
        this.key = null;
        this.encryption = null;
        this.response = {};
    }

    async cachify (axiosConfig, cacheConfig) {
        if (!cacheConfig) {
            console.error("No cacheConfig found!")
            return null;
        }
        if(axiosConfig.method !== "GET") {
            console.error("Not a GET request!")
            return null;
        }

        this.setup(axiosConfig, cacheConfig);
        this.removeExpiredData()

        if (this.preSync) {
            await this.refreshData();
            this.response = getData(this.key, this.encryption?.secretKey);
        } else {
            this.response = getData(this.key, this.encryption?.secretKey);
            if (this.response.nodata) {
                await this.refreshData();
                this.response = getData(this.key, this.encryption?.secretKey);
            } else if (this.postSync && this.postSync.syncTimeout) {
                const id = setTimeout(async () => {
                    await this.refreshData();
                    this.postSync.callback( getData(this.key, this.encryption?.secretKey));
                }, toMs( this.postSync.syncTimeout));

                this.updateTimeout(id);
            }

            if (this.postSync && this.postSync.syncInterval) {
                const id = setInterval(async () => {
                    await this.refreshData();
                    this.postSync.callback( getData(this.key, this.encryption?.secretKey));
                }, toMs( this.postSync.syncInterval));

                this.updateInterval(id);
            }
        }
        return this.response;
    }

    async get (config) {
        this.setup(null, config);
        this.removeExpiredData()
        this.updateExpiration()

        return getData(this.key, this.encryption?.secretKey);
    }

    async set (config, data) {
        this.setup(null, config);
        this.removeExpiredData()
        this.updateExpiration()
        setData(this.key, data, this.encryption?.secretKey);
        if (this.after) {
            if (this.after.callback) {
                this.after.callback( getData(this.key, this.encryption?.secretKey));
            }
        }
    }

    async remove (config) {
        this.setup(null, config);
        this.removeExpiredData()
        removeData(this.key);
    }

    setup (axiosConfig, cacheConfig) {
        this.axiosConfig = axiosConfig;
        this.errorCallback = cacheConfig.errorCallback;
        this.lifetime = cacheConfig.lifetime ?? this.lifetime;
        this.preSync = cacheConfig.preSync;
        this.postSync = cacheConfig.postSync;
        this.after = cacheConfig.after;
        this.key = cacheConfig.key;
        this.encryption = cacheConfig.encryption ?? this.encryption;
        this.response = {};
    }

    async refreshData () {
        try {
            let response = await axios(this.axiosConfig);
            if (response.data) {
                this.updateExpiration()
                setData(this.key, response.data, this.encryption?.secretKey);
            } else {
                throw new Error(response.response);
            }
        } catch (error) {
            if (this.errorCallback) {
                this.errorCallback(error);
            }
            else {
                throw new Error(error);
            }
        }
    }

    updateExpiration () {
        const currentTime = (new Date()).getTime()
        const expiration = currentTime + toMs(this.lifetime)

        let response = getData('expirations');
        let expirations = response.nodata ? [] : response.data
        expirations = expirations.filter((item) => item.key != this.key);
        expirations.push({ key: this.key, expiration });
        setData('expirations', expirations);
    }

    removeExpiredData () {
        const currentTime = (new Date()).getTime()
        const oneHourBeforeTime = currentTime - (1000 * 60 * 60)

        let response = getData('expirations');
        let expirations = response.nodata ? [] : response.data
        const filtered = expirations.filter((item) => (item.key===this.key && item.expiration <= currentTime || item.expiration <= oneHourBeforeTime));
        if (filtered.length) {
            filtered.forEach(exItem => {
                expirations = expirations.filter((item) => exItem.key !== item.key);
                removeData(exItem.key)
            })
            setData('expirations', expirations);
        }
    }

    updateInterval (id) {
        let response = getData('intervals');
        let intervals = response.nodata ? [] : response.data
        const filtered = intervals.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            intervals = intervals.filter((item) => item.key != this.key);
        }
        intervals.push({ key: this.key, id });
        setData('intervals', intervals);
    }

    updateTimeout (id) {
        let response = getData('timeouts');
        let timeouts = response.nodata ? [] : response.data
        const filtered = timeouts.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearTimeout(item.timeout));
            timeouts = timeouts.filter((item) => item.key != this.key);
        }
        timeouts.push({ key: this.key, id });
        setData('timeouts', timeouts);
    }
};
export default CachifyCore;