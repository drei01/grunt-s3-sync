/*
 * grunt-contrib-uglify
 * https://gruntjs.com/
 *
 * Copyright (c) 2013 Small Multiples
 * Licensed under the MIT license.
 */

'use strict';

// External libs.
var s3sync = require('s3-sync')
  , zlib = require('zlib')
  , fs = require('fs')

module.exports = function(grunt) {
  grunt.registerMultiTask('s3-sync', 'A streaming interface for uploading multiple files to S3.', function() {
    var options = this.options()
      , db
    if (options.db) {
      db = options.db
      delete options.db
    } else {
      db = options
      options = false
    }

    // Init the stream
    var stream = s3sync(db, options)

    stream.on('data', function(file) {
      grunt.log.ok(file.absolute, file.relative)
    })
    stream.on('fail', function(err) {
      grunt.log.error(err.toString())
    })

    this.files.forEach(function(file) {
      file.src.forEach(function(src) {
        // GZip the file
        if (file.gzip) {
          return fs.readFile(src, function(err, data) {
            var buffer = new Buffer(data)
            zlib.gzip(buffer, function(err, data) {
              if (!err) {
                stream.write({
                    src: data
                  , dest: file.dest
                })
              }
            })
          })
        }

        stream.write({
            src: src
          , dest: file.dest
        })
      })
    })

    stream.end()
  })
}