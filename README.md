# HardCache

HardCache is a lightweight npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application.

## Installation

```
npm install hardcache
```

## Usage
To use HardCache, you need to import it into your JavaScript file and pass your API call to the get function.
The get function will first check if the API response is already cached in local storage. If it is, it will 
return the cached data. If not, it will make the API call, cache the response in local storage, and return 
the data.

Here's an example:
```
import axios from "axios";
import HardCache from "hardcache";

function getData () {
    //make object from HardCache class
    let hardCache = new HardCache()

    const axiosConfig = {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        url: `https://www.yoursite.com/api/product/list?status=active`
    }

    const cacheConfig = {
        key: `product/list?status=active`,
        handleCacheCallbackError,
        postSync: {
            callback,
            syncTimeout: 1, //time in milliseconds
        },
    }
//get request only
    try {
        let response = await hardCache.request(axiosConfig, cacheConfig)

        //handle you api response
    } catch (error) {
        //handle error
    }
}

function handleCacheCallbackError (error) {
    //handle if callback has any error like: authentication error
};
```