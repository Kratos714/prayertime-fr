var gulp       = require('gulp');
var uglify     = require('gulp-uglify');
var concat     = require('gulp-concat');

gulp.task('gen', function(){
  gulp.src(['data/js/*.js', 'data/gen/generator.js'])
  .pipe(concat('cities.js'))
  .pipe(gulp.dest('js/gen/'));
});

gulp.task('default', function(){
  var srcs = ['js/lib/*.js', 'js/gen/data.js'];
  var js = gulp.src(srcs)
    .pipe(uglify({preserveComments:'some'}))
    .pipe(concat('prayertime-fr.min.js'))
    .pipe(gulp.dest('./'));
  js = gulp.src(srcs)
    .pipe(concat('prayertime-fr.js'))
    .pipe(gulp.dest('./'));
});
