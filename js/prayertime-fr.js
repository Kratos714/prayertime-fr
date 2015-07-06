function PrayerTimeFr(){
  var PT = new PrayTimes('MWL');
  PT.adjust({imsak:"0 min", highLats:"AngleBased", midnight:"Jafari"});

  /*
    PrayerTimeFr.getTimes : Get prayer times for the given date and location in France

    param date : UTC Date
    param lat  : Latitude
    param lon  : Longitude
  */
  this.getTimes = function(date, lat, lon){
    //Get times by calculation
    //Base is 18˚ for Fajr and 17˚ for isha (muslim world league), with angle based adjustment for higher latitudes
    var times = PT.getTimes(date, [lat, lon], 1, isSummerHour(date) ? 1 : 0);

    //The LatLon object is the representation of a 2D point (latitude and longitude) on a spherical map
    //It contains a method which calculate the distance between two points
    var loc = new LatLon(lat, lon);

    /*
      Make an array which will contain the distance between given coordinates and every city 
      This array is filled by those objects :
      {
        index        - The index of this city in the "prayertime_fr_data" array
        distance     - The distance in meters as the crow flies
        horizontally - The horizontal distance (longitude line) as the crow flies
        vertically   - The vertical distance (latitude line) as the crow flies
        after        - Is the location of the city is "after" (west, due to earth's rotation) given coordinates ?
      }
    */
    var distances = [];
    for (var i in prayertime_fr_data){
      var city_loc = new LatLon(prayertime_fr_data[i].latitude, prayertime_fr_data[i].longitude);
      distances.push({index:i, distance:city_loc.distanceTo(loc),
        horizontally:(new LatLon(lat, prayertime_fr_data[i].longitude)).distanceTo(loc),
        vertically:(new LatLon(prayertime_fr_data[i].latitude, lon)).distanceTo(loc),
        after:(prayertime_fr_data[i].longitude <= lon)
      });
    }

    //Sort this array by vertical distance
    distances.sort(function(a, b){
      if (a.vertically < b.vertically)
        return (-1);
      else if (a.vertically > b.vertically)
        return (1);
      return (0);
    });

    //Get time shifts from the nearest city (vertically)
    var lonShift = getLongitudeTimeShift(distances[0].horizontally, lat, !distances[0].after);
    var latShift = getLatitudeTimeShift(distances, date, lat);

    //Calculate the Fajr time with those datas
    var initialFajr  = parseStringTime(prayertime_fr_data[distances[0].index].times[date.getUTCMonth()][date.getUTCDate() - 1], 'h') +
      (isSummerHour(date) ? 1 : 0);
    times.fajr = encodeStringTime(initialFajr + Math.round(lonShift) / 60.0 + Math.round(latShift) / 60.0, ':');

    recalculateNightTimes(times);
    return (times);
  };

  //Adjust midnight and last third of the night times with the new Fajr
  function recalculateNightTimes(times){
    var sunset = parseStringTime(times.sunset, ':');
    var fajr = parseStringTime(times.fajr, ':') + 24;
    var midnight = sunset + (fajr - sunset) / 2;
    var lastThird = sunset + (fajr - sunset) / 3 * 2;
    times.midnight = encodeStringTime(midnight >= 24 ? midnight - 24 : midnight, ':');
    times.lastThird = encodeStringTime(lastThird >= 24 ? lastThird - 24 : lastThird, ':');
  }

  //Calculate the horizontal time shift
  //Divide the distance by the sun speed
  function getLongitudeTimeShift(distance, latitude, after){
    var earthRadius = 6378;
    var sunSpeed = 2 * Math.PI * Math.cos(Number(latitude).toRadians()) * earthRadius; //in km/day
    sunSpeed = sunSpeed * 1000 / (24 * 60); //in meter/min
    return (distance / sunSpeed * (after ? 1 : -1));
  }

  //Calculate the vertical time shift
  //To get this value, we use the time shift between the two nearest cities divided by the distance between them
  //and then multiply this with the distance between the given latitude and the nearest city 
  function getLatitudeTimeShift(distances, date, latitude){
    //First, check which city, between the two nearest ones, is the highest (high latitude)
    //It's important to conserve this order for further calculation
    var highestCityFirst = prayertime_fr_data[distances[0].index].latitude
      >= prayertime_fr_data[distances[1].index].latitude;
    var nearestCity = prayertime_fr_data[distances[highestCityFirst ? 0 : 1].index];
    var secNearestCity = prayertime_fr_data[distances[highestCityFirst ? 1 : 0].index];

    //Next, get the horizontal shift between those cities
    //We'll use it to virtually set them on the same vertical line and then get the vertical shift
    var loc1 = new LatLon(nearestCity.latitude, nearestCity.longitude);
    var loc2 = new LatLon(nearestCity.latitude, secNearestCity.longitude);
    var horizontally = loc1.distanceTo(loc2);
    var shiftBetweenCities = getLongitudeTimeShift(horizontally,
      nearestCity.latitude, secNearestCity.longitude <= nearestCity.longitude);

    //Get the prayer times for the given date to calculate the time shift
    var t1 = parseStringTime(nearestCity.times[date.getUTCMonth()][date.getUTCDate() - 1]);
    var t2 = parseStringTime(secNearestCity.times[date.getUTCMonth()][date.getUTCDate() - 1]) - shiftBetweenCities / 60.0;
    var latTimeDiff = (t1 - t2) * 60;

    //Calculate the time shift
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

  //Return true if it's DST in France for the given date
  function isSummerHour(date){
    var march = new Date(Date.UTC(date.getFullYear(), 2, 31));
    var october = new Date(Date.UTC(date.getFullYear(), 9, 31));

    for (var lastSundayOfMarch = 31; march.getDay() != 0; march.setUTCDate(--lastSundayOfMarch));
    for (var lastSundayOfOctober = 31; october.getDay() != 0; october.setUTCDate(--lastSundayOfOctober));

    return (date.getTime() >= march.getTime() && date.getTime() < october.getTime());
  }
}
