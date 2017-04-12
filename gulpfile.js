'use strict';

var append = require('gulp-append'),
    autoprefixer = require('gulp-autoprefixer'),
    cheerio = require('cheerio'),
    CleanCSS = require('clean-css'),
    connect = require('gulp-connect'),
    del = require('del'),
    exec = require('child_process').exec,
    htmlmin = require('gulp-htmlmin'),
    gulp = require('gulp'),
    map = require('map-stream'),
    replace = require('gulp-replace'),
    rx = require('rxjs/Rx'),
    rxToStream = require('rxjs-stream').rxToStream,
    streamToRx = require('rxjs-stream').streamToRx,
    sass = require('gulp-sass'),
    uncss = require('uncss'),
    watch = require('gulp-watch'),

    html = {
      src: './public/**/*.html',
      dest: './public'
    },

    styles = {
      src: './src/scss/*.scss',
      dest: './build/styles.css'
    };

function hugo(args) {
  const cmd = ['hugo', args].join(' ');
  return function(done) {
    exec(cmd, function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    });
  };
}

gulp.task('clean', function(done) {
  del(['./public/**/*', '!./public', '!./public/.gitkeep']).then(paths => done());
});

gulp.task('build:styles', function () {
  return gulp.src(styles.src)

    .pipe(sass({
      includePaths: ['./node_modules'],
      outputStyle: 'expanded'
    }))

    .pipe(replace('!important'))

    .pipe(append(styles.dest));
});

gulp.task('hugo:drafts', hugo('--buildDrafts --buildFuture'));

gulp.task('hugo:public', hugo());

gulp.task('minify', function () {
  var rxuncss = rx.Observable.bindNodeCallback(uncss, (output, error) => output);

  var cleancss = new CleanCSS();

  return gulp.src(html.src)

    .pipe(map((file, cb) => rx.Observable.of(file.contents.toString())
      .concatMap(html => streamToRx(gulp.src(styles.dest))
        .map(file => file.contents.toString())
        .concatMap(css => rxuncss(html, { ignoreSheets: [/\s*/], raw: css }))
        .map(output => {
          var $ = cheerio.load(html);
          $('head > style[amp-custom]').text(output);
          return $.html();
        }))
      .subscribe(output => {
        file.contents = new Buffer(output, 'utf8');
        cb(null, file);
      })))

    .pipe(htmlmin({
      collapseWhitespace: true,
      minifyCss: true,
      minifyJs: true
    }))

    .pipe(gulp.dest(html.dest));
});

gulp.task('build:dev', gulp.series('clean', 'build:styles', 'hugo:drafts', 'minify'));

gulp.task('build:prod', gulp.series('clean', 'build:styles', 'hugo:public', 'minify'));

gulp.task('watch:dev', function() {
  gulp.watch(['./content/**/*', './data/**/*', './layouts/**/*', './src/**/*', './static/**/*', './themes/**/*'],
             { ignored: 'layouts/partials/stylesheet.html', ignoreInitial: false }, gulp.series('build:dev'));
});

gulp.task('serve:dev', function() {
  connect.server({
    root: 'public',
    livereload: true
  });

  gulp.src('./public/**/*')
    .pipe(watch('./public/**/*'), { ignoreInitial: false })
    .pipe(connect.reload());
});

gulp.task('serve:prod', function() {
  connect.server({
    root: 'public',
    livereload: false
  });

  gulp.src('./public/**/*')
    .pipe(watch('./public/**/*'), { ignoreInitial: false })
    .pipe(connect.reload());
});
