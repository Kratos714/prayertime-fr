var gulp       = require('gulp');
var uglify     = require('gulp-uglify');
var concat     = require('gulp-concat');

gulp.task('default', function(){
  var srcs = ['praytimes.js', 'data/js/*.js'];
  var js = gulp.src(srcs)
    .pipe(uglify({preserveComments:'some'}))
    .pipe(concat('prayertime-fr.min.js'))
    .pipe(gulp.dest('./'));
  js = gulp.src(srcs)
    .pipe(concat('prayertime-fr.js'))
    .pipe(gulp.dest('./'));
});
