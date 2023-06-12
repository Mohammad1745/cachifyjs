import axios from "axios";
import toMs from "./ts.js";
import {getData, setData, removeData} from "./storage.js";
import {
    EXPIRATIONS_LS_KEY, INTERVALS_LS_KEY, LS_KEY_PREFIX, MASTER_ENC_KEY, MASTER_KEY, TIMEOUTS_LS_KEY
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

        //make separated function in next version (removeUntrackedData)
        const lsKeys = Object.keys(localStorage);
        lsKeys.forEach(lsKey => {
            if (lsKey.startsWith(LS_KEY_PREFIX)) {
                const items = this.keyMap.filter(item => item.keyLS == lsKey)
                if (!items.length) removeData(lsKey)
            }
        })

        const filtered = this.keyMap.filter((item) => item.key == this.key);
        if (filtered.length) {
            this.keyLS = filtered[0].keyLS

            if (this.encryption?.secretKey && this.keyLS == this.key) {
                this.keyLS = uniqueLSKey
                this.keyMap = this.keyMap.filter((item) => item.key != this.key)
                filtered[0].keyLS = this.keyLS
                this.keyMap.push(filtered[0]);

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

        //make separated function in next version (removeUntrackedData)
        this.keyMap.forEach(item => {
            if (item.key !== item.keyLS) removeData(item.key)
        })
    }

    updateExpiration () {
        const currentTime = (new Date()).getTime()
        const expiration = currentTime + toMs(this.lifetime)

        const response = getData(MASTER_KEY, MASTER_ENC_KEY);
        this.keyMap = response.nodata ? [] : response.data
        let filtered = this.keyMap.filter((item) => item.key == this.key);
        if (filtered.length) {
            this.keyMap = this.keyMap.filter((item) => item.key != this.key)
            filtered[0].expiration = expiration
            this.keyMap.push(filtered[0]);
            setData(MASTER_KEY, this.keyMap, MASTER_ENC_KEY);
        }
        removeData(EXPIRATIONS_LS_KEY)//remove in next version
    }

    removeExpiredData () {
        const currentTime = (new Date()).getTime()
        const oneHourBeforeTime = currentTime - toMs('1h')

        const response = getData(MASTER_KEY, MASTER_ENC_KEY);
        this.keyMap = response.nodata ? [] : response.data
        const filtered = this.keyMap.filter((item) => (item.key===this.key && item.expiration <= currentTime || item.expiration <= oneHourBeforeTime));
        if (filtered.length) {
            filtered.forEach(exItem => {
                this.keyMap = this.keyMap.filter((item) => exItem.key !== item.key);
                removeData(exItem.key)
            })
            setData(MASTER_KEY, this.keyMap, MASTER_ENC_KEY);
        }
    }

    updateInterval (id) {
        const response = getData(MASTER_KEY, MASTER_ENC_KEY);
        this.keyMap = response.nodata ? [] : response.data
        let filtered = this.keyMap.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            this.keyMap = this.keyMap.filter((item) => item.key != this.key)
            filtered[0].interval = id
            this.keyMap.push(filtered[0]);
            setData(MASTER_KEY, this.keyMap, MASTER_ENC_KEY);
        }
        removeData(INTERVALS_LS_KEY);//remove in next version
    }

    updateTimeout (id) {
        const response = getData(MASTER_KEY, MASTER_ENC_KEY);
        this.keyMap = response.nodata ? [] : response.data
        let filtered = this.keyMap.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearTimeout(item.timeout));
            this.keyMap = this.keyMap.filter((item) => item.key != this.key)
            filtered[0].timeout = id
            this.keyMap.push(filtered[0]);
            setData(MASTER_KEY, this.keyMap, MASTER_ENC_KEY);
        }
        removeData(TIMEOUTS_LS_KEY);//remove in next version
    }
};
export default CachifyCore;