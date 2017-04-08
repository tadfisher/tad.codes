'use strict';

var gulp = require('gulp'),
    append = require('gulp-append'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCss = require('gulp-clean-css'),
    exec = require('child_process').exec,
    replace = require('gulp-replace'),
    sass = require('gulp-sass'),

    styles = {
      src: './src/scss/*.scss',
      dest: './layouts/partials/stylesheet.html'
    };

gulp.task('build:styles', function () {
  gulp.src(styles.src)

    .pipe(sass({
      includePaths: ['./node_modules'],
      outputStyle: 'expanded'
    }))

    .pipe(replace('!important'))

    .pipe(cleanCss())

    .pipe(append(styles.dest));
});

gulp.task('build:drafts', function (cb) {
  exec('hugo --buildDrafts --buildFuture', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('build:public', ['build:styles'], function (cb) {
  exec('hugo', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('serve', function (cb) {
  gulp.watch(styles.src, ['build:styles']);
  exec('hugo server --buildDrafts --buildFuture --bind=0.0.0.0', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
