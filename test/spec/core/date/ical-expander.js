'use strict';

/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

const fs = require('fs');
const IcalExpander = require('../');
const assert = require('assert');
const path = require('path');

// NOTE: Run with TZ=Etc/UTC mocha ical-parser.js
// https://github.com/mozilla-comm/ical.js/issues/257

const icaljsIssue257 = fs.readFileSync(path.join(__dirname, 'icaljs-issue-257.ics'), 'utf-8');
const icaljsIssue285 = fs.readFileSync(path.join(__dirname, 'icaljs-issue-285.ics'), 'utf-8');
const recurIcs = fs.readFileSync(path.join(__dirname, 'recur.ics'), 'utf-8');
const invalidDates = fs.readFileSync(path.join(__dirname, 'invalid_dates.ics'), 'utf-8');
const betweenTestCalendar = fs.readFileSync(path.join(__dirname, 'between_dates.ics'), 'utf-8');
const allDayEventCalendar = fs.readFileSync(path.join(__dirname, 'all-day.ics'), 'utf-8');

it('should show first date', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-07-24T00:00:00.000Z'), new Date('2016-07-26T00:00:00.000Z'));

  assert.equal(events.events[0].summary, 'Test-Event');
  assert.equal(events.occurrences.length, 0);
});

it('should show recurring modified date', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-07-31T00:00:00.000Z'), new Date('2016-08-02T00:00:00.000Z'));

  assert.equal(events.events[0].summary, 'Test-Event - Reccurence #2');
  assert.equal(events.occurrences.length, 0);
});

it('should show nothing at recurring exdate', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-08-07T00:00:00.000Z'), new Date('2016-08-10T00:00:00.000Z'));

  assert.equal(events.events.length, 0);
  assert.equal(events.occurrences.length, 0);
});

it('should parse issue 285 case correctly', function () {
  const events = new IcalExpander({ ics: icaljsIssue285 })
    .between(new Date('2017-01-03T00:00:00.000Z'), new Date('2017-01-25T00:00:00.000Z'));

  assert.deepEqual(events.events.map(e => e.startDate.toJSDate().toISOString()), ['2017-01-18T08:00:00.000Z']);
  assert.deepEqual(events.occurrences.map(e => e.startDate.toJSDate().toISOString()), [
    '2017-01-03T08:00:00.000Z',
    '2017-01-10T08:00:00.000Z',
    '2017-01-24T08:00:00.000Z',
  ]);
});

it('should parse all recurring events without going on forever', function () {
  const events = new IcalExpander({ ics: recurIcs })
    .all();

  const outEvents = events.events.map(e => ({ startDate: e.startDate, summary: e.summary }));
  const outOccurrences = events.occurrences.map(o => ({ startDate: o.startDate, summary: o.item.summary }));
  const allEvents = [].concat(outEvents, outOccurrences);

  assert.equal(allEvents.length, 1001);
});


it('should correctly parse an ical file with invalid start/end dates', function () {
  const events = new IcalExpander({ ics: invalidDates, skipInvalidDates: true })
    .all();

  const outEvents = events.events.map(e => ({ startDate: e.startDate, summary: e.summary }));
  const outOccurrences = events.occurrences.map(o => ({ startDate: o.startDate, summary: o.item.summary }));
  const allEvents = [].concat(outEvents, outOccurrences);

  assert.equal(allEvents.length, 2);
});

it('should include events that are partially between two dates', function () {
  const eventIdsBetween = ['3', '4', '5', '6', '7'];
  const occurrenceIdsBetween = ['8'];

  const events = new IcalExpander({ ics: betweenTestCalendar })
    .between(new Date('2018-05-02T00:00:00.000Z'), new Date('2018-05-02T23:59:59.999Z'));
  assert.equal(events.events.length, 5);
  assert.equal(events.occurrences.length, 1);

  events.events.forEach((event) => {
    assert.ok(
      eventIdsBetween.findIndex(id => id === event.uid) >= 0,
      `${event.uid} is not a valid event between provided dates`);
  });

  events.occurrences.forEach((occurrence) => {
    assert.ok(
      occurrenceIdsBetween.findIndex(id => id === occurrence.item.uid) >= 0,
      `${occurrence.item.uid} is not a valid occurrence between provided dates`);
  });
});

it('should support open ended limits', function () {
  const events = new IcalExpander({ ics: allDayEventCalendar, maxIterations: 10 })
    .between(new Date('2018-05-19T23:59:00.000Z'));

  assert.equal(events.events.length, 1);
  assert(events.events[0].summary === 'Non-repeating all day event');
  assert.equal(events.occurrences.length, 10);
  assert(events.occurrences.every(o => o.item.summary === 'Repeating all day event'));

  // events.events.forEach(e => console.log(e.summary, e.uid));
  // events.occurrences.forEach(o => console.log(o.item.summary, o.item.uid));
});
