(function(obj) {
"use strict";
obj.fastWaterfall = function(fns, cb) {
    cb = cb || noopfn;
    var seqNum = 0;
    function runnext(err, data) {
        seqNum += 1;
        var  fn = fns[seqNum];
        if( !err ) { 
            if( fn ) {
                fn(data, runnext);
            } else {
                cb(err, data);
            }
        } else {
            cb(err);
        }
    }

    fns[0](null, runnext);
};

obj.waterfall = function(fns, cb) {
    cb = cb || noopfn;
    var next = function(idx) {
        return function runnext(err, data) {
            var i = idx;
            if( !i ) {
                called_already(err, data);
                return;
            }
            var  fn = fns[i];
            if( !err ) { 
                if( fn ) {
                    fn(data, next(i+1));
                    idx = null;
                } else {
                    cb(err, data);
                }
            } else {
                cb(err);
            }
        };
    };

    fns[0](null, next(1));
};

obj.series = function(tasks, cb) {
    obj.parallelLimit(tasks, 1, cb);
};

obj.filterSeries = function(data, filterfunc, cb) {
    cb = cb || noopfn;
    var len = data.length;
    var results = [];
    var truecnt = 0;

    function runeach(idx) {
        var idxcalled;
        function runnext(err, counted) {
            if( !idxcalled ) {
                idxcalled = 1;
            } else {
                called_already(err, counted);
                return;
            }
            if( !err ) { 
                if( counted ) {
                    results[truecnt] = data[idx];
                    truecnt += 1;
                }
                idx += 1;
                if( idx<len ) {
                    runeach(idx);
                } else {
                    cb(err, results);
                }
            } else {
                cb(err, results);
            }
        }
        filterfunc(data[idx], runnext);
    }

    runeach(0);
};

obj.mapSeries = function(data, mapfunc, cb) {
    cb = cb || noopfn;
    var len = data.length;
    var results = [];

    function runeach(idx) {
        var called;
        function runnext(err, data) {
            if( !called ) {
                called = 1;
            } else {
                called_already(err, data);
                return;
            }
            if( !err ) { 
                results[idx] = data;
                idx += 1;
                if( idx<len ) {
                    runeach(idx);
                } else {
                    cb(err, results);
                }
            } else {
                cb(err, results);
            }
        }
        mapfunc(data[idx], runnext);
    }

    runeach(0);
};

obj.filter = function(data, filterfunc, cb) {
    obj.filterParallel(data, filterfunc, cb);
};

obj.filterParallel = function(data, filterfunc, cb) {
    cb = cb || noopfn;
    var len = data.length;
    var results = new Array(len);
    var cnt = len;
    var called = 0;

    function runeach(idx) {
        var idxcalled;
        function runnext(err, counted) {
            if( !idxcalled ) {
                idxcalled = 1;
            } else {
                called_already(err, counted);
                return;
            }
            if( !err ) { 
                if( counted )
                    results[idx] = data[idx];
                cnt -= 1;
            } else {
                cnt = 0;
            }

            if( !cnt ) {
                if( !called ) {
                    called = 1;
                    if( !err ) {
                        var filterdata = [];
                        var len = results.length;
                        var index = 0;
                        for(var i=0; i<len; i+=1) {
                            if( results[i] ) {
                                filterdata[index] = results[i];
                                index +=1;
                            }
                        }
                        cb(err, filterdata);
                    } else {
                        cb(err, results);
                    }
                }
            }
        }
        filterfunc(data[idx], runnext);
    }

    while(len) { len -= 1; runeach(len); }
};

obj.filter = obj.filterParallel;

obj.mapParallel = function(data, mapfunc, cb) {
    cb = cb || noopfn;
    var len = data.length;
    var results = new Array(len);
    var cnt = len;
    var called = 0;

    function runeach(idx) {
        var idxcalled;
        function runnext(err, data) {
            if( !idxcalled ) {
                idxcalled = 1;
            } else {
                called_already(err, data);
                return;
            }
            if( !err ) { 
                results[idx] = data;
                cnt -= 1;
                if( !cnt ) {
                    if( !called ) {
                        called = 1;
                        cb(err, results);
                    }
                }
            } else {
                if( !called ) {
                    called = 1;
                    cb(err, results);
                }
            }
        }
        mapfunc(data[idx], runnext);
    }

    while(len) { len -= 1; runeach(len); }
};

obj.eachLimit = function(data, mapfunc, limit, cb) {
    obj.mapLimit(data, mapfunc, limit, cb);
};

obj.eachSeries = function(data, mapfunc, cb) {
    obj.mapLimit(data, mapfunc, 1, cb);
};

obj.each = function(data, mapfunc, cb) {
    obj.map(data, mapfunc, cb);
};

obj.mapAll = function(data, mapfunc, cb) {
    cb = cb || noopfn;
    var len = data.length;
    var results = new Array(len);
    var cnt = len;

    function runeach(idx) {
        function runnext(err, data) {
            if( idx === null ) {
                called_already(err, data);
                return;
            }
            if( !err ) { 
                results[idx] = data;
            } else {
                results[idx] = err;
            }
            cnt -= 1;
            idx = null;
            if( !cnt ) {
                cb(err, results);
                cb = noopfn;
            }
        }
        mapfunc(data[idx], runnext);
    }

    while(len) { len -= 1; runeach(len); }
};


obj.map = obj.mapParallel;
obj.mapAllParallel = obj.mapAll;

obj.filterLimit = function(data, filterfunc, max, cb) {
    cb = cb || noopfn;
    var len = data.length;
    if( !max || max>len )
        throw_limiterr();
    var results = [];
    var remaining = 0;
    var called = 0;

    function runeach(idx) {
        var idxcalled;
        function runnext(err, counted) {
            if( !idxcalled ) {
                idxcalled = 1;
            } else {
                called_already(err, counted);
                return;
            }
            if( !err ) { 
                remaining -= 1;
                if( counted )
                    results[idx] = data[idx];
                if( runcnt<len ) {
                    if( !called ) {
                        remaining += 1;
                        runeach(runcnt++);
                    }
                } else {
                    if( !remaining && !called ) {
                        called = 1;
                        var filterdata = [];
                        var index = 0;
                        for(var i=0; i<len; i+=1) {
                            if( results[i] ) {
                                filterdata[index] = results[i];
                                index += 1;
                            }
                        }
                        cb(err, filterdata);
                    }
                }
            } else {
                if( !called ) {
                    called = 1;
                    cb(err, results);
                }
            }
        }
        filterfunc(data[idx], runnext);
    }

    for(var runcnt=0; runcnt<max; runcnt+=1 ) { remaining += 1;  runeach(runcnt); }
};

obj.mapLimit = function(data, mapfunc, max, cb) {
    cb = cb || noopfn;
    var len = data.length;
    if( !max || max>len )
        throw_limiterr();
    var results = [];
    var remaining = 0;
    var called = 0;

    function runeach(idx) {
        var idxcalled;
        function runnext(err, data) {
            if( !idxcalled ) {
                idxcalled = 1;
            } else {
                called_already(err, data);
                return;
            }
            if( !err ) { 
                remaining -= 1;
                results[idx] = data;
                if( runcnt<len ) {
                    if( !called ) {
                        remaining += 1;
                        runeach(runcnt++);
                    }
                } else {
                    if( !remaining && !called ) {
                        called = 1;
                        cb(err, results);
                    }
                }
            } else {
                if( !called ) {
                    called = 1;
                    cb(err, results);
                }
            }
        }
        mapfunc(data[idx], runnext);
    }

    for(var runcnt=0; runcnt<max; runcnt+=1 ) { remaining += 1;  runeach(runcnt); }
};

obj.parallel = function(tasks, done) {
    done = done || noopfn;
    var len = tasks.length, results = [], idx=len;
    function eachtsk(idx) {
      return function store(err, data) {
        if( idx === null ) {
            if( done !== noopfn )
                called_already(err, data);
            return;
        }
        if( !err ) {
          results[idx] = data;
          idx = null;
          len -= 1;
        } else {
          len = 0;
        }
        if( !len ) {
            done(err, results);
            done = noopfn;
        }
      };
    }
    while(idx) { idx -= 1; tasks[idx](eachtsk(idx)); }
};

obj.all = function(tasks, done) {
    done = done || noopfn;
    var len = tasks.length, results = [], idx=len;
    function eachtsk(idx) {
      return function store(err, data) {
        if( idx === null ) {
            if( done !== noopfn )
                called_already(err, data);
            return;
        }
        if( !err )
            results[idx] = data;
        else
            results[idx] = err;
        idx = null;
        len -= 1;
        if( !len ) {
            done(null, results);
            done = noopfn;
        }
      };
    }
    while(idx) { idx -= 1; tasks[idx](eachtsk(idx)); }
};

obj.race = function(tasks, done) {
    done = done || noopfn;
    var idx = tasks.length;
    function once(err, data) {
        if( !err ) {
            done(null, data);
        } else {
            done(err, null);
        }
        done = noopfn;
    }
    while(idx) { idx -= 1; tasks[idx](once); }
};

obj.parallelLimit = function(tasks, max, done) {
    if( !max || max>tasks.length ) {
        throw_limiterr();
    }

    done = done || noopfn;
    var results = [],
        runcnt = max - 1,
        cnt = runcnt;

    function eachfnLimit(idx) {
      return function store(err, data) {
        var i = idx;
        if( i === null ) {
            called_already(err, data);
            return;
        }
        if( !err ) {
          results[i] = data;
          runcnt += 1;
          idx = null;
          var rc = runcnt;
          var tsk = tasks[rc];
          if( tsk ) {
              tsk(eachfnLimit(rc));
          } else if( cnt ) {
              cnt -= 1;
          } else {
              done(err, results);
              done = noopfn;
          }
        } else {
            done(err, results);
            done = noopfn;
        }
      };
    }
    for(var i=0; i<max; i+=1) { 
        tasks[i](eachfnLimit(i));
    }
};

obj.Noapply = function(fn) {
    var args = [].slice.call(arguments, 1);
    return function() {
        var len = arguments.length, moreargs;
        if( len>0 ) {
            moreargs = [].slice.call(arguments);
            for(var i=0; i<len; i++) {
                args.push(moreargs[i]);
            }
        }
        return fn.apply(null, args);
    };
};

function noopfn() {}

function called_already(err, data) {
    
    var called = 'callback called already';
    if( !obj.silent )
        console.error(called + '; err=', err, '; data=', data);
    if( obj.trace )
        console.trace(called + ' stack');
    else
        if( obj.errout )
            throw new Error(called);
}

function throw_limiterr() {
    throw new Error('limit not specified or too big');
}

obj.trace = 0;
obj.silent = 0;

})(typeof module === 'object' && typeof exports === 'object'?exports:this.sonicAsync=this.sonicAsync||{});
