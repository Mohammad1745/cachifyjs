# CachifyJS

CachifyJS is a lightweight framework-agnostic npm package that helps you cache API responses in the browser's local storage.
By caching API responses, you can reduce the number of network requests and improve the
performance of your frontend application built on any technology like: react, vue, angular, you name it.

## Installation

```
npm install cachifyjs
```

## What's new! (v2)

- `encryption`

  CachifyJS now supports data encryption to help keep your cached data secure. To use encryption, you'll need to provide
    a secret key to the cache configuration. This secret key will be used to encrypt and decrypt your data.


- Default function `cachify(axiosConfig, cacheConfig)`

    Pain reduction! The previous requirement of creating object from class is now history for us. Simply import the function,
    call it and boom, you get the data.


## Guides
To use CachifyJS, you need to import it into your JavaScript file and pass your API call to the `cachify` function.
The `cachify` function will first check if the API response is already cached in local storage. If it is, it will
return the cached data, make the api call, cache the response and run the callback. If not, it will make
the API call, cache the response in local storage and return the data.

Here's an example:
```
import cachify from "cachifyjs";

function getProductList () {
    
    try {    
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
Notes:
1. `handleResponse`: The function has been used as `callback` in `postSync` and also been used to handle the `response` of api call.
2. `handleError`: The function has been used as `errorCallback` in `cacheConfig` and also been used to handle the `error` on api call.

## Configuration
When using CachifyJS, you can configure various options to customize the caching behavior. The `cacheConfig` object passed to the `cachify` function accepts the following properties:

- `key`: (required) A string that uniquely identifies the API endpoint being called. This key is used as the key for caching the response in local storage. 
    It's recommended to keep it similar to your api uri.

- `errorCallback`: (required) A callback function that will be called if an error occurs during the API call. This can be used to handle errors such as authentication failures.

- `lifetime` (optional): The amount of time in milliseconds that the cached response should be considered valid. After this time has elapsed, the cache will be invalidated.

- `encryption` (optional): For sensitive data, encryption can be enabled. **Caution: Note that enabling encryption can increase the CPU power required to read and write cached data.
     Be mindful of this when using cachifyjs with encryption enabled, especially in resource-constrained environments.**

  - `secretKey` (required): To use encryption, you'll need to provide a secret key to the encryption configuration. This secret key will be 
       used to encrypt and decrypt your data.

- `preSync`: (optional) A boolean that simply enables caching after getting api response and then sending data to frontend.

- `postSync`: (recommended) An object that defines how the cache should be updated after the API response is returned. This is useful when you want to keep the cache up to date with new data periodically.

    - `callback`: (required) A callback function that will be called with the API response after it has been cached.

    - `syncTimeout`: (optional) The number of milliseconds to wait before syncing the cache with new data. This is useful if you want to avoid syncing the cache too frequently.
      It's a one time call.

    - `syncInterval`: (optional) The number of milliseconds to wait before syncing the cache again. This is useful if you want to periodically update the cache with new data.

## Scenarios

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


## Conclusion
CachifyJS is a simple yet powerful tool that can help you optimize your frontend application's performance
by reducing the number of API requests. By caching API responses in the browser's local storage,
you can improve your application's response time and make it more responsive to user interactions.
Give it a try in your next project!


<a target="_blank" href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=mdali2016.227@gmail.com&su=Feedback about cachifyjs">Give Us Your Feedback</a>