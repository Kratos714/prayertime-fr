/*
Generate times by linear interpolation between two given dates
*/

function is_time_correct(time){
  var time_regex = /^[0-2]?[0-9]h[0-5][0-9]$/;

  if (time_regex.test(time) === false || time.split('h')[0] * 1 >= 24){
    console.error("'%s' is not a correct time", time);
    return (false);
  }
  return (true);
}

function is_times_correct(times){
  var times_regex = /^[^,]+(,[^,]+){4}$/;

  if (times_regex.test(times) === false){
    console.error("'%s' is not a correct time array", times);
    return (false);
  }
  for (var i = 0; i < 5; ++i)
    if (!is_time_correct(times.split(',')[i]))
      return (false);
  return (true);
}

function is_date_correct(date){
  if (isNaN(Date.parse(date))){
    console.error("'%s' is not a correct date", date);
    return (false);
  }
  return (true);
}

function usage(){
  console.log("Usage : node x.js times_from times_to start_date end_date");
  console.log("Sample : node x.js '6h33,12h44,14h39,17h00,18h39' '5h37,12h55,15h23,18h10,19h50' 2015-01-15 2015-03-4");
}

if (process.argv[5] !== undefined &&
    is_times_correct(process.argv[2]) && is_times_correct(process.argv[3]) &&
    is_date_correct(process.argv[4]) && is_date_correct(process.argv[5])){
  var date_from = new Date(process.argv[4]);
  var date_to = new Date(process.argv[5]);
  if (date_from.getTime() >= date_to.getTime()){
    console.error("'%s' is before '%s'", date_to, date_from);
    usage();
    return;
  }
}
else
  usage();