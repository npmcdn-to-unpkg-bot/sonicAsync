require('../lib/fakes');
var async = require('neo-async');

function fileInsertFor(i, tx) {
    var ins = FileVersion.insert({index: i});
    return function(callback) {
            ins.execWithin(tx, callback);
    };
}

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = fileInsertFor(i, tx);
    }

    async.parallelLimit(queries, 5, function(err, callback) {
        if (err) {
            tx.rollback();
            done(err);
        }
        else {
            tx.commit();
            done();
        }
    });
}
