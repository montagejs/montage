'use strict';

/*
    From https://github.com/mifi/ical-expander/

    MIT License

    Copyright (c) 2016 Mikael Finstad

*/


/*
    zones.js from Mozilla when written:

    "America/New_York": {
      "ics": "BEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nBEGIN:DAYLIGHT\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nTZNAME:EDT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\nEND:DAYLIGHT\r\nBEGIN:STANDARD\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nTZNAME:EST\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\nEND:STANDARD\r\nEND:VTIMEZONE",
      "latitude": "+0404251",
      "longitude": "-0740023"
    },

    zones.js from Mozilla now:

    "America/New_York": {
      "ics": [
        "BEGIN:DAYLIGHT\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nTZNAME:EDT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\nEND:DAYLIGHT",
        "BEGIN:STANDARD\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nTZNAME:EST\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\nEND:STANDARD"
      ],
      "latitude": "+0404251",
      "longitude": "-0740023"
    },


            "BEGIN:DAYLIGHT
            TZOFFSETFROM:-0500
            TZOFFSETTO:-0400
            TZNAME:EDT
            DTSTART:19700308T020000
            RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
            END:DAYLIGHT"

            "BEGIN:STANDARD
            TZOFFSETFROM:-0400
            TZOFFSETTO:-0500
            TZNAME:EST
            DTSTART:19701101T020000
            RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
            END:STANDARD"




    what ical.js expects:
    New_York.ics:
        BEGIN:VCALENDAR
        PRODID:-//tzurl.org//NONSGML Olson 2012h//EN
        VERSION:2.0
        BEGIN:VTIMEZONE
        TZID:America/New_York
        X-LIC-LOCATION:America/New_York
        BEGIN:DAYLIGHT
        TZOFFSETFROM:-0500
        TZOFFSETTO:-0400
        TZNAME:EDT
        DTSTART:19700308T020000
        RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
        END:DAYLIGHT
        BEGIN:STANDARD
        TZOFFSETFROM:-0400
        TZOFFSETTO:-0500
        TZNAME:EST
        DTSTART:19701101T020000
        RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
        END:STANDARD
        END:VTIMEZONE
        END:VCALENDAR


/*
parsed = ICAL.parse(`BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\nBEGIN:VTIMEZONE\nTZID:${timeZoneId}\nX-LIC-LOCATION:${timeZoneId}\n${icsData}/nEND:VTIMEZONE\nEND:VCALENDAR`),
*/


/* eslint-disable no-console */

const fs = require('fs');
// const zonesJson = fs.readFileSync('../time-zone-data/zones.json');
// var zones = JSON.parse(zonesJson);
var fetchedZones, fetchedZonesJSONString = "";
const https = require('https');

function writeFileSyncRecursive(filename, content, charset) {
  // -- normalize path separator to '/' instead of path.sep,
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g,'/');

  // -- preparation to allow absolute paths as well
  let root = '';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  }
  else if (filepath[1] === ':') {
    root = filepath.slice(0,3);   // c:\
    filepath = filepath.slice(3);
  }

  // -- create folders all the way down
  const folders = filepath.split('/').slice(0, -1);  // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath
    },
    root // first 'acc', important
  );

  // -- write file
  fs.writeFileSync(root + filepath, content, charset);
}



function icsString(timeZoneId, icsData, latitude, longitude) {
    var geo = "";
    if(latitude && longitude) {
        var latitudeDegrees = +latitude.substring(0,4),
            latitudeMinutes = +latitude.substring(4,6),
            latitudeSeconds = +latitude.substring(6,8),
            decimalLatitude = latitudeDegrees + latitudeMinutes/60 + latitudeSeconds/3600,
            longitudeDegrees = +longitude.substring(0,4),
            longitudeMinutes = +longitude.substring(4,6),
            longitudeSeconds = +longitude.substring(6,8),
            decimalongitude = longitudeDegrees + longitudeMinutes/60 + longitudeSeconds/3600;


        geo = `GEO:${decimalLatitude};${decimalongitude}\r\n`;
    }
    var _icsData = icsData ? `${icsData}\r\n` : "";
    return `BEGIN:VCALENDAR\r\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\r\nVERSION:2.0\r\nBEGIN:VTIMEZONE\r\nTZID:${timeZoneId}\r\nX-LIC-LOCATION:${timeZoneId}\r\n${_icsData}${geo}END:VTIMEZONE\r\nEND:VCALENDAR`;
}

function compileTimeZones(zones) {
    const out = {};
    Object.keys(zones.zones).forEach((timeZoneId) => {
        var timeZoneIdData = zones.zones[timeZoneId],
            icsData = timeZoneIdData.ics.join("\r\n"),
            singleOut = {};
        out[timeZoneId] = icsString(timeZoneId,icsData, timeZoneIdData.latitude, timeZoneIdData.longitude);
        singleOut[timeZoneId] = out[timeZoneId];

        //writeFileSyncRecursive('../time-zone-data/'+encodeURIComponent(timeZoneId)+'.json', JSON.stringify(singleOut));
        writeFileSyncRecursive('../time-zone-data/'+(timeZoneId)+'.json', JSON.stringify(singleOut));

    });

    Object.keys(zones.aliases).forEach((timeZoneId) => {
      var previousAliasTo = zones.aliases[timeZoneId].aliasTo,
            previousAliasToData,
            nextAliasTo,
            singleOut,
            icsData;
      while(zones.aliases[previousAliasTo] && (nextAliasTo = zones.aliases[previousAliasTo].aliasTo)) {
        previousAliasTo = nextAliasTo;
      }
      if ((previousAliasToData = zones.zones[previousAliasTo]) || previousAliasTo === "UTC") {
        icsData = previousAliasToData ? previousAliasToData.ics.join("\r\n") : null;
        out[timeZoneId] = icsString((icsData ? timeZoneId : previousAliasTo),icsData);

        singleOut = {};
        singleOut[timeZoneId] = out[timeZoneId];

        //writeFileSyncRecursive('../time-zone-data/'+encodeURIComponent(timeZoneId)+'.json', JSON.stringify(singleOut));
        writeFileSyncRecursive('../time-zone-data/'+(timeZoneId)+'.json', JSON.stringify(singleOut));
      } else {
        console.warn(`${previousAliasTo} (${timeZoneId}) not found, skipping`);
      }
    });

    fs.writeFileSync('../time-zone-data/zones-compiled.json', JSON.stringify(out));
};



//https://hg.mozilla.org/comm-central/raw-file/tip/calendar/timezones/zones.json
const options = {
  hostname: 'hg.mozilla.org',
  port: 443,
  path: '/comm-central/raw-file/tip/calendar/timezones/zones.json',
  method: 'GET'
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
        fetchedZonesJSONString += d;
    });

    res.on("end", () => {
        try {
            fetchedZones = JSON.parse(fetchedZonesJSONString);
            compileTimeZones(fetchedZones);
        } catch (error) {
            console.error(error.message);
            compileTimeZones(zones);
        };
    });
});

req.on('error', error => {
  console.error(error);
  compileTimeZones(zones);
});

req.end();



