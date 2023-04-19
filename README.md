# CachifyJS

CachifyJS is a lightweight framework-agnostic npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application.

## Installation

```
npm install cachifyjs
```

## What's new! (v1.2)
- `lifetime`

  This is an optional property that specifies the amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated, and
  subsequent requests will trigger a new network call to retrieve the latest data.

  The `lifetime` property is useful in situations where the data being cached may become stale or outdated after
  a certain amount of time. By setting an appropriate lifetime, you can ensure that the cached data is still relevant and useful to your application.

  It's important to note that setting a longer lifetime value can result in stale data being displayed to the user, while setting a shorter lifetime value can result in more frequent network calls
  and slower performance. It's recommended to experiment with different values to find the appropriate lifetime that balances between freshness and performance.


## How To Use
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
        lifetime: 1000 * 60 * 60, //time in milliseconds
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

- `errorCallback`: (required) A callback function that will be called if an error occurs during the API call. This can be used to handle errors such as authentication failures.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated.

- `preSync`: (optional) A boolean that simply enables caching after getting api response and then sending data to frontend.

- `postSync`: (recommended) An object that defines how the cache should be updated after the API response is returned. This is useful when you want to keep the cache up to date with new data periodically.

  - `callback`: (required) A callback function that will be called with the API response after it has been cached.

  - `syncTimeout`: (optional) The number of milliseconds to wait before syncing the cache with new data. This is useful if you want to avoid syncing the cache too frequently.
                    It's a one time call.

  - `syncInterval`: (optional) The number of milliseconds to wait before syncing the cache again. This is useful if you want to periodically update the cache with new data.

## Key Points
1. A single cachifyjs object can handle single api call at a time.
2. If multiple api call need to be cached at the same time, create multiple objects.
3. For multiple api call,
```
import CachifyJS from "cachifyjs";
import axios from "axios";

function getData () {
    const axiosConfig = {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        url: `https://www.yoursite.com/api/product/list?status=active`
    }

    const cacheConfig = {
        key: `product/list?status=active`,
        errorCallback: handleError,
        lifetime: 1000 * 60 * 60, //time in milliseconds
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
        let response = cacheConfig ? 
            await cachifyjs.get (axiosConfig, cacheConfig)
            : await axios(axiosConfig)
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

## Scenarios

1. `Plain`: `CachifyJS` will try to get data from cache. If data found, no api call will be made. Otherwise,
    it will make the api call and return the response. The `cacheConfig` should look like,
    ```
    const cacheConfig = {
       key: `product/list?status=active`,
       errorCallback: handleError
    }
    ```
2. `preSync`: `CachifyJS` will make the api call, cache the response and return the response. 
    The `cacheConfig` should look like,
    ```
    const cacheConfig = {
       key: `product/list?status=active`,
       errorCallback: handleError,
       preSync: true,
    }
    ```
3. `postSync`: `CachifyJS` will try to get data from cache. If data not found, an immediate api call will be made. Otherwise,
it will make the api call and return the response according to the `syncTimeout` or `syncInterval` value. Data will be cached 
in both scenario.
    ```
    const cacheConfig = {
       key: `product/list?status=active`,
       errorCallback: handleError,
        lifetime: 1000 * 60 * 60, //time in milliseconds
       postSync: {
           callback: handleResponse,
           syncTimeout: 1, //time in milliseconds
           syncInterval: 1000 * 60 * 60 * 3, //time in milliseconds
       },
    }
    ```
   Different configurations:
   1. `syncTimeout`: The time delay after that api call will be made. It's a one time call.
   2. `syncInterval`: The time interval for the api call. It's a repetitive process. It works in background.


## Conclusion
CachifyJS is a simple yet powerful tool that can help you optimize your frontend application's performance 
by reducing the number of API requests. By caching API responses in the browser's local storage,
you can improve your application's response time and make it more responsive to user interactions.
Give it a try in your next project!


<a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=mdali2016.227@gmail.com&su=Feedback about cachifyjs" target="_blank">Give Us Your Feedback</a>