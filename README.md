# Sonic-Async

Sonic-Async is an async flow control javascript library with excellent [`performance`](#performance) characteristics.  
It consistently comes out on top on benchmarking runs.  For the API calls that are currently available, 
they are compatible with Async except [`waterfall`](#waterfall).


Sonic-Async can be installed with npm.

    $npm install sonic-async

You can also use it in a browser.

```html
<script type="text/javascript" src="sonicAsync.js"></script>
```

## API Sumary

Listed below are currently available APIs with a brief description of what it is for each.  
Click the name of each API for details.

### Control Flow

* [`parallel`](#parallel) - runs all the tasks in parallel.
* [`parallelLimit`](#parallelLimit) - runs tasks in parallel with limited concurrency.
* [`series`](#series) - runs tasks sequencially.
* [`waterfall`](#waterfall) - runs tasks sequencially and passes the result from one to the next.
* [`fastWaterfall`](#fastWaterfall) - runs tasks sequencially and passes the result from one to the next.

### Collections

* [`map`](#map) - maps the values in a collection in parallel and returns a new array that contains the mapped values.
* [`mapParallel`](#mapParallel) - same as [`map`](#map).
* [`mapLimit`](#mapLimit) - maps the values in a collection in parallel with limited concurrency and returns a new array that contains the mapped values.
* [`mapSeries`](#mapSeries) - maps the values in a collection sequencially and returns a new array that contains the mapped values.
* [`filter`](#filter) - filters the values in a collection in parallel and returns a new array that contains the filtered values.
* [`filterParallel`](#filterParallel) - same as [`filter`](#filter).
* [`filterLimit`](#filterLimit) - filters the values in a collection in parallel with limited concurrency and returns a new array that contains the filtered values.
* [`filterSeries`](#filterSeries) - filters the values in a collection sequencially and returns a new array that contains the filtered values.


## Options

This library lets you decide how to handle the multiple task callback invocations.
By default, it will print a message to the console.
* E.g.,

  `callback called already; err= null ; data= 2`  

Here, the err and data are the values from 2 arguments of the task callback.

* `sonicAsync.silent` - if set to false, a message similar to the example above is printed to the console.  The default value is false.
* `sonicAsync.trace` - if set to true, the stack trace is printed to the console and no error is thrown.  The default value is false.
* `sonicAsync.errout` - if set to true and `sonicAsync.trace` is false,  an error is thrown.  The default value is false.

* Usage:
```js
  sonicAsync = require('sonicAsync');  
  sonicAsync.silent = true;  // no message will be printed
```

## API Details

### Control Flow

<a name="parallel"></a>
#### parallel(tasks, [done_callback])

Runs all the `tasks` in parallel as if all of them run at the same time. If any one of the tasks passes an error to its callback, 
the `done_callback` is immediately called with the value of the error.  Once all the `tasks` are done, 
the results are passed to the `done_callback` as an array in the same order of `tasks`.  

__Arguments__

* `tasks` - an array of functions to be executed. Each function is passed
  a `callback(err, result)` which it must call on completion with an error `err`
  (which can be `null`) and an optional `result` value.
* `done_callback(err, results)` - an optional callback to be executed once all the functions
  have completed successfully or an error was return by one of the tasks.  The results argument 
is an array that contains the values produced by all the tasks with the order aligned with `tasks`.

__Example__

```js
sonicAsync.parallel([
    function(callback){
        setTimeout(function(){
            callback(null, 2);
        }, 2);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 3);
        }, 3);
    }
],
// optional done callback
function(err, results){
    console.log(results); //  [2, 3] 
});

```


---------------------------------------


<a name="parallelLimit"></a>
### parallelLimit(tasks, limit, [done_callback])

The number of `tasks` that runs in parallel are capped at `limit`.  A task will be spawn up right away once a task 
is completed one after another until all the tasks are spawn up.  If any one of the tasks passes an error to 
its callback, the `done_callback` is immediately called with the value of the error.  Once all the `tasks` are done, 
the results are passed to the `done_callback` as an array in the same order of `tasks`.  

__Arguments__

* `tasks` - an array of functions to be run. Each function is passed
  a `callback(err, result)` which it must call on completion with an error `err`
  (which can be `null`) and an optional `result` value.
* `limit` - the concurrency of running tasks is capped at `limit`.
* `done_callback(err, results)` - an optional callback to be run once all the functions
  have completed successfully or when an error was return by any one of the functions. The results argument 
is an array that contains the values produced by all the tasks with the order aligned with `tasks`.

__Example__

```js
sonicAsync.parallelLimit([
    function(callback){
        setTimeout(function(){
            callback(null, 1);
        }, 2);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 2);
        }, 9);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 3);
        }, 12);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 4);
        }, 20);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 5);
        }, 5);
    }
],
//concurrency limit
2,
// optional done callback
function(err, results){
    console.log(results); //  [1, 2, 3, 4, 5] 
});

```


---------------------------------------


<a name="series"></a>
### series(tasks, [done_callback])

Runs the `tasks` sequentially, one after another until all the tasks have been
completed. If any one of the tasks in the series passes an error to its
callback, `done_callback` is immediately called with the value of the error.
Otherwise, `done_callback` receives the results as an array when all the `tasks` have been completed.

__Arguments__

* `tasks` - an array containing functions to be executed, each function is passed
  a `callback(err, result)` it must call on completion with an error `err` (which can be `null`) and an optional `result` value.
* `done_callback(err, results)` - an optional callback to run once all the functions have been 
completed successfully or when an error was return by any one of the functions. The results 
argument is an array that contains the values produced by all the tasks with the order aligned with `tasks`.

__Example__

```js
sonicAsync.series([
    function(callback){
        // do something ...
        callback(null, 1);
    },
    function(callback){
        // do some more things...
        callback(null, 2);
    }
],
// optional done callback
function(err, results){
    console.log(results); // [1, 2]
});

```

---------------------------------------


<a name="waterfall"></a>
### waterfall(tasks, [done_callback])

Runs the `tasks` sequentially, each passing its result to the next.  However, if any one of the `tasks` passes 
an error to its own callback, the next task is not executed, and the `done_callback` is immediately called with the error.

__Arguments__

* `tasks` - an array of functions to be executed, each function is passed a
  `callback(err, result)` it must call on completion. The first
  argument is an error (which can be `null`) and the 2nd argument, resutl, is passed on to the next task.
* `done_callback(err, result)` - an optional callback to be run once all the functions have completed. 
The result from the last task will be passed to `done_callback` as the 2nd and last argument.



__Example__

```js
soniAsync.waterfall([
    // the wrapping function always has the signature of function(data, callback)
    function(data, callback) {
        // for 1st task, data is usually null, but value can be passed in
        callback(null, 1);
    },
    function(data, callback) {
      // data now equals 1
        callback(null, [2,5]);
    },
    function(data, callback) {
      // data now equals [2,5]
        callback(null, 3);
    }
], function (err, result) {  // the done_callback
    console.log(result ) //  3
});
```

---------------------------------------


<a name="fastWaterfall"></a>
### fastWaterfall(tasks, [done_callback])


This API is basically the same as waterfall with the exception that it is not callback safe.  
If the task callback is invoked more than once, it may cause one or more of the tasks to be skipped.  
Since it does not guard against multiple task callbacks, it runs faster than the regular waterfall API.


---------------------------------------


<a name="map"></a>
### map(data, mapfunc, [done_callback])

Produces a new array by mapping each value in the `data` array through
the `mapfunc` function. The `mapfunc` is called with an item from `data` and a
callback for when it has finished processing.  Each of these callbacks takes 2 arguments:
an `error`, and the transformed item from `data`. If `mapfunc` passes an error to its
callback, the `done_callback` is immediately called with the error.
Since this API applies the `mapfunc` to each item in parallel,
the `mapfunc` functions can complete in any order.
However, the results array will be in the same order as the original `data` array.

__Arguments__

* `data` - an array to iterate over.
* `mapfunc(item, callback)` - a function to apply to each item in `data`.
  The `mapfunc` is passed a `callback(err, transformed_item)` which must be called once
  it has completed with an error (which can be `null`) and a transformed item.
* `done_callback(err, results)` - an optional callback which is called when all `mapfunc`
  functions have finished, or an error occurs.  Results is an array of the
  transformed items from the `data` array.

__Example__

```js
sonicAsync.map([1,2,3], 
    function mapfunc(val, cb) {
        setTimeout(function() {
                cb(null, val*2);
            }, 5
        );
    }, 
    function(err, results){
        console.log(results); //  [2,4,6]
});
```


---------------------------------------


<a name="mapLimit"></a>
### mapLimit(data, mapfunc, limit, [done_callback])

This is the same as `map` except that the concurrency is capped at `limit`.
When a `mapfunc` is done mapping an item, another `mapfunc` is spawn up to map the
next item in the `data` array.

__Arguments__

* `data` - an array to iterate over.
* `limit` - the concurrency of running `mapfunc`s is capped at `limit`.
* `mapfunc(item, callback)` - a function to apply to each item in `data`.
  The `mapfunc` is passed a `callback(err, transformed_item)` which must be called once
  it has completed with an error (which can be `null`) and a transformed item.
* `done_callback(err, results)` - an optional callback which is called when all `mapfunc`
  functions have finished, or an error occurs.  Results is an array of the
  transformed items from the `data` array.

__Example__

```js
sonicAsync.map([1,2,3], 
    // maximum mapfuncs running is 2
    2,
    function mapfunc(val, cb) {
        setTimeout(function() {
                cb(null, val*2);
            }, 5
        );
    }, 
    function(err, results){
        console.log(results); //  [2,4,6]
});
```


---------------------------------------


<a name="mapParallel"></a>
### mapParallel(data, mapfunc, [done_callback])

This is exactly the same as `map`.

---------------------------------------

<a name="mapSeries"></a>
### mapSeries(data, mapfunc, [done_callback])

This is a special case of mapLimit with limit set to 1.

---------------------------------------


<a name="filter"></a>
### filter(data, filterfunc, [done_callback])

Produces a new array by filtering each value in the `data` array through
the `filterfunc` function. The `filterfunc` is called with an item from `data` and a
callback for when it has finished processing.  Each of these callbacks takes 2 arguments:
an `error`, and a boolean. If `filterfunc` passes an error to its
callback, the `done_callback` is immediately called with the error.
Since this API applies the `filterfunc` to each item in parallel,
the `filterfunc` functions can complete in any order.
However, the order of the items in the results array is aligned with the original `data` array.  
The results array contains the items if any where the filterfunc callback's 2nd argument is set to true.  

__Arguments__

* `data` - an array to iterate over.
* `filterfunc(item, callback)` - a function to apply to each item in `data`.
  The `filterfunc` is passed a `callback(err, boolean)` which must be called once
  it has completed with an error (which can be `null`) and a true or false value.
* `done_callback(err, results)` - an optional callback which is called when all `filterfunc`
  functions have finished, or an error occurs.  Results is an array of the
  filtered items from the `data` array.

__Example__

```js
sonicAsync.filter([1,2,3], 
    function filterfunc(val, cb) {
        setTimeout(function() {
                cb(null, val%2);
            }, 5
        );
    }, 
    function(err, results){
        console.log(results); //  [1,3]
});
```


---------------------------------------


<a name="filterLimit"></a>
### filterLimit(data, filterfunc, limit, [done_callback])

This API is the same as filter except that the concurrency is capped at `limit`.
When a `filterfunc` is done filtering an item, another `filterfunc` is spawn up to 
filter the next item in the `data` array.

__Arguments__

* `data` - an array to iterate over.
* `filterfunc(item, callback)` - a function to apply to each item in `data`.
  The `filterfunc` is passed a `callback(err, boolean)` which must be called 
  once it has completed with an error (which can be `null`) and a true or false value.
* `limit` - the concurrency of running `filterfunc`s is capped at `limit`.
* `done_callback(err, results)` - an optional callback which is called when all 
  `filterfunc` functions have finished, or an error occurs.  Results is an 
  array of the filtered items from the `data` array.

__Example__

```js
sonicAsync.filter([1,2,3], 
    2,
    function filterfunc(val, cb) {
        setTimeout(function() {
                cb(null, val%2);
            }, 5
        );
    }, 
    function(err, results){
        console.log(results); //  [1,3]
});
```


---------------------------------------


<a name="filterParallel"></a>
### filterParallel(data, filterfunc, [done_callback])

This is exactly the same as `filter`.

---------------------------------------

<a name="filterSeries"></a>
### filterSeries(data, filterfunc, [done_callback])

This is a special case of filterLimit with limit set to 1.

---------------------------------------

<a name="performance"></a>
## Benchmarks

The code for benchmarking is a copy from bluebird's benchmark.
A correction has been made to remove the bias against async style libraries
in parallel bechmarking.  See bluebird issue #985 for details.


### DoxBee sequential

Run: npm run benchw

results for 10000 parallel executions, 1 ms per I/O op

|file|                                                time(ms)|  memory(MB)|
| ------------------------- | -------------:| -------------:|
|callbacks-baseline.js|                                    184|       43.60|
|callbacks-peterluhub-sonic-async-fast-waterfall.js|       211|       46.54|
|callbacks-peterluhub-sonic-async-waterfall.js|            228|       46.90|
|callbacks-suguru03-neo-async-waterfall.js|                236|       46.41|
|promises-bluebird-generator.js|                           248|       33.43|
|promises-bluebird.js|                                     330|       46.21|
|promises-then-promise.js|                                 396|       56.32|
|promises-cujojs-when.js|                                  432|       61.80|
|promises-tildeio-rsvp.js|                                 517|       94.55|
|promises-lvivski-davy.js|                                 623|      110.51|
|callbacks-caolan-async-waterfall.js|                      660|      102.25|
|promises-dfilatov-vow.js|                                 662|      134.60|
|promises-calvinmetcalf-lie.js|                            742|      149.23|
|promises-ecmascript6-native.js|                           966|      173.67|
|promises-obvious-kew.js|                                 1188|       92.96|
|promises-medikoo-deferred.js|                            2086|      188.91|
|promises-kriskowal-q.js|                                 7623|      685.28|
|observables-caolan-highland.js|                          7926|      582.04|


### Parallel

Run: npm run benchp

results for 10000 parallel executions, 1 ms per I/O op

|file|                                          time(ms)|  memory(MB)|
| ------------------------- | -------------:| -------------:|
|callbacks-baseline.js|                              279|       63.21|
|callbacks-peterluhub-sonic-async-parallel.js|       323|       73.52|
|callbacks-suguru03-neo-async-parallel.js|           339|       79.15|
|promises-bluebird.js|                               458|       99.23|
|promises-bluebird-generator.js|                     509|       98.96|
|callbacks-caolan-async-parallel.js|                 667|      139.51|
|promises-cujojs-when.js|                            897|      161.46|
|promises-lvivski-davy.js|                          1437|      269.44|
|promises-then-promise.js|                          1616|      304.30|
|promises-calvinmetcalf-lie.js|                     1725|      351.81|
|promises-tildeio-rsvp.js|                          1796|      368.14|
|promises-ecmascript6-native.js|                    2627|      503.57|
|promises-dfilatov-vow.js|                          2660|      517.37|
|promises-medikoo-deferred.js|                      4277|      419.20|
|promises-obvious-kew.js|                           5936|      823.56|



<br\>
<br\>
<br\>

 Platform info
 Linux 3.10.0-229.20.1.el7.x86_64 x64
 Node.JS 5.0.0
 V8 4.6.85.28
 Intel(R) Core(TM) i3-4150 CPU @ 3.50GHz × 1

