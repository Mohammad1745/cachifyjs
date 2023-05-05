# CachifyJS

CachifyJS is a lightweight framework-agnostic npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application built on any technology like: react, vue, angular, you name it.

## Installation <p id="installation"></p>

```
npm install cachifyjs
```

## Table of Contents <p id="table_of_contents"></p>
- [What's new! (v2.2)](#whats_new)
- [Guides](#guides)
    - [Caching API Response](#caching_api_responses)
        - [Notes](#caching_api_responses_notes)
        - [Configuration](#caching_api_responses_configuration)
        - [Scenarios](#caching_api_responses_scenarios)
    - [Update Cached Data](#update_cached_data)
        - [Notes](#update_cached_data_notes)
        - [Configuration](#update_cached_data_configuration)
    - [Remove Cached Data](#remove_cached_data)
- [Dependencies](#dependencies)
- [Conclusion & Feedback](#conclusion)


## What's new! (v2.2) <p id="whats_new"></p>

- `updateCache` function

  The `updateCache` function is one of the latest additions to the CachifyJS package, and it allows you to update the cached data in your
  frontend application. With this new feature, you can easily modify the existing data in the cache without making a new network request to the API.


- `removeCache` function

  The `removeCache` function is one of the latest additions to the CachifyJS package, and it allows you to remove the cached data from your
  frontend application without waiting for the data expiration.



## Guides <p id="guides"></p>

### 1. Caching API Response: <p id="caching_api_responses"></p>

To use CachifyJS, import the `cachify` function into your JavaScript file and pass your API call to it.
The `cachify` function will first check if the API response is already cached in local storage. If it is, it will
return the cached data, make the api call, cache the response and run the callback. If not, it will make
the API call, cache the response in local storage and return the data.

Here's an example:
```
import {cachify} from "cachifyjs";

function getProductList () {
    
    // configuration for api call
    const axiosConfig = {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        url: `https://www.yoursite.com/api/product/list?status=active`
    }

    // configuration for caching
    const cacheConfig = {
        key: `product/list?status=active`,//your own choice, recommended to keep it similar to your api uri
        errorCallback: handleError,
        lifetime: '1h',
        encryption: {
            secretKey: 'my-secret-key'
        },
        postSync: {
            callback: handleResponse,
            syncTimeout: 1, //default (ms)
            syncInterval: '3h', //with time specifier
        },
    }
        
    try {    
        //GET request only
        let response = await cachify(axiosConfig, cacheConfig)
        
        handleResponse (response)
    } catch (error) {
        handleError (error)
    }
}

function handleResponse (response) {
    //handle api response here
}

function handleError (error) {
    //handle if any error occurs during data refreshing on api call (ex: authentication error)
}
```
#### Notes <p id="caching_api_responses_notes"></p>

- `handleResponse`: The function has been used as `callback` in `postSync` and also been used to handle the `response` of api call.
- `handleError`: The function has been used as `errorCallback` in `cacheConfig` and also been used to handle the `error` on api call.

#### Configuration <p id="caching_api_responses_configuration"></p>

When using CachifyJS, you can configure various options to customize the caching behavior. The `cacheConfig` object passed to the `cachify` function accepts the following properties:

- `key`: (required) A string that uniquely identifies the API endpoint being called. This key is used as the key for caching the response in local storage.
  It's recommended to keep it similar to your api uri.

- `errorCallback`: (required) A callback function that will be called if an error occurs during the API call. This can be used to handle errors such as authentication failures.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated.

- `encryption` (optional): For sensitive data, encryption can be enabled.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to encrypt and decrypt your data.

- `preSync`: (optional) A boolean that simply enables caching after getting api response and then sending data to frontend.

- `postSync`: (recommended) An object that defines how the cache should be updated after the API response is returned. This is useful when you want to keep the cache up to date with new data periodically.

    - `callback`: (required) A callback function that will be called with the API response after it has been cached.

    - `syncTimeout`: (optional) The number of milliseconds to wait before syncing the cache with new data. This is useful if you want to avoid syncing the cache too frequently.
      It's a one time call.

    - `syncInterval`: (optional) The number of milliseconds to wait before syncing the cache again. This is useful if you want to periodically update the cache with new data.

#### Scenarios <p id="caching_api_responses_scenarios"></p>

1. `Plain`: `CachifyJS` will try to get data from cache. If data found, no api call will be made. Otherwise,
   it will make the api call and return the response. It's recommended to use `lifetime` for this case. After the cache being expired, new api call will be made to get fresh data.
   The `cacheConfig` should look like,
    ```
    const cacheConfig = {
        key: `product/list?status=active`,
        errorCallback: handleError,
        lifetime: '30m',
        encryption: {
            secretKey: 'my-secret-key'
        }
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
3. `postSync`: `CachifyJS` will try to get data from cache. If data not found, an immediate api call will be made. Otherwise, if  `syncTimeout` is present in
   the config a single api call will be made according to the value.

   If `syncInterval` is present in the config, `cachifyjs` will make api call according to the `syncInterval` value and return the response.

   Data will be cached in both scenarios.
    ```
    const cacheConfig = {
        key: `product/list?status=active`,
        errorCallback: handleError,
        lifetime: '1h',
        postSync: {
           callback: handleResponse,
           syncTimeout: 1,//default (ms)
           syncInterval: '3h',
        },
    }
    ```
   Notes:
    1. `syncTimeout`: The time delay after that api call will be made. It's a one time call.
    2. `syncInterval`: The time interval for the api call. It's a repetitive process. It works in background.


### 2. Update Cached Data: <p id="update_cached_data"></p>

To update cached data, import the `updateCache` function into your JavaScript file and pass a `config` and `data` to the 
function. The function will  update the cached data in frontend without making api call.

Here's an example:
```
import {updateCache} from "cachifyjs";

function updateProductListCache (updatedData) {
    // configuration for updating
    const config = {
        key: `product/list?status=active`,//it must be the same as the cached key
        lifetime: '1h',
        encryption: {
            secretKey: 'my-secret-key'//it must be the same as the key used to cache the data
        },
        afterUpdate: {
           callback: handleResponse, //the same callback previously use in cacheConfig
        }
    }
        
    try {    
        await updateCache(config, updatedData);
    } catch (error) {
        console.log ("Cache Update Error:", error)
    }
}

//the same function previously used to handle the api response
function handleResponse (response) {
    //handle api response here
}
```
#### Notes <p id="update_cached_data_notes"></p>

- `handleResponse`: The function has been used to handle the api response previously. This callback will be called after the data has been updated.

#### Configuration <p id="update_cached_data_configuration"></p>

When updating data, the `config` object passed to the `updateCache` function accepts the following properties:

- `key`: (required) This `key` identifies the cached data and update it. It's mandatory to keep it similar to the key of the data needs to be updated.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated.

- `encryption` (optional): For sensitive data, encryption can be enabled. If the cached data is encrypted then it mandatory.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to encrypt and decrypt your data.

- `afterUpdate`: (recommended) An object that defines the events after the data has been updated. This is useful when you want create an effect after the update.

    - `callback`: (required) A callback function that will be called after the data has been updated. It should be the same method that was previously passed in
       cacheConfig during initial caching.


### 3. Remove Cached Data: <p id="remove_cached_data"></p>

To remove cached data, import the `removeCache` function into your JavaScript file and pass a `config` with the `key` property to the function.
The function will remove the cached data.

Here's an example:
```
import {removeCache} from "cachifyjs";

function removeProductListCache () {
    const config = {
        key: `product/list?status=active`,//it must be the same as the cached key
    }

    try {    
        await removeCache(config);
    } catch (error) {
        console.log ("Cache Removal Error:", error)
    }
}
```

## Dependencies <p id="dependencies"></p>

[Axios](https://www.npmjs.com/package/axios), [Crypto-JS](https://www.npmjs.com/package/crypto-js)

## Conclusion <p id="conclusion"></p>

CachifyJS is a simple yet powerful tool that can help you optimize your frontend application's performance
by reducing the number of API requests. By caching API responses in the browser's local storage,
you can improve your application's response time and make it more responsive to user interactions.
Give it a try in your next project!


<a target="_blank" href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=mdali2016.227@gmail.com&su=Feedback about cachifyjs">Give Us Your Feedback</a>