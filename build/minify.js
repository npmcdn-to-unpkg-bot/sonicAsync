#!/usr/bin/env node

var compressor = require('node-minify');

// Using Google Closure
new compressor.minify({
  type: 'gcc',
  fileIn: __dirname + '/../sonicAsync.js',
  fileOut: __dirname + '/../sonicAsync.min.js',
  mapfileOut: __dirname + '/../sonicAsync.js.map',
  callback: function(err, min){
    if( err )
      console.log(err);
  }
});
