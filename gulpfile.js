var gulp       = require('gulp');
var uglify     = require('gulp-uglify');
var concat     = require('gulp-concat');

gulp.task('default', function(){
  var js = gulp.src(['praytimes.js'])
    .pipe(uglify({preserveComments:'some'}))
    .pipe(concat('prayertime-fr.min.js'))
    .pipe(gulp.dest('./'));
  js = gulp.src(['praytimes.js'])
    .pipe(concat('prayertime-fr.js'))
    .pipe(gulp.dest('./'));
});
