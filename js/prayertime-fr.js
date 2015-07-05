function PrayerTimeFr(){
  var PT = new PrayTimes('MWL');
  PT.adjust({imsak:"0 min", highLats:"AngleBased", midnight:"Jafari"});

  this.getTimes = function(date, lat, lon){
    var times = PT.getTimes(date, [lat, lon], 1, isSummerHour(date) ? 1 : 0);

    var gps = new LatLon(lat, lon);
    var distances = [];

    for (var i in prayertime_fr_data){
      var cur_gps = new LatLon(prayertime_fr_data[i].latitude, prayertime_fr_data[i].longitude);
      distances.push({index:i, distance:cur_gps.distanceTo(gps),
        horizontally:(new LatLon(lat, prayertime_fr_data[i].longitude)).distanceTo(gps),
        vertically:(new LatLon(prayertime_fr_data[i].latitude, lon)).distanceTo(gps),
        after:(prayertime_fr_data[i].longitude <= lon)
      });
    }
    distances.sort(function(a, b){
      if (a.vertically < b.vertically)
        return (-1);
      else if (a.vertically > b.vertically)
        return (1);
      return (0);
    });
    var lonShift = getLongitudeTimeShift(distances[0].horizontally, lat, !distances[0].after);
    var latShift = getLatitudeTimeShift(distances, date, lat);
    var initialFajr  = parseStringTime(prayertime_fr_data[distances[0].index].times[date.getUTCMonth()][date.getUTCDate() - 1], 'h') +
      (isSummerHour(date) ? 1 : 0);
    times.fajr = encodeStringTime(initialFajr + Math.round(lonShift) / 60.0 + Math.round(latShift) / 60.0, ':');
    recalculateNightTimes(times);
    return (times);
  };

  function recalculateNightTimes(times){
    var sunset = parseStringTime(times.sunset, ':');
    var fajr = parseStringTime(times.fajr, ':') + 24;
    var midnight = sunset + (fajr - sunset) / 2;
    var lastThird = sunset + (fajr - sunset) / 3 * 2;
    times.midnight = encodeStringTime(midnight >= 24 ? midnight - 24 : midnight, ':');
    times.lastThird = encodeStringTime(lastThird >= 24 ? lastThird - 24 : lastThird, ':');
  }

  function getLongitudeTimeShift(distance, latitude, after){
    var earthRadius = 6378;
    var sunSpeed = 2 * Math.PI * Math.cos(Number(latitude).toRadians()) * earthRadius; //in km/day
    sunSpeed = sunSpeed * 1000 / (24 * 60); //in meter/min
    return (distance / sunSpeed * (after ? 1 : -1));
  }

  function getLatitudeTimeShift(distances, date, latitude){
    var highestCityFirst = prayertime_fr_data[distances[0].index].latitude
      >= prayertime_fr_data[distances[1].index].latitude;
    var nearestCity = prayertime_fr_data[distances[highestCityFirst ? 0 : 1].index];
    var secNearestCity = prayertime_fr_data[distances[highestCityFirst ? 1 : 0].index];
    var gps1 = new LatLon(nearestCity.latitude, nearestCity.longitude)
    var gps2 = new LatLon(nearestCity.latitude, secNearestCity.longitude)
    var horizontally = gps1.distanceTo(gps2);
    var shiftBetweenCities = getLongitudeTimeShift(horizontally,
      nearestCity.latitude, secNearestCity.longitude <= nearestCity.longitude);
    var t1 = parseStringTime(nearestCity.times[date.getUTCMonth()][date.getUTCDate() - 1]);
    var t2 = parseStringTime(secNearestCity.times[date.getUTCMonth()][date.getUTCDate() - 1]) - shiftBetweenCities / 60.0;
    var latTimeDiff = (t1 - t2) * 60;
    var latShiftByMeter = latTimeDiff / (new LatLon(nearestCity.latitude, nearestCity.longitude)).distanceTo(
      new LatLon(secNearestCity.latitude, nearestCity.longitude));
    return (latShiftByMeter * distances[0].vertically * (latitude >= prayertime_fr_data[distances[0].index].latitude ? 1 : -1));
  }

  function digit(nb){
    return (nb < 10 ? ("0" + nb) : nb);
  }

  function encodeStringTime(time, sep){
    if (sep === undefined)
      sep = 'h';
    var m = Math.round((time % 1) * 60);
    var h = time - (time % 1);
    return (digit(h) + sep + digit(m));
  }

  function parseStringTime(time, sep){
    if (sep === undefined)
      sep = 'h';
    var a = time.split(sep);
    return (a[0] * 1 + a[1] / 60.0);
  }

  function isSummerHour(date){
    var march = new Date(Date.UTC(date.getFullYear(), 2, 31));
    var october = new Date(Date.UTC(date.getFullYear(), 9, 31));

    for (var lastSundayOfMarch = 31; march.getDay() != 0; march.setUTCDate(--lastSundayOfMarch));
    for (var lastSundayOfOctober = 31; october.getDay() != 0; october.setUTCDate(--lastSundayOfOctober));

    return (date.getTime() >= march.getTime() && date.getTime() < october.getTime());
  }
}
