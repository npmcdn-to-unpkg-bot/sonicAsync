global.useBluebird = true;
global.useQ = false;
var Promise = require('bluebird');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i});
    }

    Promise.map(queries, function(ins) {
        return ins.execWithin(tx);
    }, {concurrency: 5}).then(function() {
        tx.commit();
        done();
    }, function(err) {
        tx.rollback();
        done(err);
    });
}
