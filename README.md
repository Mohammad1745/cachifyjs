# CachifyJS

CachifyJS is a lightweight framework-agnostic npm package that helps you cache API responses data in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application built on any technology like: react, vue, angular, you name it.

<p id="installation"></p>

## Installation 

```
npm install cachifyjs
```

<p id="table_of_contents"></p>

## Table of Contents 
- [What's new! (v2.2)](#whats_new)
- [Guides](#guides)
    - [Caching API Response](#caching_api_responses)
        - [Notes](#caching_api_responses_notes)
        - [Configuration](#caching_api_responses_configuration)
        - [Scenarios](#caching_api_responses_scenarios)
    - [Set Cached Data](#set_cached_data)
        - [Notes](#set_cached_data_notes)
        - [Configuration](#set_cached_data_configuration)
    - [Get Cached Data](#get_cached_data)
        - [Notes](#get_cached_data_notes)
    - [Update Cached Data](#update_cached_data)
        - [Notes](#update_cached_data_notes)
        - [Configuration](#update_cached_data_configuration)
    - [Remove Cached Data](#remove_cached_data)
- [Dependencies](#dependencies)
- [Conclusion & Feedback](#conclusion)


<p id="whats_new"></p>

## What's new! (v2.3)

- Wrapper around cached data

  The return from `cachify` or `getCache` functions or the received parameter of `callback` function of either the `postSync` or the `after` property
  is the cached data with a wrapper around it. Thus, it's structure is similar to the axios api response.

  If your cached data is like,
  ```
    const chachedData = {name: 'Ice cream', description: 'Cold'}
  ```
  Then the wrapper is like,
  ```
    const response = {data: chachedData}
  ```
  If no cached data there,
  ```
    const response = {message: "Data not found",nodata:true}
  ```

- `setCache` function

  The `setCache` function is one of the latest additions to the CachifyJS package, and it allows you to set new cached data in your
  frontend application. The data could be api response, any app state, you name it. With this new feature, you can easily set any data in the cache
  without depending on any type of network request or API call.


- `getCache` function

  The `getCache` function is one of the latest additions to the CachifyJS package, and it allows you to get the cached data from your
  frontend application without complex configuration.


<p id="guides"></p>

## Guides 

<p id="caching_api_responses"></p>

### 1. Caching API Response: 

To use CachifyJS, import the `cachify` function into your JavaScript file and pass your API call to it. The `cachify` function
will first check if the API response is already cached in local storage. If it is, it will return the cached data inside a 
wrapper (ex: {data: cachedData}), make the api call, cache the response data and run the callback. If not, it will make
the API call, cache the response data in local storage and return the data.

Here's an example:
```
import {cachify} from "cachifyjs";

async function getProductList () {
    
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
        //let response = await axios(axiosConfig)
        //just replaced the axios() function with cachify()
        
        handleResponse (response)
    } catch (error) {
        handleError (error)
    }
}

//handle api or cache response here
function handleResponse (response) {
    if (response.data) {
        //handle the response data
    }
    else {
        console.log(response)
    }
}

function handleError (error) {
    //handle if any error occurs during data refreshing on api call (ex: authentication error)
}
```

<p id="caching_api_responses_notes"></p>

#### Notes 

- `handleResponse`: The function has been used as `callback` in `postSync` property and also been used to handle the `response` of api call.
- `handleError`: The function has been used as `errorCallback` in `cacheConfig` and also been used to handle the `error` on api call.

<p id="caching_api_responses_configuration"></p>

#### Configuration 

When using CachifyJS, you can configure various options to customize the caching behavior. The `cacheConfig` object passed to the `cachify` function accepts the following properties:

- `key`: (required) A string that uniquely identifies the API endpoint being called. This key is used as the key for caching the response in local storage.
  It's recommended to keep it similar to your api uri.

- `errorCallback`: (required) A callback function that will be called if an error occurs during the API call. This can be used to handle errors such as authentication failures.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated. The default
  value is `7d` or 1 week.

- `encryption` (optional): For sensitive data, encryption can be enabled.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to encrypt and decrypt your data.

- `preSync`: (optional) A boolean that simply enables caching after getting api response and then sending data to frontend.

- `postSync`: (recommended) An object that defines how the cache should be updated after the API response is returned. This is useful when you want to keep the cache up to date with new data periodically.

    - `callback`: (required) A callback function that will be called with the cached data with a wrapper (ex: `{data: cachedData}`) after it has been cached.

    - `syncTimeout`: (optional) The number of milliseconds to wait before syncing the cache with new data. This is useful if you want to avoid syncing the cache too frequently.
      It's a one time call.

    - `syncInterval`: (optional) The number of milliseconds to wait before syncing the cache again. This is useful if you want to periodically update the cache with new data.

<p id="caching_api_responses_scenarios"></p>

#### Scenarios 

1. `Plain`: `CachifyJS` will try to get data from cache. If data found, no api call will be made. Otherwise, it will make the api call, cache the data and return the cached data inside a wrapper.
   It's recommended to use `lifetime` for this case. After the cache being expired, new api call will be made to get fresh data.
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


<p id="set_cached_data"></p>

### 2. Set Cached Data: 

The `setCache` function allows you to set new cached data in your frontend application. The data could be api response, any app state, you name it.
With this new feature, you can easily set any data in the cache without depending on any type of network request or API call.
To set cached data, import the `setCache` function into your JavaScript file and pass a `config` and `data` to the function. 
The function will  set new data in cache.

Here's an example:
```
import {setCache} from "cachifyjs";

async function setWishListCache (data) {
    // configuration for updating
    const config = {
        key: `wishlist`,//Be sure to not use any key that has been used for any other cache
        lifetime: '1h',
        encryption: {
            secretKey: 'my-secret-key'
        },
        after: {
           callback: handleResponse, 
        }
    }
        
    try {    
        await setCache(config, data);
    } catch (error) {
        console.log ("Set Cache Error:", error)
    }
}

function handleResponse (response) {
    //handle response after setting cached data
}
```

<p id="set_cached_data_configuration"></p>

#### Configuration 

When setting new data, the `config` object passed to the `setCache` function accepts the following properties:

- `key`: (required) A string that uniquely identifies the cached data. This key is used as the key for caching the response in local storage.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated. The default
  value is `7d` or 1 week.

- `encryption` (optional): For sensitive data, encryption can be enabled.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to encrypt and decrypt your data.

- `after`: (recommended) An object that defines the events after the data has been set. This is useful when you want create an effect after the setting up cached data.

    - `callback`: (required) A callback function that will be called with the cached data with a wrapper (ex: `{data: cachedData}`) after it has been cached.


<p id="get_cached_data"></p>

### 3. Get Cached Data:

The `getCache` function allows you to get the cached data from your frontend application without complex configuration or subsequent api call.

Here's an example:
```
import {getCache} from "cachifyjs";

async function getProductListCache () {
    const config = {
        key: `wishlist`,    //it must be the same as the cached key
        encryption: {,      // if the cached data is ecrypted, the same encryption key is required.
            secretKey: 'my-secret-key'
        },
    }

    try {    
        const response = await getCache(config);
        handleResponse(response)
    } catch (error) {
        console.log ("Get Cache Error:", error)
    }
}

//handle cache response here
function handleResponse (response) {
    if (response.data) {
        //handle the response data
    }
    else {
        console.log(response)
    }
}
```

<p id="get_cached_data_notes"></p>

#### Notes

- `response`: `response` is a wrapper around the cached data. Ex: `{data: cachedData}` or `{message: "Data not found",nodata:true}`.
- `handleResponse`: The function has been used as `callback` in `after` property.
-
<p id="get_cached_data_notes"></p>

#### Notes

- `handleResponse`: The function has been used to handle the api response previously. This callback will be called after the data has been updated.

<p id="get_cached_data_configuration"></p>

#### Configuration

When getting data, the `config` object passed to the `getCache` function accepts the following properties:

- `key`: (required) This `key` identifies the cached data. It's mandatory to keep it same to the key of the cached data.

- `encryption` (optional): If the cached data is encrypted then it's mandatory.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to decrypt your data.


<p id="update_cached_data"></p>

### 4. Update Cached Data: 

To update cached data, import the `updateCache` function into your JavaScript file and pass a `config` and `data` to the 
function. The function will  update the cached data in frontend without making api call.

Here's an example:
```
import {updateCache} from "cachifyjs";

async function updateProductListCache (updatedData) {
    // configuration for updating
    const config = {
        key: `product/list?status=active`,//it must be the same as the cached key
        lifetime: '1h',
        encryption: {
            secretKey: 'my-secret-key'//it must be the same as the key used to cache the data
        },
        after: {
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
<p id="update_cached_data_notes"></p>

#### Notes 

- `handleResponse`: The function has been used to handle the api response previously. This callback will be called after the data has been updated.

<p id="update_cached_data_configuration"></p>

#### Configuration 

When updating data, the `config` object passed to the `updateCache` function accepts the following properties:

- `key`: (required) This `key` identifies the cached data and update it. It's mandatory to keep it similar to the key of the data needs to be updated.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated.

- `encryption` (optional): For sensitive data, encryption can be enabled. If the cached data is encrypted then it's mandatory.

    - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be
      used to encrypt and decrypt your data.

- `after`: (recommended) An object that defines the events after the data has been updated. This is useful when you want create an effect after the update.

    - `callback`: (required) A callback function that will be called after the data has been updated. It should be the same method that was previously passed in
       cacheConfig during initial caching.


<p id="remove_cached_data"></p>

### 5. Remove Cached Data: 

To remove cached data, import the `removeCache` function into your JavaScript file and pass a `config` with the `key` property to the function.
The function will remove the cached data.

Here's an example:
```
import {removeCache} from "cachifyjs";

async function removeProductListCache () {
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

<p id="dependencies"></p>

## Dependencies 

[Axios](https://www.npmjs.com/package/axios), [Crypto-JS](https://www.npmjs.com/package/crypto-js)

<p id="conclusion"></p>

## Conclusion 

CachifyJS is a simple yet powerful tool that can help you optimize your frontend application's performance
by reducing the number of API requests. By caching API responses in the browser's local storage,
you can improve your application's response time and make it more responsive to user interactions.
Give it a try in your next project!


<a target="_blank" href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=mdali2016.227@gmail.com&su=Feedback about cachifyjs">Give Us Your Feedback</a>