import axios from "axios";
import toMs from "./ts.js";
import {getData, setData, removeData} from "./storage.js";

class CachifyCore {
    axiosConfig;
    errorCallback;
    lifetime;
    preSync;
    postSync;
    afterUpdate;
    key;
    response;

    constructor () {
        this.axiosConfig = null;
        this.errorCallback = null;
        this.lifetime = '2d';
        this.preSync = null;
        this.postSync = null;
        this.afterUpdate = null;
        this.key = null;
        this.encryption = null;
        this.response = {};
    }

    async get (axiosConfig, cacheConfig) {
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
            this.response.data = getData(this.key, this.encryption?.secretKey);
        } else {
            this.response.data = getData(this.key, this.encryption?.secretKey);
            if (this.response.data.nodata) {
                await this.refreshData();
                this.response.data = getData(this.key, this.encryption?.secretKey);
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

    async update (config, data) {
        this.setup(null, config);
        this.removeExpiredData()
        this.updateExpiration()
        setData(this.key, data, this.encryption?.secretKey);
        if (this.afterUpdate) {
            if (this.afterUpdate.callback) {
                this.afterUpdate.callback( getData(this.key, this.encryption?.secretKey));
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
        this.afterUpdate = cacheConfig.afterUpdate;
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

        let expirations = getData('expirations');
        if (expirations.nodata) expirations = []
        expirations = expirations.filter((item) => item.key != this.key);
        expirations.push({ key: this.key, expiration });
        setData('expirations', expirations);
    }

    removeExpiredData () {
        const currentTime = (new Date()).getTime()
        const oneHourBeforeTime = currentTime - (1000 * 60 * 60)

        let expirations = getData('expirations');
        if (expirations.nodata) expirations = []
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
        let intervals = getData('intervals');
        if(intervals.nodata) intervals = []
        const filtered = intervals.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            intervals = intervals.filter((item) => item.key != this.key);
        }
        intervals.push({ key: this.key, id });
        setData('intervals', intervals);
    }

    updateTimeout (id) {
        let timeouts = getData('timeouts');
        if(timeouts.nodata) timeouts = []
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