var assert = require('chai').assert;

var useapply = 0;
var async = require('../sonicAsync');
async.errout = 0;
async.silent = 0;
sonicSuite(async, "sonicAsync");

var async = require("../sonicAsync.min");
async.noerrout = 1;
async.silent = 0;
sonicSuite(async, "fastsync.min");

function mktrack(valarray, safewf) {
    var atrack = [];
    
    var cnt = 0;
    valarray.forEach(function(val) {
        var rn = Math.random()*3;
        function async_wrapper() {
            var next = arguments[arguments.length-1];
            if( arguments[arguments.length-2] )
                var result = arguments[arguments.length-2];
            setTimeout(function plusone(){
                var nextval = val;
                if( result ) nextval = nextval + result;
                else nextval = nextval + 1;
                next(null, nextval);
                if( safewf && val === 1) {
                    next(null, nextval);
                }
            }, rn);
        }
        if( !useapply ) 
            atrack.push(async_wrapper);
    /*
        else
            atrack.push(async.apply(async_wrapper));
    */
    });
    return atrack;
}

function maptst(val, cb) {
    var rn = Math.random()*3;
    setTimeout(function mapfn() {
        cb(null, val*2);
        if( val===1 )
            cb(null, val*2);
    },rn);
}

function filtertst(val, cb) {
    var rn = Math.random()*3;
    setTimeout(function filterfn() {
        cb(null, val%2);
        if( val===1 )
            cb(null, val%2);
    },rn);
}

var cmp = {
    waterfall: {op: assert.equal, val: 46},
    fastWaterfall: {op: assert.equal, val: 46},
    parallelLimit: {op: assert.deepEqual, val:[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]},
    series: {op: assert.deepEqual, val:[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]},
    parallel: {op: assert.deepEqual, val:[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]},
    mapSeries: {op: assert.deepEqual, val:[ 2,4,6]},
    mapLimit: {op: assert.deepEqual, val:[ 2,4,6]},
    mapParallel: {op: assert.deepEqual, val:[ 2,4,6]},
    map: {op: assert.deepEqual, val:[ 2,4,6]},
    filterSeries: {op: assert.deepEqual, val:[1,3,5,7,9]},
    filterParallel: {op: assert.deepEqual, val:[1,3,5,7,9]},
    filter: {op: assert.deepEqual, val:[1,3,5,7,9]},
    filterLimit: {op: assert.deepEqual, val:[1,3,5,7,9]}
};

function wrap_result_cb(done, typ) {
    return function result_cb(err, data) {
        cmp[typ].op(data, cmp[typ].val);
        done();
    }
}


var ary = [];
for(var i=0;i<10;i++) {
    ary[i] = i;
}
var track1 = mktrack(ary);
useapply = 1;
var track2 = mktrack(ary);

function sonicSuite(async, sonicName){
    describe(sonicName, function(){
        it('runs tasks in parallel', function(done){
            async.parallel(track1,  wrap_result_cb(done, 'parallel'));
        });
        it('runs tasks in fastWaterfall', function(done){
            async.fastWaterfall(track1,  wrap_result_cb(done, 'fastWaterfall'));
        });
        it('runs tasks in waterfall', function(done){
            async.waterfall(track1,  wrap_result_cb(done, 'waterfall'));
        });
        it('runs tasks in parallelLimit', function(done){
            async.parallelLimit(track1, 5, wrap_result_cb(done, 'parallelLimit'));
        });
        it('runs tasks in series', function(done){
            async.series(track1, wrap_result_cb(done, 'series'));
        });
        it('map tasks in series', function(done){
            async.mapSeries([1,2,3], maptst, wrap_result_cb(done, 'mapSeries'));
        });
        it('map tasks in parallel', function(done){
            async.map([1,2,3], maptst, wrap_result_cb(done, 'map'));
        });
        it('map tasks in parallel', function(done){
            async.mapParallel([1,2,3], maptst, wrap_result_cb(done, 'mapParallel'));
        });
        it('map tasks in limited concurrency', function(done){
            async.mapLimit([1,2,3], maptst, 2, wrap_result_cb(done, 'mapLimit'));
        });
        it('filter tasks in series', function(done){
            async.filterSeries([1,2,3,4,5,6,7,8,9], filtertst, wrap_result_cb(done, 'filterSeries'));
        });
        it('filter tasks in parallel(filter)', function(done){
            async.filter([1,2,3,4,5,6,7,8,9], filtertst, wrap_result_cb(done, 'filter'));
        });
        it('filter tasks in parallel', function(done){
            async.filterParallel([1,2,3,4,5,6,7,8,9], filtertst, wrap_result_cb(done, 'filterParallel'));
        });
        it('filter tasks in limited concurrency', function(done){
            async.filterLimit([1,2,3,4,5,6,7,8,9], filtertst, 3, wrap_result_cb(done, 'filterLimit'));
        });
        /*
        it('calls function', function(done){
            var func = function() {
                assert.deepEqual([].slice.call(arguments), [1, 2, 3]);
            };

            async.apply(func, 1, 2, 3)();
            async.apply(func, 1, 2)(3);
            async.apply(func, 1)(2, 3);
            var fn = async.apply(func);
            fn(1, 2, 3);

            function hw(name) { 
                return 'hello ' + name; 
            }
            var val = async.apply(hw, 'world')();
            assert.strictEqual( val, 'hello world');
            done();
        });
        it('runs applied tasks in parallel', function(done){
            async.parallel(track2,  wrap_result_cb(done, 'parallel'));
        });
        */
    });
}

