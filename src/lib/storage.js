export function setData (key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
export function getData (key)  {
    try {
        let data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
        return {message: "Data not found",nodata:true};
    } catch (e) {
        localStorage.removeItem(key);
        return {message: "Data not found",nodata:true};
    }
}
export function removeData (key) {
    localStorage.removeItem(key);
}