import axios from "axios";

class CachifyJS {
    axiosConfig;
    errorCallback;
    lifetime;
    preSync;
    postSync;
    key;
    response;

    constructor () {
        this.axiosConfig = null;
        this.errorCallback = null;
        this.lifetime = '2d';
        this.preSync = null;
        this.postSync = null;
        this.key = null;
        this.response = {};
    }

    async get (axiosConfig, cacheConfig) {
        if (!cacheConfig || axiosConfig.method !== "GET") {
            return null;
        }

        this.setup(axiosConfig, cacheConfig);
        this.removeExpiredData()

        if (this.preSync) {
            await this.refreshData();
            this.response.data = this.getData(this.key);
        } else {
            this.response.data = this.getData(this.key);
            if (this.response.data.nodata) {
                await this.refreshData();
                this.response.data = this.getData(this.key);
            } else if (this.postSync && this.postSync.syncTimeout) {
                const id = setTimeout(async () => {
                    await this.refreshData();
                    this.postSync.callback( this.getData(this.key));
                }, this.toMs( this.postSync.syncTimeout));

                this.updateTimeout(id);
            }

            if (this.postSync && this.postSync.syncInterval) {
                const id = setInterval(async () => {
                    await this.refreshData();
                    this.postSync.callback( this.getData(this.key));
                }, this.toMs( this.postSync.syncInterval));

                this.updateInterval(id);
            }
        }
        return this.response;
    }

    setup (axiosConfig, cacheConfig) {
        this.axiosConfig = axiosConfig;
        this.errorCallback = cacheConfig.errorCallback;
        this.lifetime = cacheConfig.lifetime ?? this.lifetime;
        this.preSync = cacheConfig.preSync;
        this.postSync = cacheConfig.postSync;
        this.key = cacheConfig.key;
        this.response = {};
    }

    async refreshData () {
        try {
            let response = await axios(this.axiosConfig);
            if (response.data) {
                this.updateExpiration()
                this.setData(this.key, response.data);
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
        const expiration = currentTime + this.toMs(this.lifetime)

        let expirations = this.getExpirations();
        expirations = expirations.filter((item) => item.key != this.key);
        expirations.push({ key: this.key, expiration });
        this.setExpirations(expirations);
    }

    removeExpiredData () {
        const currentTime = (new Date()).getTime()
        const oneHourBeforeTime = currentTime - (1000 * 60 * 60)

        let expirations = this.getExpirations();
        const filtered = expirations.filter((item) => (item.key===this.key && item.expiration <= currentTime || item.expiration <= oneHourBeforeTime));
        if (filtered.length) {
            filtered.forEach(exItem => {
                expirations = expirations.filter((item) => exItem.key !== item.key);
                this.removeData(exItem.key)
            })
            this.setExpirations(expirations);
        }
    }

    updateInterval (id) {
        let intervals = this.getIntervals();
        const filtered = intervals.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            intervals = intervals.filter((item) => item.key != this.key);
        }
        intervals.push({ key: this.key, id });
        this.setIntervals(intervals);
    }

    updateTimeout (id) {
        let timeouts = this.getTimeouts();
        const filtered = timeouts.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearTimeout(item.timeout));
            timeouts = timeouts.filter((item) => item.key != this.key);
        }
        timeouts.push({ key: this.key, id });
        this.setTimeouts(timeouts);
    }

    setIntervals (intervals) {
        localStorage.setItem("intervals", JSON.stringify(intervals));
    }

    getIntervals () {
        let data = localStorage.getItem("intervals");
        if (data) return JSON.parse(data);
        return [];
    }

    setTimeouts (timeouts) {
        localStorage.setItem("timeouts", JSON.stringify(timeouts));
    }

    getTimeouts () {
        let data = localStorage.getItem("timeouts");
        if (data) return JSON.parse(data);
        return [];
    }

    setExpirations (expirations) {
        localStorage.setItem("expirations", JSON.stringify(expirations));
    }

    getExpirations () {
        let data = localStorage.getItem("expirations");
        if (data) return JSON.parse(data);
        return [];
    }

    setData (key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    getData (key)  {
        try {
            let data = localStorage.getItem(key);
            if (data) return JSON.parse(data);
            return {message: "Data not found",nodata:true};
        } catch (e) {
            localStorage.removeItem(this.key);
            return {message: "Data not found",nodata:true};
        }
    }
    removeData (key) {
        localStorage.removeItem(key);
    }

    toMs(timeString) {
        if (typeof timeString === 'number') return timeString
        if (timeString.length > 2 && timeString.slice(-2) === 'ms') {
            timeString = timeString.slice(0, -2)
        }

        const timeSpecifiers = ['s', 'm', 'h', 'd', 'w']
        const timeMultipliers = [1000, 60, 60, 24, 7]
        const specifier = timeString.slice(-1);
        let time = 1;

        if (timeSpecifiers.includes(specifier)) {
            time = Number(timeString.slice(0, -1));
            if (isNaN(time)) throw new Error('Invalid time 1')
            for (let i = 0; i < timeSpecifiers.length; i++) {
                time *= timeMultipliers[i];
                if (specifier === timeSpecifiers[i]) {
                    break
                }
            }
        }
        else {
            time = Number(timeString)
        }

        if (isNaN(time)) throw new Error('Invalid time 2')
        return time
    }
};
export default CachifyJS;