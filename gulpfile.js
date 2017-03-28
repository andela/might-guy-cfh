const gulp = require('gulp');
const browserSync = require('browser-sync');
const nodemon = require('gulp-nodemon');
const sass = require('gulp-sass');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const bower = require('gulp-bower');

/**
 * Adds two numbers together.
 * @param {null} The first number.
 * @returns {null} The sum of the two numbers.
 */
function handleError() {
  this.emit('end');
}

gulp.task('lint', () => (
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  gulp.src(['**/*.js', '!node_modules/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError())
));

gulp.task('mocha', () => (
  gulp.src(['./test/**/*.js'])
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    })
    .on('error', handleError))
));

gulp.task('nodemon', (cb) => {
  let started = false;
  nodemon({
    script: 'server.js',
  }).on('start', () => {
    if (!started) {
      cb();
      started = true;
    }
  });
});

gulp.task('reload', ['nodemon'], () => {
  browserSync.init(null, {
    proxy: 'http://localhost:3000',
    port: 5000,
    files: ['public/**/**'],
  });
});

gulp.task('scss', () => {
  gulp.src('./public/css/*.scss')
  .pipe(sass())
  .pipe(gulp.dest('./public/css'));
});

gulp.task('bower', () => (
  bower({ directory: './public/lib' })
));


gulp.task('default', ['scss', 'reload'], () => {
  gulp.watch(['public/**/**/**'], browserSync.reload());
});

gulp.task('install', ['bower']);
