import CryptoJS from "crypto-js"

export function setData (key, data, encryptionSecretKey=null) {
    let  dataString = JSON.stringify(data)
    if (encryptionSecretKey) {
        dataString = CryptoJS.AES.encrypt(dataString, encryptionSecretKey).toString();
    }
    localStorage.setItem(key, dataString);
}
export function getData (key, encryptionSecretKey=null)  {
    try {
        let data = localStorage.getItem(key);
        if (!data) return {message: "Data not found",nodata:true};
        if (encryptionSecretKey) {
            data = CryptoJS.AES.decrypt(data, encryptionSecretKey).toString(CryptoJS.enc.Utf8);
        }
        data =  JSON.parse(data);
        return {data}
    } catch (e) {
        console.error(e.message)
        removeData(key);
        return {message: "Data not found",nodata:true};
    }
}
export function removeData (key) {
    localStorage.removeItem(key);
}