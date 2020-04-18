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
const zonesJson = fs.readFileSync('../time-zone-data/zones.json');
const zones = JSON.parse(zonesJson);

function icsString(timeZoneId, icsData) {
    return `BEGIN:VCALENDAR\r\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\r\nVERSION:2.0\r\nBEGIN:VTIMEZONE\r\nTZID:${timeZoneId}\r\nX-LIC-LOCATION:${timeZoneId}\r\n${icsData}\r\nEND:VTIMEZONE\r\nEND:VCALENDAR`;
}

const out = {};
Object.keys(zones.zones).forEach((timeZoneId) => {
    var icsData = zones.zones[timeZoneId].ics.join("\r\n");
    out[timeZoneId] = icsString(timeZoneId,icsData);
    //fs.writeFileSync('../time-zone-data/zones-compiled.json', JSON.stringify(out));

});

Object.keys(zones.aliases).forEach((timeZoneId) => {
  var previousAliasTo = zones.aliases[timeZoneId].aliasTo,
        nextAliasTo,
        icsData;
  while(zones.aliases[previousAliasTo] && (nextAliasTo = zones.aliases[previousAliasTo].aliasTo)) {
    previousAliasTo = nextAliasTo;
  }
  if (zones.zones[previousAliasTo]) {
    icsData = zones.zones[previousAliasTo].ics.join("\r\n");
    out[timeZoneId] = icsString(timeZoneId,icsData);
  } else {
    console.warn(`${previousAliasTo} (${timeZoneId}) not found, skipping`);
  }
});

fs.writeFileSync('../time-zone-data/zones-compiled.json', JSON.stringify(out));
