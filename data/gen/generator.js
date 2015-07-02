function isSummerHour(date){
  var march = new Date(Date.UTC(date.getFullYear(), 2, 31));
  var october = new Date(Date.UTC(date.getFullYear(), 9, 31));

  for (var lastSundayOfMarch = 31; march.getDay() != 0; march.setUTCDate(--lastSundayOfMarch));
  for (var lastSundayOfOctober = 31; october.getDay() != 0; october.setUTCDate(--lastSundayOfOctober));

  return (date.getTime() >= march.getTime() && date.getTime() < october.getTime());
}

//Convert all times to GMT + 1
function tuneTime(time, monthNb, dayNb){
  if (!isSummerHour(new Date(Date.UTC(2015, monthNb, dayNb))))
    return (time);
  time = (time.split('h')[0] * 1 - 1)  + 'h' + time.split('h')[1];
  return (time);
}

function add_city_data(city, data, name, lat, lon){
  var obj = {
    city : name,
    latitude : lat,
    longitude : lon,
    times : []
  };
  var month = [];
  var monthNb = 0;

  for (var i = 0; i < city.length; i += 6){
    if (city[i] === "1" && !(month.length == 0)){
      obj.times.push(month);
      ++monthNb;
      month = [];
    }
    month.push(tuneTime(city[i + 1], monthNb, city[i] * 1));
  }
  obj.times.push(month);
  data.push(obj);
}

var prayertime_fr_data = [];
add_city_data(prayertime_fr_amiens, prayertime_fr_data, "amiens", 49.90095321859007, 2.290074455386684);
add_city_data(prayertime_fr_besancon, prayertime_fr_data, "besancon", 47.25538722494024, 6.0194869649423115);
add_city_data(prayertime_fr_bordeaux, prayertime_fr_data, "bordeaux", 44.85724453514966, 0.5736967811598869);
add_city_data(prayertime_fr_clermont_ferrand, prayertime_fr_data, "clermont_ferrand", 45.785649299085584, 3.1155454290268803);
add_city_data(prayertime_fr_lille, prayertime_fr_data, "lille", 50.631718316778176, 3.0478327231208246);
add_city_data(prayertime_fr_lyon, prayertime_fr_data, "lyon", 45.7699284396584, 4.829224649781766);
add_city_data(prayertime_fr_marseille, prayertime_fr_data, "marseille", 43.29990094363675, 5.382278697952184);
add_city_data(prayertime_fr_metz, prayertime_fr_data, "metz", 49.10811332792492, 6.19552454210356);
add_city_data(prayertime_fr_mulhouse, prayertime_fr_data, "mulhouse", 47.749163302979674, 7.325700475094066);
add_city_data(prayertime_fr_orleans, prayertime_fr_data, "orleans", 47.882863421380264, 1.9161035747737603);
add_city_data(prayertime_fr_paris, prayertime_fr_data, "paris", 48.8626304851685, 2.3362934465505396);
add_city_data(prayertime_fr_poitiers, prayertime_fr_data, "poitiers", 46.583920772572576, 0.35994765300316445);
add_city_data(prayertime_fr_rouen, prayertime_fr_data, "rouen", 49.44134601033831, 1.0925678427798247);
add_city_data(prayertime_fr_strasbourg, prayertime_fr_data, "strasbourg", 48.571267984911756, 7.767526795169564);
add_city_data(prayertime_fr_toulouse, prayertime_fr_data, "toulouse", 43.59638143032458, 1.4316729336369596);
add_city_data(prayertime_fr_tours, prayertime_fr_data, "tours", 47.39863822805879, 0.6965263764166114);
console.log('var prayertime_fr_data = ' + JSON.stringify(prayertime_fr_data, null, 2) + ';');
