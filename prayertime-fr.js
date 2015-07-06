/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    Latitude/longitude spherical geodesy formulae & scripts           (c) Chris Veness 2002-2015
     - www.movable-type.co.uk/scripts/latlong.html                                   MIT @license
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
// if (typeof module!='undefined' && module.exports) var Dms = require('./dms'); // CommonJS (Node)


/**
 * Creates a LatLon point on the earth's surface at the specified latitude / longitude.
 *
 * @classdesc Tools for geodetic calculations
 * @requires Dms from 'dms.js'
 *
 * @constructor
 * @param {number} lat - Latitude in degrees.
 * @param {number} lon - Longitude in degrees.
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119);
 */
function LatLon(lat, lon) {
    // allow instantiation without 'new'
    if (!(this instanceof LatLon)) return new LatLon(lat, lon);

    this.lat = Number(lat);
    this.lon = Number(lon);
}


/**
 * Returns the distance from 'this' point to destination point (using haversine formula).
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {number} Distance between this point and destination point, in same units as radius.
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119), p2 = new LatLon(48.857, 2.351);
 *     var d = p1.distanceTo(p2); // Number(d.toPrecision(4)): 404300
 */
LatLon.prototype.distanceTo = function(point, radius) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var R = radius;
    var φ1 = this.lat.toRadians(),  λ1 = this.lon.toRadians();
    var φ2 = point.lat.toRadians(), λ2 = point.lon.toRadians();
    var Δφ = φ2 - φ1;
    var Δλ = λ2 - λ1;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d;
};


/**
 * Returns the (initial) bearing from 'this' point to destination point.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Initial bearing in degrees from north.
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119), p2 = new LatLon(48.857, 2.351);
 *     var b1 = p1.bearingTo(p2); // b1.toFixed(1): 156.2
 */
LatLon.prototype.bearingTo = function(point) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

    var φ1 = this.lat.toRadians(), φ2 = point.lat.toRadians();
    var Δλ = (point.lon-this.lon).toRadians();

    // see http://mathforum.org/library/drmath/view/55417.html
    var y = Math.sin(Δλ) * Math.cos(φ2);
    var x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
    var θ = Math.atan2(y, x);

    return (θ.toDegrees()+360) % 360;
};


/**
 * Returns final bearing arriving at destination destination point from 'this' point; the final bearing
 * will differ from the initial bearing by varying degrees according to distance and latitude.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Final bearing in degrees from north.
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119), p2 = new LatLon(48.857, 2.351);
 *     var b2 = p1.finalBearingTo(p2); // b2.toFixed(1): 157.9
 */
LatLon.prototype.finalBearingTo = function(point) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

    // get initial bearing from destination point to this point & reverse it by adding 180°
    return ( point.bearingTo(this)+180 ) % 360;
};


/**
 * Returns the midpoint between 'this' point and the supplied point.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {LatLon} Midpoint between this point and the supplied point.
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119), p2 = new LatLon(48.857, 2.351);
 *     var pMid = p1.midpointTo(p2); // pMid.toString(): 50.5363°N, 001.2746°E
 */
LatLon.prototype.midpointTo = function(point) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

    // see http://mathforum.org/library/drmath/view/51822.html for derivation

    var φ1 = this.lat.toRadians(), λ1 = this.lon.toRadians();
    var φ2 = point.lat.toRadians();
    var Δλ = (point.lon-this.lon).toRadians();

    var Bx = Math.cos(φ2) * Math.cos(Δλ);
    var By = Math.cos(φ2) * Math.sin(Δλ);

    var φ3 = Math.atan2(Math.sin(φ1)+Math.sin(φ2),
             Math.sqrt( (Math.cos(φ1)+Bx)*(Math.cos(φ1)+Bx) + By*By) );
    var λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);
    λ3 = (λ3+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ3.toDegrees(), λ3.toDegrees());
};


/**
 * Returns the destination point from 'this' point having travelled the given distance on the
 * given initial bearing (bearing normally varies around path followed).
 *
 * @param   {number} distance - Distance travelled, in same units as earth radius (default: metres).
 * @param   {number} bearing - Initial bearing in degrees from north.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {LatLon} Destination point.
 *
 * @example
 *     var p1 = new LatLon(51.4778, -0.0015);
 *     var p2 = p1.destinationPoint(7794, 300.7); // p2.toString(): 51.5135°N, 000.0983°W
 */
LatLon.prototype.destinationPoint = function(distance, bearing, radius) {
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    // see http://williams.best.vwh.net/avform.htm#LL

    var δ = Number(distance) / radius; // angular distance in radians
    var θ = Number(bearing).toRadians();

    var φ1 = this.lat.toRadians();
    var λ1 = this.lon.toRadians();

    var φ2 = Math.asin( Math.sin(φ1)*Math.cos(δ) +
                        Math.cos(φ1)*Math.sin(δ)*Math.cos(θ) );
    var λ2 = λ1 + Math.atan2(Math.sin(θ)*Math.sin(δ)*Math.cos(φ1),
                             Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));
    λ2 = (λ2+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ2.toDegrees(), λ2.toDegrees());
};


/**
 * Returns the point of intersection of two paths defined by point and bearing.
 *
 * @param   {LatLon} p1 - First point.
 * @param   {number} brng1 - Initial bearing from first point.
 * @param   {LatLon} p2 - Second point.
 * @param   {number} brng2 - Initial bearing from second point.
 * @returns {LatLon} Destination point (null if no unique intersection defined).
 *
 * @example
 *     var p1 = LatLon(51.8853, 0.2545), brng1 = 108.547;
 *     var p2 = LatLon(49.0034, 2.5735), brng2 =  32.435;
 *     var pInt = LatLon.intersection(p1, brng1, p2, brng2); // pInt.toString(): 50.9078°N, 004.5084°E
 */
LatLon.intersection = function(p1, brng1, p2, brng2) {
    if (!(p1 instanceof LatLon)) throw new TypeError('p1 is not LatLon object');
    if (!(p2 instanceof LatLon)) throw new TypeError('p2 is not LatLon object');

    // see http://williams.best.vwh.net/avform.htm#Intersection

    var φ1 = p1.lat.toRadians(), λ1 = p1.lon.toRadians();
    var φ2 = p2.lat.toRadians(), λ2 = p2.lon.toRadians();
    var θ13 = Number(brng1).toRadians(), θ23 = Number(brng2).toRadians();
    var Δφ = φ2-φ1, Δλ = λ2-λ1;

    var δ12 = 2*Math.asin( Math.sqrt( Math.sin(Δφ/2)*Math.sin(Δφ/2) +
        Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2) ) );
    if (δ12 == 0) return null;

    // initial/final bearings between points
    var θ1 = Math.acos( ( Math.sin(φ2) - Math.sin(φ1)*Math.cos(δ12) ) /
                        ( Math.sin(δ12)*Math.cos(φ1) ) );
    if (isNaN(θ1)) θ1 = 0; // protect against rounding
    var θ2 = Math.acos( ( Math.sin(φ1) - Math.sin(φ2)*Math.cos(δ12) ) /
                        ( Math.sin(δ12)*Math.cos(φ2) ) );

    var θ12, θ21;
    if (Math.sin(λ2-λ1) > 0) {
        θ12 = θ1;
        θ21 = 2*Math.PI - θ2;
    } else {
        θ12 = 2*Math.PI - θ1;
        θ21 = θ2;
    }

    var α1 = (θ13 - θ12 + Math.PI) % (2*Math.PI) - Math.PI; // angle 2-1-3
    var α2 = (θ21 - θ23 + Math.PI) % (2*Math.PI) - Math.PI; // angle 1-2-3

    if (Math.sin(α1)==0 && Math.sin(α2)==0) return null; // infinite intersections
    if (Math.sin(α1)*Math.sin(α2) < 0) return null;      // ambiguous intersection

    //α1 = Math.abs(α1);
    //α2 = Math.abs(α2);
    // ... Ed Williams takes abs of α1/α2, but seems to break calculation?

    var α3 = Math.acos( -Math.cos(α1)*Math.cos(α2) +
                         Math.sin(α1)*Math.sin(α2)*Math.cos(δ12) );
    var δ13 = Math.atan2( Math.sin(δ12)*Math.sin(α1)*Math.sin(α2),
                          Math.cos(α2)+Math.cos(α1)*Math.cos(α3) );
    var φ3 = Math.asin( Math.sin(φ1)*Math.cos(δ13) +
                        Math.cos(φ1)*Math.sin(δ13)*Math.cos(θ13) );
    var Δλ13 = Math.atan2( Math.sin(θ13)*Math.sin(δ13)*Math.cos(φ1),
                           Math.cos(δ13)-Math.sin(φ1)*Math.sin(φ3) );
    var λ3 = λ1 + Δλ13;
    λ3 = (λ3+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ3.toDegrees(), λ3.toDegrees());
};


/**
 * Returns (signed) distance from ‘this’ point to great circle defined by start-point and end-point.
 *
 * @param   {LatLon} pathStart - Start point of great circle path.
 * @param   {LatLon} pathEnd - End point of great circle path.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {number} Distance to great circle (-ve if to left, +ve if to right of path).
 *
 * @example
 *   var pCurrent = new LatLon(53.2611, -0.7972);
 *   var p1 = new LatLon(53.3206, -1.7297), p2 = new LatLon(53.1887, 0.1334);
 *   var d = pCurrent.crossTrackDistanceTo(p1, p2);  // Number(d.toPrecision(4)): -307.5
 */
LatLon.prototype.crossTrackDistanceTo = function(pathStart, pathEnd, radius) {
    if (!(pathStart instanceof LatLon)) throw new TypeError('pathStart is not LatLon object');
    if (!(pathEnd instanceof LatLon)) throw new TypeError('pathEnd is not LatLon object');
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var δ13 = pathStart.distanceTo(this, radius)/radius;
    var θ13 = pathStart.bearingTo(this).toRadians();
    var θ12 = pathStart.bearingTo(pathEnd).toRadians();

    var dxt = Math.asin( Math.sin(δ13) * Math.sin(θ13-θ12) ) * radius;

    return dxt;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Returns the distance travelling from 'this' point to destination point along a rhumb line.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {number} Distance in km between this point and destination point (same units as radius).
 *
 * @example
 *     var p1 = new LatLon(51.127, 1.338), p2 = new LatLon(50.964, 1.853);
 *     var d = p1.distanceTo(p2); // Number(d.toPrecision(4)): 40310
 */
LatLon.prototype.rhumbDistanceTo = function(point, radius) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    // see http://williams.best.vwh.net/avform.htm#Rhumb

    var R = radius;
    var φ1 = this.lat.toRadians(), φ2 = point.lat.toRadians();
    var Δφ = φ2 - φ1;
    var Δλ = Math.abs(point.lon-this.lon).toRadians();
    // if dLon over 180° take shorter rhumb line across the anti-meridian:
    if (Math.abs(Δλ) > Math.PI) Δλ = Δλ>0 ? -(2*Math.PI-Δλ) : (2*Math.PI+Δλ);

    // on Mercator projection, longitude distances shrink by latitude; q is the 'stretch factor'
    // q becomes ill-conditioned along E-W line (0/0); use empirical tolerance to avoid it
    var Δψ = Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ/Δψ : Math.cos(φ1);

    // distance is pythagoras on 'stretched' Mercator projection
    var δ = Math.sqrt(Δφ*Δφ + q*q*Δλ*Δλ); // angular distance in radians
    var dist = δ * R;

    return dist;
};


/**
 * Returns the bearing from 'this' point to destination point along a rhumb line.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Bearing in degrees from north.
 *
 * @example
 *     var p1 = new LatLon(51.127, 1.338), p2 = new LatLon(50.964, 1.853);
 *     var d = p1.rhumbBearingTo(p2); // d.toFixed(1): 116.7
 */
LatLon.prototype.rhumbBearingTo = function(point) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

    var φ1 = this.lat.toRadians(), φ2 = point.lat.toRadians();
    var Δλ = (point.lon-this.lon).toRadians();
    // if dLon over 180° take shorter rhumb line across the anti-meridian:
    if (Math.abs(Δλ) > Math.PI) Δλ = Δλ>0 ? -(2*Math.PI-Δλ) : (2*Math.PI+Δλ);

    var Δψ = Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));

    var θ = Math.atan2(Δλ, Δψ);

    return (θ.toDegrees()+360) % 360;
};


/**
 * Returns the destination point having travelled along a rhumb line from 'this' point the given
 * distance on the  given bearing.
 *
 * @param   {number} distance - Distance travelled, in same units as earth radius (default: metres).
 * @param   {number} bearing - Bearing in degrees from north.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {LatLon} Destination point.
 *
 * @example
 *     var p1 = new LatLon(51.127, 1.338);
 *     var p2 = p1.rhumbDestinationPoint(40300, 116.7); // p2.toString(): 50.9642°N, 001.8530°E
 */
LatLon.prototype.rhumbDestinationPoint = function(distance, bearing, radius) {
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var δ = Number(distance) / radius; // angular distance in radians
    var φ1 = this.lat.toRadians(), λ1 = this.lon.toRadians();
    var θ = Number(bearing).toRadians();

    var Δφ = δ * Math.cos(θ);

    var φ2 = φ1 + Δφ;
    // check for some daft bugger going past the pole, normalise latitude if so
    if (Math.abs(φ2) > Math.PI/2) φ2 = φ2>0 ? Math.PI-φ2 : -Math.PI-φ2;

    var Δψ = Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1); // E-W course becomes ill-conditioned with 0/0

    var Δλ = δ*Math.sin(θ)/q;

    var λ2 = λ1 + Δλ;

    λ2 = (λ2 + 3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ2.toDegrees(), λ2.toDegrees());
};


/**
 * Returns the loxodromic midpoint (along a rhumb line) between 'this' point and second point.
 *
 * @param   {LatLon} point - Latitude/longitude of second point.
 * @returns {LatLon} Midpoint between this point and second point.
 *
 * @example
 *     var p1 = new LatLon(51.127, 1.338), p2 = new LatLon(50.964, 1.853);
 *     var p2 = p1.rhumbMidpointTo(p2); // p2.toString(): 51.0455°N, 001.5957°E
 */
LatLon.prototype.rhumbMidpointTo = function(point) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

    // http://mathforum.org/kb/message.jspa?messageID=148837

    var φ1 = this.lat.toRadians(), λ1 = this.lon.toRadians();
    var φ2 = point.lat.toRadians(), λ2 = point.lon.toRadians();

    if (Math.abs(λ2-λ1) > Math.PI) λ1 += 2*Math.PI; // crossing anti-meridian

    var φ3 = (φ1+φ2)/2;
    var f1 = Math.tan(Math.PI/4 + φ1/2);
    var f2 = Math.tan(Math.PI/4 + φ2/2);
    var f3 = Math.tan(Math.PI/4 + φ3/2);
    var λ3 = ( (λ2-λ1)*Math.log(f3) + λ1*Math.log(f2) - λ2*Math.log(f1) ) / Math.log(f2/f1);

    if (!isFinite(λ3)) λ3 = (λ1+λ2)/2; // parallel of latitude

    λ3 = (λ3 + 3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ3.toDegrees(), λ3.toDegrees());
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Returns a string representation of 'this' point, formatted as degrees, degrees+minutes, or
 * degrees+minutes+seconds.
 *
 * @param   {string} [format=dms] - Format point as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use - default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Comma-separated latitude/longitude.
 */
LatLon.prototype.toString = function(format, dp) {
    if (format === undefined) format = 'dms';

    return Dms.toLat(this.lat, format, dp) + ', ' + Dms.toLon(this.lon, format, dp);
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend Number object with method to convert numeric degrees to radians */
if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}


/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = LatLon; // CommonJS (Node)
if (typeof define == 'function' && define.amd) define(['Dms'], function() { return LatLon; }); // AMD

/* @license 

PrayTimes.js: Prayer Times Calculator (ver 2.3)
Copyright (C) 2007-2011 PrayTimes.org

Developer: Hamid Zarrabi-Zadeh
License: GNU LGPL v3.0

TERMS OF USE:
  Permission is granted to use this code, with or 
  without modification, in any website or application 
  provided that credit is given to the original work 
  with a link back to PrayTimes.org.

This program is distributed in the hope that it will 
be useful, but WITHOUT ANY WARRANTY. 

PLEASE DO NOT REMOVE THIS COPYRIGHT BLOCK.
 
*/ 

/*
Modifications by Emmanuel ATSE :
  - Added calculation of midnight and last third of night
*/

//--------------------- Help and Manual ----------------------
/*

User's Manual: 
http://praytimes.org/manual

Calculation Formulas: 
http://praytimes.org/calculation



//------------------------ User Interface -------------------------


  getTimes (date, coordinates [, timeZone [, dst [, timeFormat]]]) 
  
  setMethod (method)       // set calculation method 
  adjust (parameters)      // adjust calculation parameters 
  tune (offsets)           // tune times by given offsets 

  getMethod ()             // get calculation method 
  getSetting ()            // get current calculation parameters
  getOffsets ()            // get current time offsets


//------------------------- Sample Usage --------------------------


  var PT = new PrayTimes('ISNA');
  var times = PT.getTimes(new Date(), [43, -80], -5);
  document.write('Sunrise = '+ times.sunrise)


*/
  

//----------------------- PrayTimes Class ------------------------


function PrayTimes(method) {


  //------------------------ Constants --------------------------
  var
  
  // Time Names
  timeNames = {
    imsak    : 'Imsak',
    fajr     : 'Fajr',
    sunrise  : 'Sunrise',
    dhuhr    : 'Dhuhr',
    asr      : 'Asr',
    sunset   : 'Sunset',
    maghrib  : 'Maghrib',
    isha     : 'Isha',
    midnight : 'Midnight',
    lastThird : 'Last third of the night'
  },


  // Calculation Methods
  methods = {
    MWL: {
      name: 'Muslim World League',
      params: { fajr: 18, isha: 17 } },
    ISNA: {
      name: 'Islamic Society of North America (ISNA)',
      params: { fajr: 15, isha: 15 } },
    Egypt: {
      name: 'Egyptian General Authority of Survey',
      params: { fajr: 19.5, isha: 17.5 } },
    Makkah: {
      name: 'Umm Al-Qura University, Makkah',
      params: { fajr: 18.5, isha: '90 min' } },  // fajr was 19 degrees before 1430 hijri
    Karachi: {
      name: 'University of Islamic Sciences, Karachi',
      params: { fajr: 18, isha: 18 } },
    Tehran: {
      name: 'Institute of Geophysics, University of Tehran',
      params: { fajr: 17.7, isha: 14, maghrib: 4.5, midnight: 'Jafari' } },  // isha is not explicitly specified in this method
    Jafari: {
      name: 'Shia Ithna-Ashari, Leva Institute, Qum',
      params: { fajr: 16, isha: 14, maghrib: 4, midnight: 'Jafari' } }
  },


  // Default Parameters in Calculation Methods
  defaultParams = {
    maghrib: '0 min', midnight: 'Standard'

  },
 
 
  //----------------------- Parameter Values ----------------------
  /*
  
  // Asr Juristic Methods
  asrJuristics = [ 
    'Standard',    // Shafi`i, Maliki, Ja`fari, Hanbali
    'Hanafi'       // Hanafi
  ],


  // Midnight Mode
  midnightMethods = [ 
    'Standard',    // Mid Sunset to Sunrise
    'Jafari'       // Mid Sunset to Fajr
  ],


  // Adjust Methods for Higher Latitudes
  highLatMethods = [
    'NightMiddle', // middle of night
    'AngleBased',  // angle/60th of night
    'OneSeventh',  // 1/7th of night
    'None'         // No adjustment
  ],


  // Time Formats
  timeFormats = [
    '24h',         // 24-hour format
    '12h',         // 12-hour format
    '12hNS',       // 12-hour format with no suffix
    'Float'        // floating point number 
  ],
  */  


  //---------------------- Default Settings --------------------
  
  calcMethod = 'MWL',

  // do not change anything here; use adjust method instead
  setting = {  
    imsak    : '10 min',
    dhuhr    : '0 min',  
    asr      : 'Standard',
    highLats : 'NightMiddle'
  },

  timeFormat = '24h',
  timeSuffixes = ['am', 'pm'],
  invalidTime =  '-----',

  numIterations = 1,
  offset = {},


  //----------------------- Local Variables ---------------------

  lat, lng, elv,       // coordinates
  timeZone, jDate;     // time variables
  

  //---------------------- Initialization -----------------------
  
  
  // set methods defaults
  var defParams = defaultParams;
  for (var i in methods) {
    var params = methods[i].params;
    for (var j in defParams)
      if ((typeof(params[j]) == 'undefined'))
        params[j] = defParams[j];
  };

  // initialize settings
  calcMethod = methods[method] ? method : calcMethod;
  var params = methods[calcMethod].params;
  for (var id in params)
    setting[id] = params[id];

  // init time offsets
  for (var i in timeNames)
    offset[i] = 0;
  
  //----------------------- Public Functions ------------------------
  return {

  
  // set calculation method 
  setMethod: function(method) {
    if (methods[method]) {
      this.adjust(methods[method].params);
      calcMethod = method;
    }
  },


  // set calculating parameters
  adjust: function(params) {
    for (var id in params)
      setting[id] = params[id];
  },


  // set time offsets
  tune: function(timeOffsets) {
    for (var i in timeOffsets)
      offset[i] = timeOffsets[i];
  },


  // get current calculation method
  getMethod: function() { return calcMethod; },

  // get current setting
  getSetting: function() { return setting; },

  // get current time offsets
  getOffsets: function() { return offset; },

  // get default calc parametrs
  getDefaults: function() { return methods; },


  // return prayer times for a given date
  getTimes: function(date, coords, timezone, dst, format) {
    lat = 1* coords[0];
    lng = 1* coords[1]; 
    elv = coords[2] ? 1* coords[2] : 0;
    timeFormat = format || timeFormat;
    if (date.constructor === Date)
      date = [date.getFullYear(), date.getMonth()+ 1, date.getDate()];
    if (typeof(timezone) == 'undefined' || timezone == 'auto')
      timezone = this.getTimeZone(date);
    if (typeof(dst) == 'undefined' || dst == 'auto') 
      dst = this.getDst(date);
    timeZone = 1* timezone+ (1* dst ? 1 : 0);
    jDate = this.julian(date[0], date[1], date[2])- lng/ (15* 24);
    
    return this.computeTimes();
  },


  // convert float time to the given format (see timeFormats)
  getFormattedTime: function(time, format, suffixes) {
    if (isNaN(time))
      return invalidTime;
    if (format == 'Float') return time;
    suffixes = suffixes || timeSuffixes;

    time = DMath.fixHour(time+ 0.5/ 60);  // add 0.5 minutes to round
    var hours = Math.floor(time); 
    var minutes = Math.floor((time- hours)* 60);
    var suffix = (format == '12h') ? suffixes[hours < 12 ? 0 : 1] : '';
    var hour = (format == '24h') ? this.twoDigitsFormat(hours) : ((hours+ 12 -1)% 12+ 1);
    return hour+ ':'+ this.twoDigitsFormat(minutes)+ (suffix ? ' '+ suffix : '');
  },


  //---------------------- Calculation Functions -----------------------


  // compute mid-day time
  midDay: function(time) {
    var eqt = this.sunPosition(jDate+ time).equation;
    var noon = DMath.fixHour(12- eqt);
    return noon;
  },


  // compute the time at which sun reaches a specific angle below horizon
  sunAngleTime: function(angle, time, direction) {
    var decl = this.sunPosition(jDate+ time).declination;
    var noon = this.midDay(time);
    var t = 1/15* DMath.arccos((-DMath.sin(angle)- DMath.sin(decl)* DMath.sin(lat))/ 
        (DMath.cos(decl)* DMath.cos(lat)));
    return noon+ (direction == 'ccw' ? -t : t);
  },


  // compute asr time 
  asrTime: function(factor, time) { 
    var decl = this.sunPosition(jDate+ time).declination;
    var angle = -DMath.arccot(factor+ DMath.tan(Math.abs(lat- decl)));
    return this.sunAngleTime(angle, time);
  },


  // compute declination angle of sun and equation of time
  // Ref: http://aa.usno.navy.mil/faq/docs/SunApprox.php
  sunPosition: function(jd) {
    var D = jd - 2451545.0;
    var g = DMath.fixAngle(357.529 + 0.98560028* D);
    var q = DMath.fixAngle(280.459 + 0.98564736* D);
    var L = DMath.fixAngle(q + 1.915* DMath.sin(g) + 0.020* DMath.sin(2*g));

    var R = 1.00014 - 0.01671* DMath.cos(g) - 0.00014* DMath.cos(2*g);
    var e = 23.439 - 0.00000036* D;

    var RA = DMath.arctan2(DMath.cos(e)* DMath.sin(L), DMath.cos(L))/ 15;
    var eqt = q/15 - DMath.fixHour(RA);
    var decl = DMath.arcsin(DMath.sin(e)* DMath.sin(L));

    return {declination: decl, equation: eqt};
  },


  // convert Gregorian date to Julian day
  // Ref: Astronomical Algorithms by Jean Meeus
  julian: function(year, month, day) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    };
    var A = Math.floor(year/ 100);
    var B = 2- A+ Math.floor(A/ 4);

    var JD = Math.floor(365.25* (year+ 4716))+ Math.floor(30.6001* (month+ 1))+ day+ B- 1524.5;
    return JD;
  },

  
  //---------------------- Compute Prayer Times -----------------------


  // compute prayer times at given julian date
  computePrayerTimes: function(times) {
    times = this.dayPortion(times);
    var params  = setting;
    
    var imsak   = this.sunAngleTime(this.eval(params.imsak), times.imsak, 'ccw');
    var fajr    = this.sunAngleTime(this.eval(params.fajr), times.fajr, 'ccw');
    var sunrise = this.sunAngleTime(this.riseSetAngle(), times.sunrise, 'ccw');  
    var dhuhr   = this.midDay(times.dhuhr);
    var asr     = this.asrTime(this.asrFactor(params.asr), times.asr);
    var sunset  = this.sunAngleTime(this.riseSetAngle(), times.sunset);;
    var maghrib = this.sunAngleTime(this.eval(params.maghrib), times.maghrib);
    var isha    = this.sunAngleTime(this.eval(params.isha), times.isha);

    return {
      imsak: imsak, fajr: fajr, sunrise: sunrise, dhuhr: dhuhr, 
      asr: asr, sunset: sunset, maghrib: maghrib, isha: isha
    };
  },


  // compute prayer times 
  computeTimes: function() {
    // default times
    var times = { 
      imsak: 5, fajr: 5, sunrise: 6, dhuhr: 12, 
      asr: 13, sunset: 18, maghrib: 18, isha: 18
    };

    // main iterations
    for (var i=1 ; i<=numIterations ; i++) 
      times = this.computePrayerTimes(times);

    times.sunset += 3.0 / 60.0;
    times = this.adjustTimes(times);

    // add midnight time
    times.midnight = (setting.midnight == 'Jafari') ? 
        times.sunset+ this.timeDiff(times.sunset, times.fajr)/ 2 :
        times.sunset+ this.timeDiff(times.sunset, times.sunrise)/ 2;

    // add last third of night time
    times.lastThird = (setting.midnight == 'Jafari') ?
        times.sunset + (this.timeDiff(times.sunset, times.fajr) / 3) * 2 :
        times.sunset + (this.timeDiff(times.sunset, times.sunrise) / 3) * 2;
    times = this.tuneTimes(times);
    return this.modifyFormats(times);
  },


  // adjust times 
  adjustTimes: function(times) {
    var params = setting;
    for (var i in times)
      times[i] += timeZone- lng/ 15;
      
    if (params.highLats != 'None')
      times = this.adjustHighLats(times);
      
    if (this.isMin(params.imsak))
      times.imsak = times.fajr- this.eval(params.imsak)/ 60;
    if (this.isMin(params.maghrib))
      times.maghrib = times.sunset+ this.eval(params.maghrib)/ 60;
    if (this.isMin(params.isha))
      times.isha = times.maghrib+ this.eval(params.isha)/ 60;
    times.dhuhr += this.eval(params.dhuhr)/ 60; 

    return times;
  },


  // get asr shadow factor
  asrFactor: function(asrParam) {
    var factor = {Standard: 1, Hanafi: 2}[asrParam];
    return factor || this.eval(asrParam);
  },


  // return sun angle for sunset/sunrise
  riseSetAngle: function() {
    //var earthRad = 6371009; // in meters
    //var angle = DMath.arccos(earthRad/(earthRad+ elv));
    var angle = 0.0347* Math.sqrt(elv); // an approximation
    return 0.833+ angle;
  },


  // apply offsets to the times
  tuneTimes: function(times) {
    for (var i in times)
      times[i] += offset[i]/ 60; 
    return times;
  },


  // convert times to given time format
  modifyFormats: function(times) {
    for (var i in times)
      times[i] = this.getFormattedTime(times[i], timeFormat); 
    return times;
  },


  // adjust times for locations in higher latitudes
  adjustHighLats: function(times) {
    var params = setting;
    var nightTime = this.timeDiff(times.sunset, times.sunrise); 

    times.imsak = this.adjustHLTime(times.imsak, times.sunrise, this.eval(params.imsak), nightTime, 'ccw');
    times.fajr  = this.adjustHLTime(times.fajr, times.sunrise, this.eval(params.fajr), nightTime, 'ccw');
    times.isha  = this.adjustHLTime(times.isha, times.sunset, this.eval(params.isha), nightTime);
    times.maghrib = this.adjustHLTime(times.maghrib, times.sunset, this.eval(params.maghrib), nightTime);
    
    return times;
  },

  
  // adjust a time for higher latitudes
  adjustHLTime: function(time, base, angle, night, direction) {
    var portion = this.nightPortion(angle, night);
    var timeDiff = (direction == 'ccw') ? 
      this.timeDiff(time, base):
      this.timeDiff(base, time);
    if (isNaN(time) || timeDiff > portion) 
      time = base+ (direction == 'ccw' ? -portion : portion);
    return time;
  },

  
  // the night portion used for adjusting times in higher latitudes
  nightPortion: function(angle, night) {
    var method = setting.highLats;
    var portion = 1/2 // MidNight
    if (method == 'AngleBased')
      portion = 1/60* angle;
    if (method == 'OneSeventh')
      portion = 1/7;
    return portion* night;
  },


  // convert hours to day portions 
  dayPortion: function(times) {
    for (var i in times)
      times[i] /= 24;
    return times;
  },


  //---------------------- Time Zone Functions -----------------------


  // get local time zone
  getTimeZone: function(date) {
    var year = date[0];
    var t1 = this.gmtOffset([year, 0, 1]);
    var t2 = this.gmtOffset([year, 6, 1]);
    return Math.min(t1, t2);
  },

  
  // get daylight saving for a given date
  getDst: function(date) {
    return 1* (this.gmtOffset(date) != this.getTimeZone(date));
  },


  // GMT offset for a given date
  gmtOffset: function(date) {
    var localDate = new Date(date[0], date[1]- 1, date[2], 12, 0, 0, 0);
    var GMTString = localDate.toGMTString();
    var GMTDate = new Date(GMTString.substring(0, GMTString.lastIndexOf(' ')- 1));
    var hoursDiff = (localDate- GMTDate) / (1000* 60* 60);
    return hoursDiff;
  },

  
  //---------------------- Misc Functions -----------------------

  // convert given string into a number
  eval: function(str) {
    return 1* (str+ '').split(/[^0-9.+-]/)[0];
  },


  // detect if input contains 'min'
  isMin: function(arg) {
    return (arg+ '').indexOf('min') != -1;
  },


  // compute the difference between two times 
  timeDiff: function(time1, time2) {
    return DMath.fixHour(time2- time1);
  },


  // add a leading 0 if necessary
  twoDigitsFormat: function(num) {
    return (num <10) ? '0'+ num : num;
  }
  
}}



//---------------------- Degree-Based Math Class -----------------------


var DMath = {

  dtr: function(d) { return (d * Math.PI) / 180.0; },
  rtd: function(r) { return (r * 180.0) / Math.PI; },

  sin: function(d) { return Math.sin(this.dtr(d)); },
  cos: function(d) { return Math.cos(this.dtr(d)); },
  tan: function(d) { return Math.tan(this.dtr(d)); },

  arcsin: function(d) { return this.rtd(Math.asin(d)); },
  arccos: function(d) { return this.rtd(Math.acos(d)); },
  arctan: function(d) { return this.rtd(Math.atan(d)); },

  arccot: function(x) { return this.rtd(Math.atan(1/x)); },
  arctan2: function(y, x) { return this.rtd(Math.atan2(y, x)); },

  fixAngle: function(a) { return this.fix(a, 360); },
  fixHour:  function(a) { return this.fix(a, 24 ); },

  fix: function(a, b) { 
    a = a- b* (Math.floor(a/ b));
    return (a < 0) ? a+ b : a;
  }
}

var prayertime_fr_data = [
  {
    "city": "amiens",
    "latitude": 49.90095321859007,
    "longitude": 2.290074455386684,
    "times": [
      [
        "6h51",
        "6h51",
        "6h51",
        "6h51",
        "6h51",
        "6h51",
        "6h51",
        "6h50",
        "6h50",
        "6h50",
        "6h50",
        "6h49",
        "6h49",
        "6h48",
        "6h48",
        "6h47",
        "6h47",
        "6h46",
        "6h46",
        "6h45",
        "6h44",
        "6h43",
        "6h43",
        "6h42",
        "6h41",
        "6h40",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h35"
      ],
      [
        "6h34",
        "6h32",
        "6h31",
        "6h30",
        "6h29",
        "6h27",
        "6h26",
        "6h24",
        "6h23",
        "6h21",
        "6h20",
        "6h18",
        "6h17",
        "6h15",
        "6h14",
        "6h13",
        "6h11",
        "6h10",
        "6h08",
        "6h07",
        "6h05",
        "6h04",
        "6h02",
        "6h00",
        "5h59",
        "5h57",
        "5h55",
        "5h54",
        "5h53"
      ],
      [
        "5h52",
        "5h50",
        "5h49",
        "5h47",
        "5h45",
        "5h43",
        "5h41",
        "5h39",
        "5h38",
        "5h36",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h03",
        "5h01",
        "4h59",
        "4h57",
        "4h55",
        "4h53"
      ],
      [
        "4h51",
        "4h48",
        "4h46",
        "4h44",
        "4h42",
        "4h40",
        "4h37",
        "4h35",
        "4h33",
        "4h31",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h19",
        "4h17",
        "4h15",
        "4h13",
        "4h10",
        "4h08",
        "4h06",
        "4h04",
        "3h01",
        "3h59",
        "3h57",
        "3h55",
        "3h52",
        "3h50",
        "3h48",
        "3h46"
      ],
      [
        "3h44",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h33",
        "3h30",
        "3h28",
        "3h26",
        "3h24",
        "3h20",
        "3h20",
        "3h18",
        "3h16",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h06",
        "3h04",
        "3h02",
        "3h00",
        "2h58",
        "2h57",
        "2h55",
        "2h53",
        "2h51",
        "2h50",
        "2h48",
        "2h47",
        "2h45"
      ],
      [
        "2h44",
        "2h42",
        "2h41",
        "2h40",
        "2h39",
        "2h38",
        "2h37",
        "2h36",
        "2h35",
        "2h34",
        "2h33",
        "2h32",
        "2h32",
        "2h31",
        "2h31",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h31",
        "2h31",
        "2h32",
        "2h32",
        "2h33",
        "2h34",
        "2h34",
        "2h35"
      ],
      [
        "2h36",
        "2h37",
        "2h39",
        "2h40",
        "2h41",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h48",
        "2h50",
        "2h51",
        "2h53",
        "2h55",
        "2h57",
        "2h58",
        "3h00",
        "3h02",
        "3h04",
        "3h06",
        "3h08",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27"
      ],
      [
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h45",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h58",
        "4h00",
        "4h02",
        "4h04",
        "4h06",
        "4h07",
        "4h09",
        "4h11",
        "4h13",
        "4h14",
        "4h16",
        "4h18",
        "4h19",
        "4h20",
        "4h21",
        "4h25"
      ],
      [
        "4h26",
        "4h28",
        "4h29",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h54",
        "4h55",
        "4h57",
        "4h58",
        "4h59",
        "5h01",
        "5h02",
        "5h03",
        "5h05",
        "5h06",
        "5h07",
        "5h09"
      ],
      [
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h17",
        "5h18",
        "5h19",
        "5h21",
        "5h22",
        "5h23",
        "5h24",
        "5h26",
        "5h27",
        "5h28",
        "5h30",
        "5h31",
        "5h32",
        "5h33",
        "5h35",
        "5h36",
        "5h37",
        "5h38",
        "5h40",
        "5h41",
        "5h42",
        "5h43",
        "5h45",
        "5h46",
        "5h47",
        "5h49"
      ],
      [
        "5h50",
        "5h52",
        "5h53",
        "5h55",
        "5h56",
        "5h58",
        "5h59",
        "6h00",
        "6h02",
        "6h03",
        "6h05",
        "6h06",
        "6h07",
        "6h09",
        "6h10",
        "6h12",
        "6h13",
        "6h14",
        "6h16",
        "6h17",
        "6h18",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h24",
        "6h26",
        "6h27",
        "6h28",
        "6h29"
      ],
      [
        "6h30",
        "6h31",
        "6h32",
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h43",
        "6h43",
        "6h44",
        "6h45",
        "6h46",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h48",
        "6h49",
        "6h49",
        "6h49",
        "6h50",
        "6h50",
        "6h50",
        "6h51",
        "6h51"
      ]
    ]
  },
  {
    "city": "besancon",
    "latitude": 47.25538722494024,
    "longitude": 6.0194869649423115,
    "times": [
      [
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h32",
        "6h31",
        "6h31",
        "6h31",
        "6h30",
        "6h30",
        "6h30",
        "6h29",
        "6h29",
        "6h28",
        "6h28",
        "6h27",
        "6h26",
        "6h26",
        "6h25",
        "6h24",
        "6h24",
        "6h23",
        "6h22",
        "6h21",
        "6h20",
        "6h19",
        "6h18"
      ],
      [
        "6h17",
        "6h16",
        "6h15",
        "6h14",
        "6h13",
        "6h11",
        "6h10",
        "6h09",
        "6h07",
        "6h06",
        "6h05",
        "6h03",
        "6h02",
        "6h01",
        "5h59",
        "5h58",
        "5h56",
        "5h55",
        "5h53",
        "5h52",
        "5h50",
        "5h49",
        "5h47",
        "5h46",
        "5h44",
        "5h42",
        "5h41",
        "5h39",
        "5h38"
      ],
      [
        "5h37",
        "5h35",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h17",
        "5h15",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05",
        "5h03",
        "5h01",
        "4h59",
        "4h57",
        "4h55",
        "4h53",
        "4h51",
        "4h49",
        "4h46",
        "4h44",
        "4h42",
        "4h40",
        "4h38"
      ],
      [
        "4h36",
        "4h33",
        "4h31",
        "4h29",
        "4h27",
        "4h25",
        "4h22",
        "4h20",
        "4h18",
        "4h16",
        "4h14",
        "4h11",
        "4h09",
        "4h07",
        "4h05",
        "4h02",
        "4h00",
        "3h58",
        "3h56",
        "3h53",
        "3h51",
        "3h49",
        "3h47",
        "3h44",
        "3h42",
        "3h40",
        "3h38",
        "3h35",
        "3h33",
        "3h31"
      ],
      [
        "3h29",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h18",
        "3h16",
        "3h13",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "2h59",
        "2h57",
        "2h55",
        "2h53",
        "2h51",
        "2h49",
        "2h47",
        "2h45",
        "2h43",
        "2h42",
        "2h40",
        "2h38",
        "2h37",
        "2h35",
        "2h33",
        "2h32",
        "2h30"
      ],
      [
        "2h29",
        "2h28",
        "2h26",
        "2h25",
        "2h24",
        "2h23",
        "2h22",
        "2h21",
        "2h20",
        "2h19",
        "2h18",
        "2h17",
        "2h17",
        "2h16",
        "2h16",
        "2h16",
        "2h15",
        "2h15",
        "2h15",
        "2h15",
        "2h15",
        "2h16",
        "2h16",
        "2h16",
        "2h17",
        "2h17",
        "2h18",
        "2h19",
        "2h20",
        "2h20"
      ],
      [
        "2h21",
        "2h23",
        "2h24",
        "2h25",
        "2h26",
        "2h27",
        "2h29",
        "2h30",
        "2h32",
        "2h33",
        "2h35",
        "2h37",
        "2h38",
        "2h40",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h49",
        "2h51",
        "2h53",
        "2h55",
        "2h57",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h09",
        "3h10",
        "3h12"
      ],
      [
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24",
        "3h26",
        "3h28",
        "3h30",
        "3h32",
        "3h34",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h43",
        "3h45",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h54",
        "3h56",
        "3h58",
        "4h00",
        "4h01",
        "4h03",
        "4h05",
        "4h06",
        "4h08",
        "4h10"
      ],
      [
        "4h11",
        "4h13",
        "4h15",
        "4h16",
        "4h18",
        "4h19",
        "4h21",
        "4h22",
        "4h24",
        "4h26",
        "4h27",
        "4h29",
        "4h30",
        "4h32",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h44",
        "4h46",
        "4h47",
        "4h49",
        "4h50",
        "4h51",
        "4h53",
        "4h54"
      ],
      [
        "4h55",
        "4h57",
        "4h58",
        "4h59",
        "5h01",
        "5h02",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h08",
        "5h10",
        "5h11",
        "5h12",
        "5h13",
        "5h15",
        "5h16",
        "5h17",
        "5h18",
        "5h20",
        "5h21",
        "5h22",
        "5h23",
        "5h25",
        "5h26",
        "5h27",
        "5h28",
        "5h30",
        "5h31",
        "5h32",
        "5h34"
      ],
      [
        "5h35",
        "5h37",
        "5h38",
        "5h39",
        "5h40",
        "5h42",
        "5h43",
        "5h44",
        "5h46",
        "5h47",
        "5h48",
        "5h49",
        "5h51",
        "5h52",
        "5h53",
        "5h54",
        "5h56",
        "5h57",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h05",
        "6h06",
        "6h07",
        "6h09",
        "6h10",
        "6h11"
      ],
      [
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h24",
        "6h24",
        "6h25",
        "6h26",
        "6h26",
        "6h27",
        "6h27",
        "6h28",
        "6h29",
        "6h29",
        "6h29",
        "6h30",
        "6h30",
        "6h31",
        "6h31",
        "6h31",
        "6h31",
        "6h32"
      ]
    ]
  },
  {
    "city": "bordeaux",
    "latitude": 44.85724453514966,
    "longitude": -0.5736967811598869,
    "times": [
      [
        "6h54",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h53",
        "6h53",
        "6h53",
        "6h52",
        "6h52",
        "6h51",
        "6h51",
        "6h50",
        "6h50",
        "6h49",
        "6h48",
        "6h48",
        "6h47",
        "6h46",
        "6h45",
        "6h45",
        "6h44",
        "6h43"
      ],
      [
        "6h42",
        "6h41",
        "6h40",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h34",
        "6h33",
        "6h31",
        "6h32",
        "6h30",
        "6h28",
        "6h27",
        "6h26",
        "6h24",
        "6h23",
        "6h21",
        "6h20",
        "6h18",
        "6h17",
        "6h15",
        "6h14",
        "6h12",
        "6h10",
        "6h09",
        "6h07",
        "6h05",
        "6h05"
      ],
      [
        "6h04",
        "6h02",
        "6h00",
        "5h59",
        "5h57",
        "5h55",
        "5h53",
        "5h51",
        "5h49",
        "5h48",
        "5h46",
        "5h44",
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h15",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05"
      ],
      [
        "5h03",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h47",
        "4h45",
        "4h43",
        "4h41",
        "4h38",
        "4h36",
        "4h34",
        "4h32",
        "4h30",
        "4h27",
        "4h25",
        "4h23",
        "4h21",
        "4h18",
        "4h16",
        "4h14",
        "4h12",
        "4h09",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h58"
      ],
      [
        "3h56",
        "3h54",
        "3h52",
        "3h50",
        "3h48",
        "3h45",
        "3h43",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h33",
        "3h31",
        "3h29",
        "3h27",
        "3h25",
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h07",
        "3h05",
        "3h03",
        "3h02",
        "3h00",
        "2h59"
      ],
      [
        "2h58",
        "2h56",
        "2h55",
        "2h54",
        "2h53",
        "2h51",
        "2h50",
        "2h49",
        "2h49",
        "2h48",
        "2h47",
        "2h46",
        "2h46",
        "2h45",
        "2h45",
        "2h45",
        "2h44",
        "2h44",
        "2h44",
        "2h44",
        "2h44",
        "2h45",
        "2h45",
        "2h45",
        "2h46",
        "2h46",
        "2h47",
        "2h48",
        "2h49",
        "2h49"
      ],
      [
        "2h50",
        "2h51",
        "2h53",
        "2h54",
        "2h55",
        "2h56",
        "2h58",
        "2h59",
        "3h01",
        "3h02",
        "3h04",
        "3h05",
        "3h07",
        "3h09",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h37",
        "3h39",
        "3h40"
      ],
      [
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h52",
        "3h54",
        "3h56",
        "3h58",
        "4h00",
        "4h02",
        "4h04",
        "4h05",
        "4h07",
        "4h09",
        "4h11",
        "4h13",
        "4h15",
        "4h16",
        "4h18",
        "4h20",
        "4h22",
        "4h23",
        "4h25",
        "4h27",
        "4h29",
        "4h30",
        "4h32",
        "4h34",
        "4h35",
        "4h37"
      ],
      [
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h47",
        "4h48",
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h56",
        "4h57",
        "4h59",
        "5h00",
        "5h01",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h09",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h17",
        "5h18",
        "5h19",
        "5h21"
      ],
      [
        "5h22",
        "5h23",
        "5h25",
        "5h26",
        "5h27",
        "5h29",
        "5h30",
        "5h31",
        "5h32",
        "5h34",
        "5h35",
        "5h36",
        "5h37",
        "5h39",
        "5h40",
        "5h41",
        "5h43",
        "5h44",
        "5h45",
        "5h46",
        "5h48",
        "5h49",
        "5h50",
        "5h51",
        "5h52",
        "5h54",
        "5h55",
        "5h56",
        "5h57",
        "5h59",
        "6h00"
      ],
      [
        "6h01",
        "6h02",
        "6h03",
        "6h05",
        "6h06",
        "6h07",
        "6h08",
        "6h09",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h24",
        "6h26",
        "6h27",
        "6h28",
        "6h29",
        "6h30",
        "6h31",
        "6h32",
        "6h33",
        "6h34"
      ],
      [
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h41",
        "6h42",
        "6h43",
        "6h44",
        "6h45",
        "6h45",
        "6h46",
        "6h47",
        "6h48",
        "6h48",
        "6h49",
        "6h49",
        "6h49",
        "6h51",
        "6h51",
        "6h52",
        "6h52",
        "6h52",
        "6h53",
        "6h53",
        "6h53",
        "6h54",
        "6h54",
        "6h54"
      ]
    ]
  },
  {
    "city": "clermont_ferrand",
    "latitude": 45.785649299085584,
    "longitude": 3.1155454290268803,
    "times": [
      [
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h41",
        "6h40",
        "6h40",
        "6h40",
        "6h39",
        "6h39",
        "6h38",
        "6h38",
        "6h37",
        "6h37",
        "6h36",
        "6h35",
        "6h35",
        "6h34",
        "6h33",
        "6h32",
        "6h32",
        "6h31",
        "6h30",
        "6h29"
      ],
      [
        "6h28",
        "6h27",
        "6h26",
        "6h25",
        "6h24",
        "6h22",
        "6h21",
        "6h20",
        "6h19",
        "6h18",
        "6h16",
        "6h15",
        "6h14",
        "6h12",
        "6h11",
        "6h09",
        "6h08",
        "6h06",
        "6h05",
        "6h03",
        "6h02",
        "6h00",
        "5h59",
        "5h57",
        "5h56",
        "5h54",
        "5h52",
        "5h51",
        "5h50"
      ],
      [
        "5h49",
        "5h47",
        "5h45",
        "5h44",
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h17",
        "5h15",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h04",
        "5h02",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50"
      ],
      [
        "4h47",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h36",
        "4h34",
        "4h32",
        "4h30",
        "4h27",
        "4h25",
        "4h23",
        "4h21",
        "4h19",
        "4h16",
        "4h14",
        "4h12",
        "4h10",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h58",
        "3h56",
        "3h54",
        "3h52",
        "3h49",
        "3h47",
        "3h45",
        "3h43"
      ],
      [
        "3h40",
        "3h38",
        "3h36",
        "3h34",
        "3h32",
        "3h29",
        "3h27",
        "3h25",
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h13",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "2h59",
        "2h57",
        "2h55",
        "2h53",
        "2h52",
        "2h50",
        "2h48",
        "2h47",
        "2h45",
        "2h44",
        "2h42"
      ],
      [
        "2h41",
        "2h39",
        "2h38",
        "2h37",
        "2h36",
        "2h34",
        "2h33",
        "2h32",
        "2h31",
        "2h31",
        "2h30",
        "2h29",
        "2h29",
        "2h28",
        "2h28",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h28",
        "2h28",
        "2h28",
        "2h29",
        "2h30",
        "2h30",
        "2h31",
        "2h32"
      ],
      [
        "2h33",
        "2h34",
        "2h35",
        "2h37",
        "2h38",
        "2h39",
        "2h41",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h48",
        "2h50",
        "2h52",
        "2h53",
        "2h55",
        "2h57",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h08",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24"
      ],
      [
        "3h26",
        "3h28",
        "3h30",
        "3h32",
        "3h34",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h01",
        "4h02",
        "4h04",
        "4h06",
        "4h08",
        "4h10",
        "4h11",
        "4h13",
        "4h15",
        "4h16",
        "4h18",
        "4h20",
        "4h21"
      ],
      [
        "4h23",
        "4h25",
        "4h26",
        "4h28",
        "4h30",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h53",
        "4h55",
        "4h56",
        "4h58",
        "4h59",
        "5h00",
        "5h02",
        "5h03",
        "5h04",
        "5h06"
      ],
      [
        "5h07",
        "5h08",
        "5h10",
        "5h11",
        "5h12",
        "5h14",
        "5h15",
        "5h16",
        "5h17",
        "5h19",
        "5h20",
        "5h21",
        "5h23",
        "5h24",
        "5h25",
        "5h26",
        "5h28",
        "5h29",
        "5h30",
        "5h31",
        "5h33",
        "5h34",
        "5h35",
        "5h36",
        "5h38",
        "5h39",
        "5h40",
        "5h41",
        "5h43",
        "5h44",
        "5h45"
      ],
      [
        "5h46",
        "5h48",
        "5h49",
        "5h50",
        "5h51",
        "5h53",
        "5h54",
        "5h55",
        "5h56",
        "5h58",
        "5h59",
        "6h00",
        "6h01",
        "6h03",
        "6h04",
        "6h05",
        "6h06",
        "6h07",
        "6h08",
        "6h10",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h21"
      ],
      [
        "6h22",
        "6h23",
        "6h24",
        "6h24",
        "6h25",
        "6h26",
        "6h27",
        "6h28",
        "6h29",
        "6h30",
        "6h31",
        "6h31",
        "6h32",
        "6h33",
        "6h34",
        "6h34",
        "6h35",
        "6h36",
        "6h36",
        "6h37",
        "6h37",
        "6h38",
        "6h38",
        "6h39",
        "6h39",
        "6h40",
        "6h40",
        "6h40",
        "6h41",
        "6h41",
        "6h41"
      ]
    ]
  },
  {
    "city": "lille",
    "latitude": 50.631718316778176,
    "longitude": 3.0478327231208246,
    "times": [
      [
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h48",
        "6h48",
        "6h48",
        "6h48",
        "6h47",
        "6h47",
        "6h46",
        "6h46",
        "6h45",
        "6h45",
        "6h44",
        "6h43",
        "6h43",
        "6h42",
        "6h41",
        "6h40",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h35",
        "6h34",
        "6h33",
        "6h32"
      ],
      [
        "6h31",
        "6h30",
        "6h28",
        "6h27",
        "6h26",
        "6h24",
        "6h23",
        "6h21",
        "6h20",
        "6h18",
        "6h17",
        "6h15",
        "6h14",
        "6h12",
        "6h11",
        "6h09",
        "6h08",
        "6h07",
        "6h05",
        "6h04",
        "6h02",
        "6h00",
        "5h59",
        "5h57",
        "5h56",
        "5h54",
        "5h52",
        "5h51",
        "5h50"
      ],
      [
        "5h49",
        "5h47",
        "5h45",
        "5h44",
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h17",
        "5h15",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05",
        "5h02",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50"
      ],
      [
        "4h47",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h36",
        "4h34",
        "4h32",
        "4h30",
        "4h28",
        "4h25",
        "4h23",
        "4h21",
        "4h19",
        "4h16",
        "4h14",
        "4h12",
        "4h10",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h58",
        "3h56",
        "3h54",
        "3h52",
        "3h49",
        "3h47",
        "3h45",
        "3h43"
      ],
      [
        "3h40",
        "3h38",
        "3h36",
        "3h34",
        "3h32",
        "3h29",
        "3h27",
        "3h25",
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h13",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "2h59",
        "2h57",
        "2h55",
        "2h53",
        "2h52",
        "2h50",
        "2h49",
        "2h47",
        "2h45",
        "2h44",
        "2h42"
      ],
      [
        "2h41",
        "2h39",
        "2h38",
        "2h37",
        "2h36",
        "2h34",
        "2h33",
        "2h32",
        "2h32",
        "2h31",
        "2h30",
        "2h29",
        "2h29",
        "2h28",
        "2h28",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h27",
        "2h28",
        "2h28",
        "2h28",
        "2h29",
        "2h30",
        "2h30",
        "2h31",
        "2h32"
      ],
      [
        "2h33",
        "2h34",
        "2h35",
        "2h37",
        "2h38",
        "2h39",
        "2h41",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h48",
        "2h50",
        "2h52",
        "2h54",
        "2h55",
        "2h57",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h08",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24"
      ],
      [
        "3h26",
        "3h28",
        "3h30",
        "3h32",
        "3h34",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h01",
        "4h02",
        "4h04",
        "4h06",
        "4h08",
        "4h10",
        "4h11",
        "4h13",
        "4h15",
        "4h16",
        "4h18",
        "4h20",
        "4h21"
      ],
      [
        "4h23",
        "4h25",
        "4h26",
        "4h28",
        "4h30",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h53",
        "4h55",
        "4h56",
        "4h58",
        "4h59",
        "5h00",
        "5h02",
        "5h03",
        "5h04",
        "5h06"
      ],
      [
        "5h07",
        "5h08",
        "5h10",
        "5h11",
        "5h12",
        "5h14",
        "5h15",
        "5h16",
        "5h17",
        "5h19",
        "5h20",
        "5h21",
        "5h23",
        "5h24",
        "5h25",
        "5h26",
        "5h28",
        "5h29",
        "5h30",
        "5h31",
        "5h33",
        "5h34",
        "5h35",
        "5h36",
        "5h38",
        "5h39",
        "5h40",
        "5h41",
        "5h43",
        "5h44",
        "5h46"
      ],
      [
        "5h47",
        "5h49",
        "5h50",
        "5h52",
        "5h53",
        "5h55",
        "5h56",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h03",
        "6h05",
        "6h06",
        "6h08",
        "6h09",
        "6h11",
        "6h12",
        "6h13",
        "6h15",
        "6h16",
        "6h17",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h24",
        "6h25",
        "6h26",
        "6h27"
      ],
      [
        "6h28",
        "6h29",
        "6h30",
        "6h32",
        "6h33",
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h37",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h42",
        "6h43",
        "6h44",
        "6h44",
        "6h45",
        "6h45",
        "6h46",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h48",
        "6h48",
        "6h48",
        "6h49",
        "6h49"
      ]
    ]
  },
  {
    "city": "lyon",
    "latitude": 45.7699284396584,
    "longitude": 4.829224649781766,
    "times": [
      [
        "6h34",
        "6h34",
        "6h34",
        "6h36",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h33",
        "6h33",
        "6h33",
        "6h33",
        "6h32",
        "6h32",
        "6h31",
        "6h31",
        "6h30",
        "6h30",
        "6h29",
        "6h29",
        "6h28",
        "6h27",
        "6h27",
        "6h26",
        "6h25",
        "6h24",
        "6h23",
        "6h22",
        "6h21"
      ],
      [
        "6h20",
        "6h19",
        "6h18",
        "6h17",
        "6h16",
        "6h15",
        "6h14",
        "6h13",
        "6h11",
        "6h10",
        "6h09",
        "6h08",
        "6h06",
        "6h05",
        "6h03",
        "6h02",
        "6h01",
        "5h59",
        "5h58",
        "5h56",
        "5h55",
        "5h53",
        "5h52",
        "5h50",
        "5h48",
        "5h47",
        "5h45",
        "5h43",
        "5h43"
      ],
      [
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h07",
        "5h05",
        "5h03",
        "5h01",
        "4h59",
        "4h57",
        "4h55",
        "4h53",
        "4h51",
        "4h49",
        "3h47",
        "4h44",
        "4h42"
      ],
      [
        "4h40",
        "4h38",
        "4h36",
        "4h33",
        "4h31",
        "4h29",
        "4h27",
        "4h25",
        "4h22",
        "4h20",
        "4h18",
        "4h16",
        "4h13",
        "4h11",
        "4h09",
        "4h07",
        "4h04",
        "4h02",
        "4h00",
        "3h58",
        "3h55",
        "3h53",
        "3h51",
        "3h49",
        "3h46",
        "3h44",
        "3h42",
        "3h40",
        "3h38",
        "3h35"
      ],
      [
        "3h33",
        "3h31",
        "3h29",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h18",
        "3h16",
        "3h14",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "2h59",
        "2h57",
        "2h55",
        "2h53",
        "2h52",
        "2h50",
        "2h48",
        "2h46",
        "2h44",
        "2h43",
        "2h41",
        "2h39",
        "2h38",
        "2h36",
        "2h35"
      ],
      [
        "2h33",
        "2h32",
        "2h31",
        "2h29",
        "2h28",
        "2h27",
        "2h26",
        "2h25",
        "2h24",
        "2h23",
        "2h23",
        "2h22",
        "2h21",
        "2h21",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h20",
        "2h21",
        "2h21",
        "2h22",
        "2h22",
        "2h23",
        "2h24",
        "2h25"
      ],
      [
        "2h26",
        "2h27",
        "2h28",
        "2h29",
        "2h31",
        "2h32",
        "2h33",
        "2h35",
        "2h36",
        "2h38",
        "2h39",
        "2h41",
        "2h43",
        "2h44",
        "2h46",
        "2h48",
        "2h50",
        "2h52",
        "2h53",
        "2h55",
        "2h57",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h09",
        "3h11",
        "3h13",
        "3h15",
        "3h17"
      ],
      [
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h00",
        "4h02",
        "4h04",
        "4h06",
        "4h07",
        "4h09",
        "4h11",
        "4h12",
        "4h14"
      ],
      [
        "4h16",
        "4h17",
        "4h19",
        "4h21",
        "4h22",
        "4h24",
        "4h25",
        "4h27",
        "4h28",
        "4h30",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h47",
        "4h49",
        "4h50",
        "4h52",
        "4h53",
        "4h54",
        "4h56",
        "4h57",
        "4h58"
      ],
      [
        "5h00",
        "5h01",
        "5h02",
        "5h04",
        "5h05",
        "5h06",
        "5h08",
        "5h09",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h17",
        "5h18",
        "5h17",
        "5h18",
        "5h20",
        "5h22",
        "5h23",
        "5h24",
        "5h25",
        "5h27",
        "5h28",
        "5h29",
        "5h30",
        "5h32",
        "5h33",
        "5h35",
        "5h37",
        "5h38"
      ],
      [
        "5h39",
        "5h40",
        "5h42",
        "5h43",
        "5h44",
        "5h45",
        "5h47",
        "5h48",
        "5h49",
        "5h50",
        "5h52",
        "5h53",
        "5h54",
        "5h55",
        "5h56",
        "5h58",
        "5h59",
        "6h00",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h06",
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h11",
        "6h12",
        "6h13"
      ],
      [
        "6h14",
        "6h15",
        "6h12",
        "6h17",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h22",
        "6h23",
        "6h24",
        "6h25",
        "6h26",
        "6h26",
        "6h27",
        "6h28",
        "6h28",
        "6h29",
        "6h29",
        "6h30",
        "6h30",
        "6h31",
        "6h31",
        "6h32",
        "6h32",
        "6h33",
        "6h33",
        "6h33",
        "6h33",
        "6h34"
      ]
    ]
  },
  {
    "city": "marseille",
    "latitude": 43.29990094363675,
    "longitude": 5.382278697952184,
    "times": [
      [
        "6h28",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h29",
        "6h28",
        "6h28",
        "6h28",
        "6h28",
        "6h27",
        "6h27",
        "6h27",
        "6h26",
        "6h26",
        "6h25",
        "6h25",
        "6h24",
        "6h24",
        "6h23",
        "6h23",
        "6h22",
        "6h21",
        "6h20",
        "6h20",
        "6h16",
        "6h18"
      ],
      [
        "6h17",
        "6h16",
        "6h15",
        "6h14",
        "6h13",
        "6h12",
        "6h11",
        "6h10",
        "6h09",
        "6h08",
        "6h07",
        "6h05",
        "6h04",
        "6h03",
        "6h02",
        "6h00",
        "5h59",
        "5h58",
        "5h56",
        "5h55",
        "5h53",
        "5h52",
        "5h50",
        "5h49",
        "5h47",
        "5h46",
        "5h44",
        "5h43",
        "5h43"
      ],
      [
        "5h41",
        "5h39",
        "5h38",
        "5h36",
        "5h34",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05",
        "5h03",
        "5h01",
        "4h59",
        "4h57",
        "4h55",
        "4h53",
        "4h51",
        "4h49",
        "4h47",
        "4h45"
      ],
      [
        "4h43",
        "4h41",
        "4h39",
        "4h37",
        "4h35",
        "4h32",
        "4h30",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h20",
        "4h18",
        "4h16",
        "4h14",
        "4h12",
        "4h09",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h59",
        "3h57",
        "3h55",
        "3h53",
        "3h51",
        "3h49",
        "3h47",
        "3h45",
        "3h43"
      ],
      [
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h33",
        "3h31",
        "3h29",
        "3h27",
        "3h25",
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h07",
        "3h05",
        "3h03",
        "3h02",
        "3h00",
        "2h59",
        "2h57",
        "2h56",
        "2h54",
        "2h53",
        "2h52",
        "2h51",
        "2h49"
      ],
      [
        "2h48",
        "2h47",
        "2h46",
        "2h45",
        "2h44",
        "2h43",
        "2h42",
        "2h41",
        "2h41",
        "2h40",
        "2h40",
        "2h39",
        "2h39",
        "2h38",
        "2h38",
        "2h38",
        "2h37",
        "2h37",
        "2h37",
        "2h37",
        "2h38",
        "2h38",
        "2h38",
        "2h38",
        "2h39",
        "2h39",
        "2h40",
        "2h41",
        "2h41",
        "2h42"
      ],
      [
        "2h43",
        "2h44",
        "2h45",
        "2h46",
        "2h47",
        "2h48",
        "2h49",
        "2h50",
        "2h52",
        "2h53",
        "2h54",
        "2h56",
        "2h57",
        "2h59",
        "3h00",
        "3h02",
        "3h03",
        "3h05",
        "3h06",
        "3h08",
        "3h10",
        "3h11",
        "3h13",
        "3h15",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h23",
        "3h25",
        "3h27"
      ],
      [
        "3h29",
        "3h30",
        "3h32",
        "3h34",
        "3h36",
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h44",
        "3h46",
        "3h48",
        "3h49",
        "3h51",
        "3h53",
        "3h55",
        "3h56",
        "3h58",
        "4h00",
        "4h01",
        "4h03",
        "4h04",
        "4h06",
        "4h08",
        "4h09",
        "4h11",
        "4h12",
        "4h14",
        "4h15",
        "4h17",
        "4h18"
      ],
      [
        "4h20",
        "4h21",
        "4h23",
        "4h24",
        "4h26",
        "4h27",
        "4h29",
        "4h30",
        "4h32",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h38",
        "4h40",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h55",
        "4h57",
        "4h58",
        "4h59"
      ],
      [
        "5h00",
        "5h01",
        "5h03",
        "5h04",
        "5h05",
        "5h06",
        "5h07",
        "5h09",
        "5h10",
        "5h11",
        "5h12",
        "5h13",
        "5h15",
        "5h16",
        "5h17",
        "5h18",
        "5h19",
        "5h20",
        "5h22",
        "5h23",
        "5h24",
        "5h25",
        "5h26",
        "5h27",
        "5h29",
        "5h30",
        "5h31",
        "5h32",
        "5h33",
        "5h34",
        "5h36"
      ],
      [
        "5h37",
        "5h38",
        "5h39",
        "5h40",
        "5h41",
        "5h42",
        "5h44",
        "5h45",
        "5h46",
        "5h47",
        "5h48",
        "5h49",
        "5h50",
        "5h51",
        "5h52",
        "5h54",
        "5h55",
        "5h56",
        "5h57",
        "5h58",
        "5h59",
        "6h00",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h05",
        "6h06",
        "6h07",
        "6h08"
      ],
      [
        "6h09",
        "6h10",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h19",
        "6h20",
        "6h21",
        "6h21",
        "6h22",
        "6h23",
        "6h23",
        "6h24",
        "6h24",
        "6h25",
        "6h25",
        "6h26",
        "6h26",
        "6h27",
        "6h27",
        "6h27",
        "6h28",
        "6h28",
        "6h28"
      ]
    ]
  },
  {
    "city": "metz",
    "latitude": 49.10811332792492,
    "longitude": 6.19552454210356,
    "times": [
      [
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h34",
        "6h33",
        "6h33",
        "6h33",
        "6h33",
        "6h32",
        "6h32",
        "6h31",
        "6h31",
        "6h30",
        "6h30",
        "6h29",
        "6h28",
        "6h28",
        "6h27",
        "6h26",
        "6h25",
        "6h25",
        "6h24",
        "6h23",
        "6h22",
        "6h21",
        "6h20",
        "6h19"
      ],
      [
        "06h18",
        "06h16",
        "06h15",
        "06h13",
        "06h12",
        "06h10",
        "06h09",
        "06h07",
        "06h06",
        "06h04",
        "06h03",
        "06h01",
        "05h60",
        "05h58",
        "05h57",
        "05h55",
        "05h54",
        "05h52",
        "05h51",
        "05h49",
        "05h48",
        "05h46",
        "05h45",
        "05h43",
        "05h42",
        "05h40",
        "05h39",
        "05h37",
        "05h36"
      ],
      [
        "5h36",
        "5h35",
        "5h33",
        "5h31",
        "5h29",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h04",
        "5h02",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h48",
        "4h46",
        "4h44",
        "4h41",
        "4h39",
        "4h37"
      ],
      [
        "4h35",
        "4h33",
        "4h31",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h20",
        "4h17",
        "4h15",
        "4h13",
        "4h11",
        "4h08",
        "4h06",
        "4h04",
        "4h02",
        "3h59",
        "3h57",
        "3h55",
        "3h53",
        "3h50",
        "3h48",
        "3h46",
        "3h44",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h32",
        "3h30"
      ],
      [
        "3h28",
        "3h26",
        "3h24",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h13",
        "3h11",
        "3h08",
        "3h06",
        "3h04",
        "3h02",
        "3h00",
        "2h58",
        "2h56",
        "2h54",
        "2h52",
        "2h50",
        "2h48",
        "2h46",
        "2h45",
        "2h43",
        "2h41",
        "2h39",
        "2h38",
        "2h36",
        "2h34",
        "2h33",
        "2h31",
        "2h30"
      ],
      [
        "2h28",
        "2h27",
        "2h26",
        "2h24",
        "2h23",
        "2h22",
        "2h21",
        "2h20",
        "2h19",
        "2h18",
        "2h17",
        "2h17",
        "2h16",
        "2h16",
        "2h15",
        "2h15",
        "2h14",
        "2h14",
        "2h14",
        "2h14",
        "2h15",
        "2h15",
        "2h15",
        "2h15",
        "2h16",
        "2h17",
        "2h17",
        "2h18",
        "2h19",
        "2h20"
      ],
      [
        "2h21",
        "2h22",
        "2h23",
        "2h24",
        "2h25",
        "2h27",
        "2h28",
        "2h30",
        "2h31",
        "2h33",
        "2h34",
        "2h36",
        "2h38",
        "2h39",
        "2h41",
        "2h43",
        "2h45",
        "2h46",
        "2h48",
        "2h50",
        "2h52",
        "2h54",
        "2h56",
        "2h58",
        "3h00",
        "3h02",
        "3h04",
        "3h06",
        "3h08",
        "3h10",
        "3h12"
      ],
      [
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24",
        "3h26",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h45",
        "3h46",
        "3h48",
        "3h50",
        "3h52",
        "3h54",
        "3h55",
        "3h57",
        "3h59",
        "4h01",
        "4h02",
        "4h04",
        "4h06",
        "4h07",
        "4h09"
      ],
      [
        "4h11",
        "4h12",
        "4h14",
        "4h15",
        "4h17",
        "4h19",
        "4h20",
        "4h22",
        "4h23",
        "4h25",
        "4h26",
        "4h28",
        "4h29",
        "4h31",
        "4h32",
        "4h34",
        "4h35",
        "4h37",
        "4h38",
        "4h39",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h53"
      ],
      [
        "4h55",
        "4h56",
        "4h57",
        "4h59",
        "5h00",
        "5h01",
        "5h02",
        "5h04",
        "5h05",
        "5h06",
        "5h08",
        "5h09",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h16",
        "5h18",
        "5h19",
        "5h20",
        "5h21",
        "5h23",
        "5h24",
        "5h25",
        "5h26",
        "5h28",
        "5h29",
        "5h30",
        "5h32",
        "5h33"
      ],
      [
        "5h35",
        "5h36",
        "5h37",
        "5h39",
        "5h40",
        "5h42",
        "5h43",
        "5h44",
        "5h46",
        "5h47",
        "5h49",
        "5h50",
        "5h51",
        "5h53",
        "5h54",
        "5h55",
        "5h57",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h06",
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h11",
        "6h13"
      ],
      [
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h23",
        "6h24",
        "6h25",
        "6h26",
        "6h27",
        "6h27",
        "6h28",
        "6h29",
        "6h29",
        "6h30",
        "6h30",
        "6h31",
        "6h31",
        "6h32",
        "6h32",
        "6h33",
        "6h33",
        "6h33",
        "6h33",
        "6h34",
        "6h34"
      ]
    ]
  },
  {
    "city": "mulhouse",
    "latitude": 47.749163302979674,
    "longitude": 7.325700475094066,
    "times": [
      [
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h26",
        "6h26",
        "6h26",
        "6h25",
        "6h25",
        "6h24",
        "6h24",
        "6h23",
        "6h22",
        "6h22",
        "6h21",
        "6h20",
        "6h20",
        "6h19",
        "6h18",
        "6h17",
        "6h16",
        "6h15",
        "6h14",
        "6h13"
      ],
      [
        "6h12",
        "6h11",
        "6h10",
        "6h09",
        "6h08",
        "6h06",
        "6h05",
        "6h04",
        "6h02",
        "6h01",
        "6h00",
        "5h58",
        "5h57",
        "5h55",
        "5h54",
        "5h52",
        "5h51",
        "5h50",
        "5h48",
        "5h47",
        "5h45",
        "5h44",
        "5h42",
        "5h40",
        "5h39",
        "5h37",
        "5h35",
        "5h34",
        "5h33"
      ],
      [
        "5h32",
        "5h30",
        "5h28",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h04",
        "5h02",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h48",
        "4h48",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h35",
        "4h33"
      ],
      [
        "4h30",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h19",
        "4h17",
        "4h15",
        "4h13",
        "4h11",
        "4h08",
        "4h06",
        "4h04",
        "4h02",
        "3h59",
        "3h57",
        "3h55",
        "3h53",
        "3h50",
        "3h48",
        "3h46",
        "3h44",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h32",
        "3h30",
        "3h28",
        "3h26"
      ],
      [
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h13",
        "3h10",
        "3h08",
        "3h06",
        "3h04",
        "3h02",
        "3h00",
        "2h58",
        "2h56",
        "2h54",
        "2h52",
        "2h50",
        "2h48",
        "2h46",
        "2h44",
        "2h42",
        "2h40",
        "2h38",
        "2h37",
        "2h35",
        "2h33",
        "2h31",
        "2h30",
        "2h28",
        "2h27",
        "2h25"
      ],
      [
        "2h24",
        "2h22",
        "2h21",
        "2h20",
        "2h19",
        "2h18",
        "2h16",
        "2h15",
        "2h15",
        "2h14",
        "2h13",
        "2h12",
        "2h12",
        "2h11",
        "2h11",
        "2h10",
        "2h10",
        "2h10",
        "2h10",
        "2h10",
        "2h10",
        "2h10",
        "2h11",
        "2h11",
        "2h12",
        "2h12",
        "2h13",
        "2h13",
        "2h14",
        "2h15"
      ],
      [
        "2h16",
        "2h17",
        "2h18",
        "2h20",
        "2h21",
        "2h22",
        "2h24",
        "2h25",
        "2h27",
        "2h28",
        "2h30",
        "2h31",
        "2h33",
        "2h35",
        "2h37",
        "2h38",
        "2h40",
        "2h42",
        "2h44",
        "2h46",
        "2h48",
        "2h50",
        "2h51",
        "2h53",
        "2h55",
        "2h57",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h07"
      ],
      [
        "3h09",
        "3h11",
        "3h13",
        "3h15",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h34",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h45",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h54",
        "3h56",
        "3h58",
        "3h59",
        "4h01",
        "4h03",
        "4h05"
      ],
      [
        "4h06",
        "4h08",
        "4h09",
        "4h11",
        "4h13",
        "4h14",
        "4h16",
        "4h17",
        "4h19",
        "4h20",
        "4h22",
        "4h23",
        "4h25",
        "4h26",
        "4h28",
        "4h29",
        "4h31",
        "4h32",
        "4h34",
        "4h35",
        "4h36",
        "4h38",
        "4h39",
        "4h41",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h47",
        "4h49"
      ],
      [
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h55",
        "4h57",
        "4h58",
        "4h59",
        "5h01",
        "5h02",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h08",
        "5h09",
        "5h11",
        "5h12",
        "5h13",
        "5h14",
        "5h16",
        "5h17",
        "5h18",
        "5h19",
        "5h21",
        "5h22",
        "5h23",
        "5h24",
        "5h26",
        "5h27",
        "5h29"
      ],
      [
        "5h30",
        "5h31",
        "5h33",
        "5h34",
        "5h35",
        "5h37",
        "5h38",
        "5h39",
        "5h41",
        "5h42",
        "5h43",
        "5h45",
        "5h46",
        "5h47",
        "5h48",
        "5h50",
        "5h51",
        "5h52",
        "5h53",
        "5h55",
        "5h56",
        "5h57",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h05",
        "6h06"
      ],
      [
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h21",
        "6h22",
        "6h22",
        "6h23",
        "6h24",
        "6h24",
        "6h25",
        "6h25",
        "6h25",
        "6h26",
        "6h26",
        "6h26",
        "6h27",
        "6h27",
        "6h27"
      ]
    ]
  },
  {
    "city": "orleans",
    "latitude": 47.882863421380264,
    "longitude": 1.9161035747737603,
    "times": [
      [
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h48",
        "6h48",
        "6h48",
        "6h47",
        "6h47",
        "6h46",
        "6h46",
        "6h45",
        "6h45",
        "6h44",
        "6h44",
        "6h43",
        "6h42",
        "6h41",
        "6h41",
        "6h40",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h35"
      ],
      [
        "06h34",
        "06h32",
        "06h31",
        "06h29",
        "06h28",
        "06h27",
        "06h25",
        "06h24",
        "06h22",
        "06h21",
        "06h19",
        "06h18",
        "06h17",
        "06h15",
        "06h14",
        "06h12",
        "06h11",
        "06h10",
        "06h08",
        "06h07",
        "06h05",
        "06h04",
        "06h02",
        "06h01",
        "05h60",
        "05h58",
        "05h57",
        "05h55",
        "05h55"
      ],
      [
        "5h54",
        "5h52",
        "5h50",
        "5h48",
        "5h46",
        "5h45",
        "5h43",
        "5h41",
        "5h39",
        "5h37",
        "5h35",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h17",
        "5h15",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05",
        "5h03",
        "5h01",
        "4h58",
        "4h56",
        "4h54"
      ],
      [
        "4h52",
        "4h50",
        "4h48",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h37",
        "4h34",
        "4h32",
        "4h30",
        "4h28",
        "4h25",
        "4h23",
        "4h21",
        "4h19",
        "4h16",
        "4h14",
        "4h12",
        "4h10",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h58",
        "3h56",
        "3h54",
        "3h52",
        "3h49",
        "3h47"
      ],
      [
        "3h45",
        "3h43",
        "3h41",
        "3h38",
        "3h36",
        "3h34",
        "3h32",
        "3h30",
        "3h28",
        "3h25",
        "3h23",
        "3h21",
        "3h19",
        "3h17",
        "3h15",
        "3h13",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h02",
        "3h00",
        "2h58",
        "2h56",
        "2h55",
        "2h53",
        "2h51",
        "2h50",
        "2h48",
        "2h47"
      ],
      [
        "2h45",
        "2h44",
        "2h43",
        "2h41",
        "2h40",
        "2h39",
        "2h38",
        "2h37",
        "2h36",
        "2h35",
        "2h35",
        "2h34",
        "2h33",
        "2h33",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h32",
        "2h33",
        "2h33",
        "2h34",
        "2h34",
        "2h35",
        "2h36",
        "2h37"
      ],
      [
        "2h38",
        "2h39",
        "2h40",
        "2h41",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h48",
        "2h50",
        "2h51",
        "2h53",
        "2h55",
        "2h56",
        "2h58",
        "3h00",
        "3h02",
        "3h04",
        "3h05",
        "3h07",
        "3h09",
        "3h11",
        "3h13",
        "3h15",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29"
      ],
      [
        "3h31",
        "3h33",
        "3h35",
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h45",
        "3h47",
        "3h48",
        "3h50",
        "3h52",
        "3h54",
        "3h56",
        "3h58",
        "4h00",
        "4h02",
        "4h03",
        "4h05",
        "4h07",
        "4h09",
        "4h11",
        "4h12",
        "4h14",
        "4h16",
        "4h18",
        "4h19",
        "4h21",
        "4h23",
        "4h24",
        "4h26"
      ],
      [
        "4h28",
        "4h29",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h54",
        "4h55",
        "4h57",
        "4h58",
        "4h59",
        "5h01",
        "5h02",
        "5h04",
        "5h05",
        "5h06",
        "5h08",
        "5h09",
        "5h10"
      ],
      [
        "5h12",
        "5h13",
        "5h14",
        "5h16",
        "5h17",
        "5h18",
        "5h20",
        "5h21",
        "5h22",
        "5h23",
        "5h25",
        "5h26",
        "5h27",
        "5h28",
        "5h30",
        "5h31",
        "5h32",
        "5h34",
        "5h35",
        "5h36",
        "5h37",
        "5h39",
        "5h40",
        "5h41",
        "5h42",
        "5h44",
        "5h45",
        "5h46",
        "5h47",
        "5h49",
        "5h50"
      ],
      [
        "5h52",
        "5h53",
        "5h54",
        "5h56",
        "5h57",
        "5h58",
        "6h00",
        "6h01",
        "6h02",
        "6h04",
        "6h05",
        "6h06",
        "6h08",
        "6h09",
        "6h10",
        "6h11",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h24",
        "6h25",
        "6h26",
        "6h27",
        "6h28"
      ],
      [
        "6h29",
        "6h30",
        "6h31",
        "6h32",
        "6h33",
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h39",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h42",
        "6h43",
        "6h44",
        "6h44",
        "6h45",
        "6h45",
        "6h46",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h48",
        "6h48",
        "6h49",
        "6h49",
        "6h49"
      ]
    ]
  },
  {
    "city": "paris",
    "latitude": 48.8626304851685,
    "longitude": 2.3362934465505396,
    "times": [
      [
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h49",
        "6h48",
        "6h48",
        "6h48",
        "6h47",
        "6h47",
        "6h46",
        "6h46",
        "6h45",
        "6h45",
        "6h44",
        "6h44",
        "6h43",
        "6h42",
        "6h41",
        "6h41",
        "6h40",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h35",
        "6h34"
      ],
      [
        "6h33",
        "6h32",
        "6h30",
        "6h29",
        "6h28",
        "6h27",
        "6h25",
        "6h24",
        "6h23",
        "6h21",
        "6h20",
        "6h18",
        "6h17",
        "6h15",
        "6h14",
        "6h12",
        "6h11",
        "6h09",
        "6h08",
        "6h06",
        "6h05",
        "6h03",
        "6h02",
        "6h00",
        "5h59",
        "5h57",
        "5h55",
        "5h54",
        "5h53"
      ],
      [
        "5h52",
        "5h50",
        "5h48",
        "5h47",
        "5h45",
        "5h43",
        "5h41",
        "5h39",
        "5h37",
        "5h36",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h07",
        "5h05",
        "5h03",
        "5h01",
        "4h59",
        "4h57",
        "4h55",
        "4h53"
      ],
      [
        "4h50",
        "4h48",
        "4h46",
        "4h44",
        "4h42",
        "4h39",
        "4h37",
        "4h35",
        "4h33",
        "4h30",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h19",
        "4h17",
        "4h15",
        "4h13",
        "4h10",
        "4h08",
        "4h06",
        "4h04",
        "4h01",
        "3h59",
        "3h57",
        "3h55",
        "3h52",
        "3h50",
        "3h48",
        "3h46"
      ],
      [
        "3h43",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h32",
        "3h30",
        "3h28",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h18",
        "3h16",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h06",
        "3h04",
        "3h02",
        "3h00",
        "2h58",
        "2h56",
        "2h55",
        "2h53",
        "2h51",
        "2h50",
        "2h48",
        "2h47",
        "2h45"
      ],
      [
        "2h44",
        "2h42",
        "2h41",
        "2h40",
        "2h39",
        "2h37",
        "2h36",
        "2h35",
        "2h34",
        "2h34",
        "2h33",
        "2h32",
        "2h31",
        "2h31",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h30",
        "2h31",
        "2h31",
        "2h31",
        "2h32",
        "2h33",
        "2h33",
        "2h34",
        "2h35"
      ],
      [
        "2h36",
        "2h37",
        "2h38",
        "2h40",
        "2h41",
        "2h42",
        "2h44",
        "2h45",
        "2h47",
        "2h48",
        "2h50",
        "2h51",
        "2h53",
        "2h55",
        "2h56",
        "2h58",
        "3h00",
        "3h02",
        "3h04",
        "3h06",
        "3h08",
        "3h10",
        "3h11",
        "3h13",
        "3h15",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27"
      ],
      [
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h45",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h54",
        "3h56",
        "3h58",
        "4h00",
        "4h02",
        "4h04",
        "4h05",
        "4h07",
        "4h09",
        "4h11",
        "4h13",
        "4h14",
        "4h16",
        "4h18",
        "4h19",
        "4h21",
        "4h23",
        "4h24"
      ],
      [
        "4h26",
        "4h28",
        "4h29",
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h45",
        "4h46",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h54",
        "4h55",
        "4h56",
        "4h58",
        "4h59",
        "5h01",
        "5h02",
        "5h03",
        "5h05",
        "5h06",
        "5h07",
        "5h09"
      ],
      [
        "5h10",
        "5h12",
        "5h13",
        "5h14",
        "5h15",
        "5h17",
        "5h18",
        "5h19",
        "5h20",
        "5h22",
        "5h23",
        "5h24",
        "5h26",
        "5h27",
        "5h28",
        "5h29",
        "5h31",
        "5h32",
        "5h33",
        "5h34",
        "5h36",
        "5h37",
        "5h38",
        "5h39",
        "5h41",
        "5h42",
        "5h43",
        "5h44",
        "5h46",
        "5h47",
        "5h49"
      ],
      [
        "5h50",
        "5h51",
        "5h53",
        "5h54",
        "5h56",
        "5h57",
        "5h58",
        "6h00",
        "6h01",
        "6h03",
        "6h04",
        "6h05",
        "6h07",
        "6h08",
        "6h09",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h21",
        "6h22",
        "6h23",
        "6h24",
        "6h25",
        "6h27",
        "6h28"
      ],
      [
        "6h29",
        "6h30",
        "6h31",
        "6h32",
        "6h33",
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h42",
        "6h43",
        "6h44",
        "6h44",
        "6h45",
        "6h45",
        "6h46",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h48",
        "6h48",
        "6h48",
        "6h49",
        "6h49"
      ]
    ]
  },
  {
    "city": "poitiers",
    "latitude": 46.583920772572576,
    "longitude": 0.35994765300316445,
    "times": [
      [
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h54",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h52",
        "6h52",
        "6h52",
        "6h51",
        "6h51",
        "6h50",
        "6h50",
        "6h49",
        "6h49",
        "6h48",
        "6h47",
        "6h46",
        "6h46",
        "6h45",
        "6h44",
        "6h43",
        "6h42",
        "6h41",
        "6h40"
      ],
      [
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h35",
        "6h34",
        "6h33",
        "6h31",
        "6h30",
        "6h29",
        "6h27",
        "6h26",
        "6h25",
        "6h23",
        "6h22",
        "6h20",
        "6h19",
        "6h18",
        "6h16",
        "6h15",
        "6h13",
        "6h11",
        "6h10",
        "6h08",
        "6h07",
        "6h05",
        "6h03",
        "6h02",
        "6h01"
      ],
      [
        "6h00",
        "5h58",
        "5h56",
        "5h55",
        "5h53",
        "5h51",
        "5h49",
        "5h47",
        "5h45",
        "5h44",
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h13",
        "5h11",
        "5h09",
        "5h07",
        "5h05",
        "5h03",
        "5h01"
      ],
      [
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h47",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h36",
        "4h34",
        "4h32",
        "4h30",
        "4h27",
        "4h25",
        "4h23",
        "4h21",
        "4h18",
        "4h16",
        "4h14",
        "4h12",
        "4h09",
        "4h07",
        "4h05",
        "4h03",
        "4h00",
        "3h58",
        "3h56",
        "3h54"
      ],
      [
        "3h51",
        "3h49",
        "3h47",
        "3h45",
        "3h43",
        "3h40",
        "3h38",
        "3h36",
        "3h34",
        "3h32",
        "3h30",
        "3h28",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h18",
        "3h16",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h06",
        "3h04",
        "3h03",
        "3h01",
        "2h59",
        "2h58",
        "2h56",
        "2h55",
        "2h53"
      ],
      [
        "2h52",
        "2h50",
        "2h49",
        "2h48",
        "2h47",
        "2h45",
        "2h44",
        "2h43",
        "2h43",
        "2h42",
        "2h41",
        "2h40",
        "2h40",
        "2h39",
        "2h39",
        "2h38",
        "2h38",
        "2h38",
        "2h38",
        "2h38",
        "2h38",
        "2h38",
        "2h39",
        "2h39",
        "2h40",
        "2h40",
        "2h41",
        "2h42",
        "2h42",
        "2h43"
      ],
      [
        "2h44",
        "2h45",
        "2h46",
        "2h48",
        "2h49",
        "2h50",
        "2h52",
        "2h53",
        "2h55",
        "2h56",
        "2h58",
        "2h59",
        "3h01",
        "3h03",
        "3h05",
        "3h06",
        "3h08",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h35"
      ],
      [
        "3h37",
        "3h39",
        "3h41",
        "3h43",
        "3h45",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h01",
        "4h02",
        "4h04",
        "4h06",
        "4h08",
        "4h10",
        "4h12",
        "4h14",
        "4h15",
        "4h17",
        "4h19",
        "4h21",
        "4h22",
        "4h24",
        "4h26",
        "4h28",
        "4h29",
        "4h31",
        "4h33"
      ],
      [
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h47",
        "4h48",
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h56",
        "4h57",
        "4h59",
        "5h00",
        "5h02",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h09",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h17"
      ],
      [
        "5h18",
        "5h19",
        "5h21",
        "5h22",
        "5h23",
        "5h25",
        "5h26",
        "5h27",
        "5h29",
        "5h30",
        "5h31",
        "5h32",
        "5h34",
        "5h35",
        "5h36",
        "5h37",
        "5h39",
        "5h40",
        "5h41",
        "5h43",
        "5h44",
        "5h45",
        "5h46",
        "5h48",
        "5h50",
        "5h51",
        "5h53",
        "5h54",
        "5h55",
        "5h56",
        "5h56"
      ],
      [
        "5h58",
        "5h59",
        "6h00",
        "6h02",
        "6h03",
        "6h04",
        "6h05",
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h17",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h23",
        "6h24",
        "6h25",
        "6h26",
        "6h27",
        "6h28",
        "6h29",
        "6h31",
        "6h32",
        "6h33"
      ],
      [
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h39",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h43",
        "6h44",
        "6h45",
        "6h45",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h49",
        "6h49",
        "6h50",
        "6h50",
        "6h51",
        "6h51",
        "6h52",
        "6h52",
        "6h52",
        "6h53",
        "6h53",
        "6h53",
        "6h53"
      ]
    ]
  },
  {
    "city": "rouen",
    "latitude": 49.44134601033831,
    "longitude": 1.0925678427798247,
    "times": [
      [
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h55",
        "6h54",
        "6h54",
        "6h54",
        "6h53",
        "6h53",
        "6h53",
        "6h52",
        "6h52",
        "6h51",
        "6h50",
        "6h50",
        "6h49",
        "6h48",
        "6h48",
        "6h47",
        "6h46",
        "6h45",
        "6h44",
        "6h43",
        "6h42",
        "6h41",
        "6h40",
        "6h39"
      ],
      [
        "6h38",
        "6h37",
        "6h36",
        "6h34",
        "6h33",
        "6h32",
        "6h30",
        "6h29",
        "6h28",
        "6h26",
        "6h25",
        "6h23",
        "6h22",
        "6h20",
        "6h19",
        "6h17",
        "6h16",
        "6h14",
        "6h13",
        "6h11",
        "6h10",
        "6h08",
        "6h07",
        "6h05",
        "6h04",
        "6h02",
        "6h00",
        "5h59",
        "5h58"
      ],
      [
        "5h57",
        "5h55",
        "5h53",
        "5h52",
        "5h50",
        "5h48",
        "5h46",
        "5h44",
        "5h42",
        "5h40",
        "5h39",
        "5h37",
        "5h35",
        "5h33",
        "5h31",
        "5h29",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h17",
        "5h15",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h04",
        "5h02",
        "5h00",
        "4h57"
      ],
      [
        "4h55",
        "4h53",
        "4h51",
        "4h49",
        "4h47",
        "4h44",
        "4h42",
        "4h40",
        "4h38",
        "4h35",
        "4h33",
        "4h31",
        "4h29",
        "4h26",
        "4h24",
        "4h22",
        "4h20",
        "4h17",
        "4h15",
        "4h13",
        "4h11",
        "4h08",
        "4h06",
        "4h04",
        "4h02",
        "3h59",
        "3h57",
        "3h55",
        "3h53",
        "3h51"
      ],
      [
        "3h48",
        "3h46",
        "3h44",
        "3h42",
        "3h40",
        "3h37",
        "3h35",
        "3h33",
        "3h31",
        "3h29",
        "3h27",
        "3h25",
        "3h23",
        "3h21",
        "3h18",
        "3h16",
        "3h14",
        "3h13",
        "3h11",
        "3h09",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "3h00",
        "2h58",
        "2h56",
        "2h55",
        "2h53",
        "2h52",
        "2h50"
      ],
      [
        "2h49",
        "2h47",
        "2h46",
        "2h45",
        "2h43",
        "2h42",
        "2h41",
        "2h40",
        "2h39",
        "2h39",
        "2h38",
        "2h37",
        "2h37",
        "2h36",
        "2h36",
        "2h35",
        "2h35",
        "2h35",
        "2h35",
        "2h35",
        "2h35",
        "2h35",
        "2h36",
        "2h36",
        "2h36",
        "2h37",
        "2h38",
        "2h38",
        "2h39",
        "2h40"
      ],
      [
        "2h41",
        "2h42",
        "2h43",
        "2h45",
        "2h46",
        "2h47",
        "2h49",
        "2h50",
        "2h51",
        "2h53",
        "2h55",
        "2h56",
        "2h58",
        "3h00",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h09",
        "3h11",
        "3h13",
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24",
        "3h26",
        "3h28",
        "3h30",
        "3h32"
      ],
      [
        "3h34",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h52",
        "3h54",
        "3h56",
        "3h57",
        "3h59",
        "4h01",
        "4h03",
        "4h05",
        "4h07",
        "4h09",
        "4h10",
        "4h12",
        "4h14",
        "4h16",
        "4h18",
        "4h19",
        "4h21",
        "4h23",
        "4h24",
        "4h26",
        "4h28",
        "4h29"
      ],
      [
        "4h31",
        "4h33",
        "4h34",
        "4h36",
        "4h37",
        "4h39",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h47",
        "4h48",
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h56",
        "4h57",
        "4h58",
        "5h00",
        "5h01",
        "5h03",
        "5h04",
        "5h05",
        "5h07",
        "5h08",
        "5h10",
        "5h11",
        "5h12",
        "5h14"
      ],
      [
        "5h15",
        "5h16",
        "5h18",
        "5h19",
        "5h20",
        "5h22",
        "5h23",
        "5h24",
        "5h25",
        "5h27",
        "5h28",
        "5h29",
        "5h31",
        "5h32",
        "5h33",
        "5h34",
        "5h36",
        "5h37",
        "5h38",
        "5h39",
        "5h41",
        "5h42",
        "5h43",
        "5h44",
        "5h46",
        "5h47",
        "5h48",
        "5h49",
        "5h51",
        "5h52",
        "5h54"
      ],
      [
        "5h55",
        "5h57",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h04",
        "6h05",
        "6h06",
        "6h08",
        "6h09",
        "6h11",
        "6h12",
        "6h13",
        "6h15",
        "6h16",
        "6h17",
        "6h19",
        "6h20",
        "6h21",
        "6h23",
        "6h24",
        "6h25",
        "6h26",
        "6h27",
        "6h29",
        "6h30",
        "6h31",
        "6h32",
        "6h33"
      ],
      [
        "6h34",
        "6h36",
        "6h37",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h43",
        "6h43",
        "6h44",
        "6h45",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h49",
        "6h50",
        "6h50",
        "6h51",
        "6h51",
        "6h52",
        "6h52",
        "6h53",
        "6h53",
        "6h53",
        "6h54",
        "6h54",
        "6h54",
        "6h55",
        "6h55"
      ]
    ]
  },
  {
    "city": "strasbourg",
    "latitude": 48.571267984911756,
    "longitude": 7.767526795169564,
    "times": [
      [
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h27",
        "6h26",
        "6h26",
        "6h26",
        "6h26",
        "6h25",
        "6h25",
        "6h24",
        "6h24",
        "6h23",
        "6h23",
        "6h22",
        "6h22",
        "6h21",
        "6h20",
        "6h19",
        "6h19",
        "6h18",
        "6h17",
        "6h16",
        "6h15",
        "6h14",
        "6h13",
        "6h12"
      ],
      [
        "6h11",
        "6h10",
        "6h09",
        "6h07",
        "6h06",
        "6h05",
        "6h04",
        "6h02",
        "6h01",
        "5h59",
        "5h58",
        "5h57",
        "5h55",
        "5h54",
        "5h52",
        "5h51",
        "5h49",
        "5h48",
        "5h46",
        "5h45",
        "5h43",
        "5h42",
        "5h40",
        "5h39",
        "5h37",
        "5h35",
        "5h34",
        "5h32",
        "5h31"
      ],
      [
        "5h30",
        "5h28",
        "5h27",
        "5h25",
        "5h23",
        "5h21",
        "5h19",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h04",
        "5h02",
        "5h00",
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h48",
        "4h46",
        "4h44",
        "4h42",
        "4h39",
        "4h37",
        "4h35",
        "4h33",
        "4h31"
      ],
      [
        "4h29",
        "4h27",
        "4h24",
        "4h22",
        "4h20",
        "4h18",
        "4h16",
        "4h13",
        "4h11",
        "4h09",
        "4h07",
        "4h04",
        "4h02",
        "4h00",
        "3h58",
        "3h55",
        "3h53",
        "3h51",
        "3h49",
        "3h46",
        "3h44",
        "3h42",
        "3h40",
        "3h37",
        "3h35",
        "3h33",
        "3h31",
        "3h28",
        "3h26",
        "3h24"
      ],
      [
        "3h22",
        "3h20",
        "3h17",
        "3h15",
        "3h13",
        "3h11",
        "3h09",
        "3h06",
        "3h04",
        "3h02",
        "3h00",
        "2h58",
        "2h56",
        "2h54",
        "2h52",
        "2h50",
        "2h48",
        "2h46",
        "2h44",
        "2h42",
        "2h40",
        "2h38",
        "2h37",
        "2h35",
        "2h33",
        "2h31",
        "2h30",
        "2h28",
        "2h26",
        "2h25",
        "2h23"
      ],
      [
        "2h22",
        "2h21",
        "2h19",
        "2h18",
        "2h17",
        "2h16",
        "2h15",
        "2h14",
        "2h13",
        "2h12",
        "2h11",
        "2h11",
        "2h10",
        "2h09",
        "2h09",
        "2h09",
        "2h08",
        "2h08",
        "2h08",
        "2h08",
        "2h08",
        "2h09",
        "2h09",
        "2h09",
        "2h10",
        "2h10",
        "2h11",
        "2h12",
        "2h13",
        "2h13"
      ],
      [
        "2h14",
        "2h16",
        "2h17",
        "2h18",
        "2h19",
        "2h20",
        "2h22",
        "2h23",
        "2h25",
        "2h26",
        "2h28",
        "2h30",
        "2h31",
        "2h33",
        "2h35",
        "2h37",
        "2h38",
        "2h40",
        "2h42",
        "2h44",
        "2h46",
        "2h48",
        "2h50",
        "2h52",
        "2h54",
        "2h56",
        "2h58",
        "3h00",
        "3h02",
        "3h04",
        "3h06"
      ],
      [
        "3h07",
        "3h09",
        "3h11",
        "3h13",
        "3h15",
        "3h17",
        "3h19",
        "3h21",
        "3h23",
        "3h25",
        "3h27",
        "3h29",
        "3h31",
        "3h33",
        "3h35",
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h47",
        "3h49",
        "3h51",
        "3h53",
        "3h54",
        "3h56",
        "3h58",
        "3h59",
        "4h01",
        "4h03"
      ],
      [
        "4h04",
        "4h06",
        "4h08",
        "4h09",
        "4h11",
        "4h12",
        "4h14",
        "4h16",
        "4h17",
        "4h19",
        "4h20",
        "4h22",
        "4h23",
        "4h25",
        "4h26",
        "4h27",
        "4h29",
        "4h30",
        "4h32",
        "4h33",
        "4h35",
        "4h36",
        "4h37",
        "4h39",
        "4h40",
        "4h42",
        "4h43",
        "4h44",
        "4h46",
        "4h47"
      ],
      [
        "4h48",
        "4h50",
        "4h51",
        "4h52",
        "4h54",
        "4h55",
        "4h56",
        "4h57",
        "4h59",
        "5h00",
        "5h01",
        "5h03",
        "5h04",
        "5h05",
        "5h06",
        "5h08",
        "5h09",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15",
        "5h16",
        "5h18",
        "5h20",
        "5h21",
        "5h23",
        "5h24",
        "5h26",
        "5h27",
        "5h27"
      ],
      [
        "5h28",
        "5h30",
        "5h31",
        "5h32",
        "5h34",
        "5h35",
        "5h37",
        "5h38",
        "5h49",
        "5h41",
        "5h42",
        "5h43",
        "5h45",
        "5h46",
        "5h47",
        "5h49",
        "5h50",
        "5h51",
        "5h52",
        "5h54",
        "5h55",
        "5h56",
        "5h57",
        "5h59",
        "6h00",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h06"
      ],
      [
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h11",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h19",
        "6h20",
        "6h21",
        "6h21",
        "6h22",
        "6h23",
        "6h23",
        "6h24",
        "6h24",
        "6h25",
        "6h25",
        "6h25",
        "6h26",
        "6h26",
        "6h26",
        "6h26",
        "6h27",
        "6h27"
      ]
    ]
  },
  {
    "city": "toulouse",
    "latitude": 43.59638143032458,
    "longitude": 1.4316729336369596,
    "times": [
      [
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h45",
        "6h44",
        "6h44",
        "6h44",
        "6h44",
        "6h43",
        "6h43",
        "6h42",
        "6h42",
        "6h42",
        "6h41",
        "6h40",
        "6h40",
        "6h39",
        "6h39",
        "6h38",
        "6h37",
        "6h36",
        "6h36",
        "6h35",
        "6h34"
      ],
      [
        "6h33",
        "6h32",
        "6h31",
        "6h30",
        "6h29",
        "6h28",
        "6h27",
        "6h26",
        "6h25",
        "6h24",
        "6h22",
        "6h21",
        "6h20",
        "6h19",
        "6h17",
        "6h16",
        "6h15",
        "6h13",
        "6h12",
        "6h10",
        "6h09",
        "6h08",
        "6h06",
        "6h04",
        "6h03",
        "6h01",
        "6h00",
        "5h58",
        "5h58"
      ],
      [
        "5h57",
        "5h55",
        "5h53",
        "5h51",
        "5h50",
        "5h48",
        "5h46",
        "5h45",
        "5h43",
        "5h41",
        "5h39",
        "5h37",
        "5h35",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h04",
        "5h02",
        "5h00"
      ],
      [
        "4h58",
        "4h56",
        "4h54",
        "4h52",
        "4h50",
        "4h47",
        "4h45",
        "4h43",
        "4h41",
        "4h39",
        "4h37",
        "4h35",
        "4h33",
        "4h31",
        "4h28",
        "4h26",
        "4h24",
        "4h22",
        "4h20",
        "4h18",
        "4h16",
        "4h14",
        "4h11",
        "4h09",
        "4h07",
        "4h05",
        "4h03",
        "4h01",
        "3h59",
        "3h57"
      ],
      [
        "3h55",
        "3h53",
        "3h51",
        "3h49",
        "3h47",
        "3h45",
        "3h43",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h33",
        "3h31",
        "3h29",
        "3h28",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h19",
        "3h17",
        "3h15",
        "3h14",
        "3h12",
        "3h11",
        "3h09",
        "3h08",
        "3h06",
        "3h05",
        "3h04",
        "3h03"
      ],
      [
        "3h01",
        "3h00",
        "2h59",
        "2h58",
        "2h57",
        "2h56",
        "2h55",
        "2h54",
        "2h54",
        "2h53",
        "2h52",
        "2h52",
        "2h51",
        "2h51",
        "2h51",
        "2h50",
        "2h50",
        "2h50",
        "2h50",
        "2h50",
        "2h50",
        "2h51",
        "2h51",
        "2h51",
        "2h52",
        "2h52",
        "2h53",
        "2h53",
        "2h54",
        "2h55"
      ],
      [
        "2h56",
        "2h57",
        "2h58",
        "2h59",
        "3h00",
        "3h01",
        "3h02",
        "3h04",
        "3h05",
        "3h06",
        "3h08",
        "3h09",
        "3h10",
        "3h12",
        "3h14",
        "3h15",
        "3h17",
        "3h18",
        "3h20",
        "3h22",
        "3h23",
        "3h25",
        "3h27",
        "3h28",
        "3h30",
        "3h32",
        "3h34",
        "3h36",
        "3h37",
        "3h39",
        "3h41"
      ],
      [
        "3h43",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h52",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h00",
        "4h02",
        "4h04",
        "4h06",
        "4h07",
        "4h09",
        "4h11",
        "4h12",
        "4h14",
        "4h16",
        "4h17",
        "4h19",
        "4h21",
        "4h22",
        "4h24",
        "4h25",
        "4h27",
        "4h29",
        "4h30",
        "4h32",
        "4h33"
      ],
      [
        "4h35",
        "4h36",
        "4h38",
        "4h39",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h47",
        "4h48",
        "4h49",
        "4h51",
        "4h52",
        "4h54",
        "4h55",
        "4h56",
        "4h58",
        "4h59",
        "5h00",
        "5h02",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h08",
        "5h09",
        "5h11",
        "5h12",
        "5h13",
        "5h14"
      ],
      [
        "5h16",
        "5h17",
        "5h18",
        "5h19",
        "5h21",
        "5h22",
        "5h23",
        "5h24",
        "5h25",
        "5h27",
        "5h28",
        "5h29",
        "5h30",
        "5h31",
        "5h33",
        "5h34",
        "5h35",
        "5h36",
        "5h37",
        "5h39",
        "5h40",
        "5h41",
        "5h42",
        "5h43",
        "6h44",
        "5h46",
        "5h47",
        "5h48",
        "5h49",
        "5h50",
        "5h51"
      ],
      [
        "5h53",
        "5h54",
        "5h55",
        "5h56",
        "5h57",
        "5h58",
        "6h00",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h05",
        "6h06",
        "6h07",
        "6h08",
        "6h09",
        "6h10",
        "6h12",
        "6h13",
        "6h14",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h19",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h24"
      ],
      [
        "6h25",
        "6h26",
        "6h27",
        "6h28",
        "6h29",
        "6h30",
        "6h31",
        "6h32",
        "6h32",
        "6h33",
        "6h34",
        "6h35",
        "6h36",
        "6h36",
        "6h37",
        "6h38",
        "6h38",
        "6h39",
        "6h39",
        "6h40",
        "6h41",
        "6h41",
        "6h42",
        "6h42",
        "6h42",
        "6h43",
        "6h43",
        "6h44",
        "6h44",
        "6h44",
        "6h44"
      ]
    ]
  },
  {
    "city": "tours",
    "latitude": 47.39863822805879,
    "longitude": 0.6965263764166114,
    "times": [
      [
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h53",
        "6h52",
        "6h52",
        "6h52",
        "6h51",
        "6h51",
        "6h50",
        "6h50",
        "6h49",
        "6h49",
        "6h48",
        "6h47",
        "6h47",
        "6h46",
        "6h45",
        "6h44",
        "6h43",
        "6h42",
        "6h41",
        "6h40",
        "6h39"
      ],
      [
        "6h38",
        "6h37",
        "6h36",
        "6h35",
        "6h34",
        "6h33",
        "6h31",
        "6h30",
        "6h29",
        "6h27",
        "6h26",
        "6h25",
        "6h23",
        "6h22",
        "6h20",
        "6h19",
        "6h17",
        "6h16",
        "6h15",
        "6h13",
        "6h12",
        "6h10",
        "6h08",
        "6h07",
        "6h05",
        "6h04",
        "6h02",
        "6h00",
        "5h59"
      ],
      [
        "5h58",
        "5h57",
        "5h55",
        "5h53",
        "5h51",
        "5h50",
        "5h48",
        "5h46",
        "5h44",
        "5h42",
        "5h40",
        "5h38",
        "5h36",
        "5h34",
        "5h32",
        "5h30",
        "5h28",
        "5h26",
        "5h24",
        "5h22",
        "5h20",
        "5h18",
        "5h16",
        "5h14",
        "5h12",
        "5h10",
        "5h08",
        "5h06",
        "5h03",
        "5h01",
        "4h59"
      ],
      [
        "4h57",
        "4h55",
        "4h53",
        "4h50",
        "4h48",
        "4h46",
        "4h44",
        "4h42",
        "4h39",
        "4h37",
        "4h35",
        "4h33",
        "4h30",
        "4h28",
        "4h26",
        "4h24",
        "4h21",
        "4h19",
        "4h17",
        "4h15",
        "4h12",
        "4h10",
        "4h08",
        "4h06",
        "4h03",
        "4h01",
        "3h59",
        "3h57",
        "3h54",
        "3h52"
      ],
      [
        "3h50",
        "3h48",
        "3h46",
        "3h43",
        "3h41",
        "3h39",
        "3h37",
        "3h35",
        "3h33",
        "3h30",
        "3h28",
        "3h26",
        "3h24",
        "3h22",
        "3h20",
        "3h18",
        "3h16",
        "3h14",
        "3h12",
        "3h10",
        "3h08",
        "3h07",
        "3h05",
        "3h03",
        "3h01",
        "3h00",
        "2h58",
        "2h56",
        "2h55",
        "2h53",
        "2h52"
      ],
      [
        "2h50",
        "2h49",
        "2h48",
        "2h46",
        "2h45",
        "2h44",
        "2h43",
        "2h42",
        "2h41",
        "2h40",
        "2h39",
        "2h39",
        "2h38",
        "2h38",
        "2h37",
        "2h37",
        "2h37",
        "2h36",
        "2h36",
        "2h36",
        "2h37",
        "2h37",
        "2h37",
        "2h38",
        "2h38",
        "2h39",
        "2h39",
        "2h40",
        "2h41",
        "2h42"
      ],
      [
        "2h43",
        "2h44",
        "2h45",
        "2h46",
        "2h47",
        "2h49",
        "2h50",
        "2h52",
        "2h53",
        "2h55",
        "2h56",
        "2h58",
        "3h00",
        "3h01",
        "3h03",
        "3h05",
        "3h07",
        "3h08",
        "3h10",
        "3h12",
        "3h14",
        "3h16",
        "3h18",
        "3h20",
        "3h22",
        "3h24",
        "3h26",
        "3h28",
        "3h30",
        "3h32",
        "3h34"
      ],
      [
        "3h36",
        "3h38",
        "3h40",
        "3h42",
        "3h44",
        "3h46",
        "3h48",
        "3h50",
        "3h51",
        "3h53",
        "3h55",
        "3h57",
        "3h59",
        "4h01",
        "4h03",
        "4h05",
        "4h07",
        "4h08",
        "4h10",
        "4h12",
        "4h14",
        "4h16",
        "4h17",
        "4h19",
        "4h21",
        "4h23",
        "4h24",
        "4h26",
        "4h28",
        "4h29",
        "4h31"
      ],
      [
        "4h33",
        "4h34",
        "4h36",
        "4h38",
        "4h39",
        "4h41",
        "4h42",
        "4h44",
        "4h45",
        "4h47",
        "4h48",
        "4h50",
        "4h51",
        "4h53",
        "4h54",
        "4h56",
        "4h57",
        "4h59",
        "5h00",
        "5h02",
        "5h03",
        "5h04",
        "5h06",
        "5h07",
        "5h08",
        "5h10",
        "5h11",
        "5h13",
        "5h14",
        "5h15"
      ],
      [
        "5h17",
        "5h18",
        "5h19",
        "5h21",
        "5h22",
        "5h23",
        "5h24",
        "5h26",
        "5h27",
        "5h28",
        "5h30",
        "5h31",
        "5h32",
        "5h33",
        "5h35",
        "5h36",
        "5h37",
        "5h38",
        "5h40",
        "5h41",
        "5h42",
        "5h43",
        "5h45",
        "5h46",
        "5h48",
        "5h50",
        "5h51",
        "5h52",
        "5h54",
        "5h55",
        "5h55"
      ],
      [
        "5h56",
        "5h58",
        "5h59",
        "6h01",
        "6h02",
        "6h03",
        "6h04",
        "6h06",
        "6h07",
        "6h08",
        "6h10",
        "6h11",
        "6h12",
        "6h13",
        "6h15",
        "6h16",
        "6h17",
        "6h18",
        "6h20",
        "6h21",
        "6h22",
        "6h23",
        "6h24",
        "6h26",
        "6h27",
        "6h28",
        "6h29",
        "6h30",
        "6h31",
        "6h32"
      ],
      [
        "6h33",
        "6h34",
        "6h35",
        "6h36",
        "6h37",
        "6h38",
        "6h39",
        "6h40",
        "6h41",
        "6h42",
        "6h43",
        "6h44",
        "6h44",
        "6h45",
        "6h46",
        "6h47",
        "6h47",
        "6h48",
        "6h48",
        "6h49",
        "6h50",
        "6h50",
        "6h51",
        "6h51",
        "6h51",
        "6h52",
        "6h52",
        "6h52",
        "6h53",
        "6h53",
        "6h53"
      ]
    ]
  }
];

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
