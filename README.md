# CachifyJS

CachifyJS is a lightweight npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application.

## Installation

```
npm install cachifyjs
```

## Usage
To use CachifyJS, you need to import it into your JavaScript file and pass your API call to the get function.
The get function will first check if the API response is already cached in local storage. If it is, it will
return the cached data and make the api call, cache the response and run the callback. If not, it will make
the API call, cache the response in local storage, and return the data.

Here's an example:
```
import CachifyJS from "cachifyjs";

function getData () {
    //make object from CachifyJS class
    let cachifyjs = new CachifyJS()

    const axiosConfig = {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        url: `https://www.yoursite.com/api/product/list?status=active`
    }

    const cacheConfig = {
        key: `product/list?status=active`,
        handleErrorCallback: handleError,
        postSync: {
            callback: handleResponse,
            syncTimeout: 1, //time in milliseconds
            syncInterval: 1000 * 60 * 60 * 3, //time in milliseconds
        },
    }
    try {
        //get request only
        let response = await cachifyjs.get (axiosConfig, cacheConfig)
        handleResponse (response)
    } catch (error) {
        //handle error
    }
}

function handleResponse (response) {
    //handle api response here
}

function handleError (error) {
    //handle if any error occurs during api call like: authentication error
}
```