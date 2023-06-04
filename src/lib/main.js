import axios from "axios";
import toMs from "./ts.js";
import {getData, setData, removeData} from "./storage.js";
import {
    EXPIRATIONS_ENC_KEY, EXPIRATIONS_LS_KEY,
    INTERVALS_ENC_KEY, INTERVALS_LS_KEY, LS_KEY_PREFIX, MASTER_ENC_KEY, MASTER_KEY,
    TIMEOUTS_ENC_KEY, TIMEOUTS_LS_KEY
} from "./consts.js";

class CachifyCore {
    axiosConfig;
    errorCallback;
    lifetime;
    preSync;
    postSync;
    after;
    key;
    keyLS;
    keyMap;
    response;

    constructor () {
        this.axiosConfig = null;
        this.errorCallback = null;
        this.lifetime = '7d';
        this.preSync = null;
        this.postSync = null;
        this.after = null;
        this.key = null;
        this.keyLS = null;
        this.keyMap = [];
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
        this.updateKeyMap()
        this.removeExpiredData()

        if (this.preSync) {
            await this.refreshData();
            this.response = getData(this.keyLS, this.encryption?.secretKey);
        } else {
            this.response = getData(this.keyLS, this.encryption?.secretKey);
            if (this.response.nodata) {
                await this.refreshData();
                this.response = getData(this.keyLS, this.encryption?.secretKey);
            } else if (this.postSync && this.postSync.syncTimeout) {
                const id = setTimeout(async () => {
                    await this.refreshData();
                    this.postSync.callback( getData(this.keyLS, this.encryption?.secretKey));
                }, toMs( this.postSync.syncTimeout));

                this.updateTimeout(id);
            }

            if (this.postSync && this.postSync.syncInterval) {
                const id = setInterval(async () => {
                    await this.refreshData();
                    this.postSync.callback( getData(this.keyLS, this.encryption?.secretKey));
                }, toMs( this.postSync.syncInterval));

                this.updateInterval(id);
            }
        }
        return this.response;
    }

    async get (config) {
        this.setup(null, config);
        this.updateKeyMap()
        this.removeExpiredData()
        this.updateExpiration()

        return getData(this.keyLS, this.encryption?.secretKey);
    }

    async set (config, data) {
        this.setup(null, config);
        this.updateKeyMap()
        this.removeExpiredData()
        this.updateExpiration()
        setData(this.keyLS, data, this.encryption?.secretKey);
        if (this.after) {
            if (this.after.callback) {
                this.after.callback( getData(this.keyLS, this.encryption?.secretKey));
            }
        }
    }

    async remove (config) {
        this.setup(null, config);
        this.updateKeyMap()
        this.removeExpiredData()
        removeData(this.keyLS);
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
                setData(this.keyLS, response.data, this.encryption?.secretKey);
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

    updateKeyMap () {
        const uniqueLSKey = LS_KEY_PREFIX + (new Date()).getTime()
        const response = getData(MASTER_KEY, MASTER_ENC_KEY);
        this.keyMap = response.nodata ? [] : response.data

        const filtered = this.keyMap.filter((item) => item.key == this.key);
        if (filtered.length) {
            this.keyLS = filtered[0].keyLS

            if (this.encryption?.secretKey && this.keyLS == this.key) {
                this.keyLS = uniqueLSKey
                this.keyMap = this.keyMap.filter((item) => item.key != this.key)
                this.keyMap.push({ key: this.key, keyLS: this.keyLS});

                const response = getData(this.key)
                removeData(this.key)
                if (response.data) {
                    setData(this.keyLS, response.data)
                }
            }
        }
        else {
            this.keyLS = this.encryption?.secretKey ? uniqueLSKey : this.key
            this.keyMap.push({ key: this.key, keyLS: this.keyLS});
        }
        setData(MASTER_KEY, this.keyMap, MASTER_ENC_KEY);
    }

    updateExpiration () {
        const currentTime = (new Date()).getTime()
        const expiration = currentTime + toMs(this.lifetime)

        let response = getData(EXPIRATIONS_LS_KEY,EXPIRATIONS_ENC_KEY);
        let expirations = response.nodata ? [] : response.data
        expirations = expirations.filter((item) => item.key != this.keyLS);
        expirations.push({ key: this.keyLS, expiration });
        setData(EXPIRATIONS_LS_KEY, expirations, EXPIRATIONS_ENC_KEY);
    }

    removeExpiredData () {
        const currentTime = (new Date()).getTime()
        const oneHourBeforeTime = currentTime - (1000 * 60 * 60)

        let response = getData(EXPIRATIONS_LS_KEY,EXPIRATIONS_ENC_KEY);
        let expirations = response.nodata ? [] : response.data
        const filtered = expirations.filter((item) => (item.key===this.keyLS && item.expiration <= currentTime || item.expiration <= oneHourBeforeTime));
        if (filtered.length) {
            filtered.forEach(exItem => {
                expirations = expirations.filter((item) => exItem.key !== item.key);
                removeData(exItem.key)
            })
            setData(EXPIRATIONS_LS_KEY, expirations, EXPIRATIONS_ENC_KEY);
        }
    }

    updateInterval (id) {
        let response = getData(INTERVALS_LS_KEY, INTERVALS_ENC_KEY);
        let intervals = response.nodata ? [] : response.data
        const filtered = intervals.filter((item) => item.key == this.keyLS);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            intervals = intervals.filter((item) => item.key != this.keyLS);
        }
        intervals.push({ key: this.keyLS, id });
        setData(INTERVALS_LS_KEY, intervals, INTERVALS_ENC_KEY);
    }

    updateTimeout (id) {
        let response = getData(TIMEOUTS_LS_KEY, TIMEOUTS_ENC_KEY);
        let timeouts = response.nodata ? [] : response.data
        const filtered = timeouts.filter((item) => item.key == this.keyLS);
        if (filtered.length) {
            filtered.forEach((item) => clearTimeout(item.timeout));
            timeouts = timeouts.filter((item) => item.key != this.keyLS);
        }
        timeouts.push({ key: this.keyLS, id });
        setData(TIMEOUTS_LS_KEY, timeouts, TIMEOUTS_ENC_KEY);
    }
};
export default CachifyCore;