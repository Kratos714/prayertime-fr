/*
Generate times by linear interpolation between two given dates
*/

function main(){
if (process.argv[5] !== undefined &&
    is_times_correct(process.argv[2]) && is_times_correct(process.argv[3]) &&
    is_date_correct(process.argv[4]) && is_date_correct(process.argv[5])){
  var date_from = new Date(process.argv[4]);
  var date_to = new Date(process.argv[5]);

  if (date_from.getTime() >= date_to.getTime()){
    console.error("'%s' is " + (date_from.getTime() == date_to.getTime() ? "equal to" : "before") + " '%s'", date_to, date_from);
    usage();
    return;
  }
  var times_from = parse_string_time_array(process.argv[2]);
  var times_to = parse_string_time_array(process.argv[3]);
  gen_times(times_from, times_to, date_from, date_to);
}
else
  usage();
}

function gen_times(times_from, times_to, date_from, date_to){
  var one_day_ms = 1000 * 60 * 60 * 24;
  var nb_days = Math.round((date_to.getTime() - date_from.getTime()) / one_day_ms);
  var string_days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  var cur_date = new Date(date_from.getTime());

  for (var i = 0; i < nb_days; ++i){
    var cur_times = "";
    for (var j in times_from){
      cur_times += (cur_times === "" ? "" : " ") +
      encode_string_time((times_from[j] + (times_to[j] - times_from[j]) / nb_days * i));
    }
    console.log(string_days[cur_date.getDay()] + " " + cur_date.getDate() + " " + cur_times);
    cur_date.setTime(cur_date.getTime() + one_day_ms);
  }
}

function digit(nb){
  return (nb < 10 ? ("0" + nb) : nb);
}

function encode_string_time(time){
  var m = Math.round((time % 1) * 60);
  var h = time - (time % 1);
  return (digit(h) + 'h' + digit(m));
}

function parse_string_time(time){
  var a = time.split('h');
  return (a[0] * 1 + a[1] / 60.0);
}

function parse_string_time_array(times){
  var time_array = times.split(',');

  for (var i in time_array){
    time_array[i] = parse_string_time(time_array[i]);
  }
  return (time_array);
}

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

main();
