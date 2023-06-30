## Version 2.3.9 - 2023-06-30

- The skip api call feature has been updated to check previous api call timestamp and determine the skip functionality.

## Version 2.3.8 - 2023-06-28

- Skip Api Call: The `skipApiCallFor` property inside `postSync` property of `cacheConfig` for function `cachify()` allows 
  us to skip api calls. If any api call is made too frequently and we want to reduce the call, we may use this configuration.


## Version 2.3.7 - 2023-06-19

- Fixed the issue: Not calling api if data is cached even if `postsync` is enabled.