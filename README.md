# CachifyJS

CachifyJS is a lightweight npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application.

## Installation

```
npm install cachifyjs
```

## Usage
To use CachifyJS, you need to import it into your JavaScript file and pass your API call to the `get` function.
The `get` function will first check if the API response is already cached in local storage. If it is, it will
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
        errorCallback: handleError,
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
    //handle if any error occurs during data refreshing on api call (ex: authentication error)
}
```

## Configuration
When using CachifyJS, you can configure various options to customize the caching behavior. The `cacheConfig` object passed to the `get` function accepts the following properties:

- `key`: (required) A string that uniquely identifies the API endpoint being called. This key is used as the key for caching the response in local storage.

- `errorCallback`: (optional) A callback function that will be called if an error occurs during the API call. This can be used to handle errors such as authentication failures.

- `preSync`: (optional) A boolean that simply enables caching after getting api response and then sending data to frontend.

- `postSync`: (optional) An object that defines how the cache should be updated after the API response is returned. This is useful when you want to keep the cache up to date with new data periodically.

  - `callback`: (required) A callback function that will be called with the API response after it has been cached.

  - `syncTimeout`: (optional) The number of milliseconds to wait before syncing the cache with new data. This is useful if you want to avoid syncing the cache too frequently.
                    It's a one time call.

  - `syncInterval`: (optional) The number of milliseconds to wait before syncing the cache again. This is useful if you want to periodically update the cache with new data.

## Key Points
1. A single cachifyjs object can handle single api call at a time.
2. If multiple api call need to be cached at the same time. Make multiple objects.
3. For multiple api call,
```
import CachifyJS from "cachifyjs";

function getData () {
    const axiosConfig = {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        url: `https://www.yoursite.com/api/product/list?status=active`
    }

    const cacheConfig = {
        key: `product/list?status=active`,
        errorCallback: handleError,
        postSync: {
            callback: handleResponse,
            syncTimeout: 1, //time in milliseconds
            syncInterval: 1000 * 60 * 60 * 3, //time in milliseconds
        },
    }
    let reponse = makeRequest (axiosConfig, cacheConfig)
    handleResponse (response)
}

function makeRequest (axiosConfig, cacheConfig=null) {
    //make object from CachifyJS class
    let cachifyjs = new CachifyJS()
    try {
        //get request only
        let response = await cachifyjs.get (axiosConfig, cacheConfig)
        return response;
    } catch (error) {
        //handle error
    }
}

function handleResponse (response) {
    if (response){
        //handle api response here
    }
    else {
        //do something else
    }
}

function handleError (error) {
    //handle if any error occurs during data refreshing on api call (ex: authentication error)
}
```

## Conclusion
CachifyJS is a simple yet powerful tool that can help you optimize your frontend application's performance 
by reducing the number of API requests. By caching API responses in the browser's local storage,
you can improve your application's response time and make it more responsive to user interactions.
Give it a try in your next project!