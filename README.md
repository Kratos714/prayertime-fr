# prayertime-fr
Accurate prayer time calculation for France

Using PrayTimes.js from http://praytimes.org

Using latlon-spherical.js from https://github.com/chrisveness/geodesy

View all cities where Fajr prayer has been Observed by eye on the map : http://www.zeemaps.com/view?group=1520089

Data is taken from http://www.mosqueedeparis.net (for year 2015)

Usage :
```html

<script type="text/javascript" src="prayertime-fr.min.js"></script>
<script type="text/javascript">
  var PT = new PrayerTimeFr();
  var paris = new LatLon(48.8626304851685, 2.3362934465505396);
  var times = PT.getTimes(new Date(), paris.lat, paris.lon);
  
  console.log(times);
</script>

```
