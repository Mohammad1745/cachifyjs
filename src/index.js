import axios from "axios";

class CachifyJS {
    axiosConfig;
    handleErrorCallback;
    preSync;
    postSync;
    key;
    response;

    constructor() {
        this.axiosConfig = null;
        this.handleErrorCallback = null;
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
        if (this.preSync) {
            await this.refreshData();
            this.response.data = this.getData(this.key);
        } else {
            this.response.data = this.getData(this.key);
            if (!this.response.data.success) {
                await this.refreshData();
                this.response.data = this.getData(this.key);
            } else if (this.postSync && this.postSync.syncTimeout) {
                const id = setTimeout(async () => {
                    await this.refreshData();
                    this.postSync.callback(this.getData(this.key));
                }, this.postSync.syncTimeout);

                this.updateTimeout(id);
            }

            if (this.postSync && this.postSync.syncInterval) {
                const id = setInterval(async () => {
                    await this.refreshData();
                    this.postSync.callback(this.getData(this.key));
                }, this.postSync.syncInterval);

                this.updateInterval(id);
            }
        }
        return this.response;
    }

    setup(axiosConfig, cacheConfig) {
        this.axiosConfig = axiosConfig;
        this.handleErrorCallback = cacheConfig.handleErrorCallback;
        this.preSync = cacheConfig.preSync;
        this.postSync = cacheConfig.postSync;
        this.key = cacheConfig.key;
        this.response = {};
    }

    async refreshData() {
        try {
            let response = await axios(this.axiosConfig);
            if (response.data) {
                this.setData(this.key, response.data);
            } else {
                throw new Error(response.response);
            }
        } catch (error) {
            if (this.handleErrorCallback) {
                this.handleErrorCallback(error);
            }
            else {
                throw new Error(error);
            }
        }
    }

    updateInterval(id) {
        let intervals = this.getIntervals();
        const filtered = intervals.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearInterval(item.interval));
            intervals = intervals.filter((item) => item.key != this.key);
        }
        intervals.push({ key: this.key, id });
        this.setIntervals(intervals);
    }

    updateTimeout(id) {
        let timeouts = this.getTimeouts();
        const filtered = timeouts.filter((item) => item.key == this.key);
        if (filtered.length) {
            filtered.forEach((item) => clearTimeout(item.timeout));
            timeouts = timeouts.filter((item) => item.key != this.key);
        }
        timeouts.push({ key: this.key, id });
        this.setTimeouts(timeouts);
    }

    setIntervals(intervals) {
        localStorage.setItem("intervals", JSON.stringify(intervals));
    }

    getIntervals() {
        let data = localStorage.getItem("intervals");
        if (data) return JSON.parse(data);
        return [];
    }

    setTimeouts(timeouts) {
        localStorage.setItem("timeouts", JSON.stringify(timeouts));
    }

    getTimeouts() {
        let data = localStorage.getItem("timeouts");
        if (data) return JSON.parse(data);
        return [];
    }

    setData(key, data){
        localStorage.setItem(key, JSON.stringify(data));
    }
    getData (key)  {
        try {
            let data = localStorage.getItem(key);
            if (data) return JSON.parse(data);
            return {message: "Data not found"};
        } catch (e) {
            localStorage.removeItem(this.key);
            return {message: "Data not found"};
        }
    }
};
export default CachifyJS;