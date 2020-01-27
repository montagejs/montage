require("montage/core/extras/date");

describe("core/date-spec", function () {

    it("should fallback on standard parse", function () {
        var sourceString = "Jul 8, 2005";
        var actual = new Date(Date.parse( sourceString ));
        var expected = new Date();
        expected.setFullYear(2005);
        expected.setMonth(7 - 1);
        expected.setDate(8);
        expected.setHours(0);
        expected.setMinutes(0);
        expected.setSeconds(0);
        expected.setMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'";
        expect(actual.toString()).toBe(expected.toString());
    });

    it("should parse basic UTC", function () {
        var sourceString = "2010-07-20T15:00:00Z";
        var resultDate = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'";
        expect(resultDate.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse basic local time", function () {
        var sourceString = "2010-07-20T15:00:00";
        var actual = Date.parse( sourceString );
        var expected = new Date(2010, 7-1 , 20, 15, 0, 0, 0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toString()).toBe(expected.toString());
    });


    it("should parse basic local time with zone", function () {
        var sourceString = "2010-07-20T15:00:00+08:00";
        var actual = Date.parse( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(7);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse abbreviate zone with no colon", function () {
        var sourceString = "2010-07-20T15:00:00+0800";
        var actual = Date.parse( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(7);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse abbreviate zone only hours", function () {
        var sourceString = "2010-07-20T15:00:00+08";
        var actual = Date.parse( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(7);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse abbreviate UTC no punctuation", function () {
        var sourceString = "20100720T150000Z";
        var resultDate = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(cresultDate.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse not case sensitive", function () {
        var sourceString = "20100720t150000z";
        var resultDate = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(resultDate.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse fractional seconds", function () {
        var sourceString = "2010-07-20T15:00:00.559Z";
        var actual = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(559);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse fractional seconds alternate separator", function () {
        var sourceString = "2010-07-20T15:00:00,559Z";
        var actual = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(559);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse UTC optional minutes", function () {
        var sourceString = "2010-07-20T15Z";
        var actual = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(0);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse UTC optional seconds", function () {
        var sourceString = "2010-07-20T15:30Z";
        var actual = Date.parseRFC3339( sourceString );
        var expected = new Date();
        expected.setUTCFullYear(2010);
        expected.setUTCMonth(7 - 1);
        expected.setUTCDate(20);
        expected.setUTCHours(15);
        expected.setUTCMinutes(30);
        expected.setUTCSeconds(0);
        expected.setUTCMilliseconds(0);
        //Error message: "incorrect conversion of: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse local time optional minutes", function () {
        var sourceString = "2010-07-20T15";
        var actual = Date.parse( sourceString );
        var expected = new Date(2010, 7-1 , 20, 15, 0, 0, 0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" );
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse local time optional seconds", function () {
        var sourceString = "2010-07-20T1530";
        var actual = Date.parse( sourceString );
        var expected = new Date(2010, 7-1 , 20, 15, 30, 0, 0);
        //Error message: "incorrect conversion of: '" + sourceString + "'" ;
        expect(actual.toUTCString()).toBe(expected.toUTCString());
    });

    it("should convert basic format UTC to string", function () {
        var expected = "2010-07-20T15:00:00Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(0);
        //Error message: "incorrect toRFC3339UTCString format" );
        expect(actual.toRFC3339UTCString()).toBe(expected);
    });

    it("should convert format UTC supress formating", function () {
        var expected = "20100720T150000Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(0);
        //Error message: "incorrect toRFC3339UTCString format" );
        expect(actual.toRFC3339UTCString(true)).toBe(expected);
    });

    it("should convert format UTC force formating", function () {
        var expected = "2010-07-20T15:00:00Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(0);
        //Error message: "incorrect toRFC3339UTCString format" );
        expect(actual.toRFC3339UTCString(false)).toBe(expected);
    });

    it("should convert format UTC supress formating and millis", function () {
        var expected = "20100720T150000Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(333);
        //Error message: "incorrect toRFC3339UTCString format" ;
        expect(actual.toRFC3339UTCString(true, true)).toBe(expected);
    });

    it("should convert format UTC force formating and millis", function () {
        var expected = "2010-07-20T15:00:00.333Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(333);
        //Error message: "incorrect toRFC3339UTCString format" ;
        expect(actual.toRFC3339UTCString(false, false)).toBe(expected);
    });

    it("should convert format UTC supress formating and force millis", function () {
        var expected = "20100720T150000.333Z";
        var actual = new Date();
        actual.setUTCFullYear(2010);
        actual.setUTCMonth(7 - 1);
        actual.setUTCDate(20);
        actual.setUTCHours(15);
        actual.setUTCMinutes(0);
        actual.setUTCSeconds(0);
        actual.setUTCMilliseconds(333);
        //Error message: "incorrect toRFC3339UTCString format" ;
        expect(actual.toRFC3339UTCString(true, false)).toBe(expected);
    });

    it("should convert basic format local", function () {
        // it is a bit tricky to test this in a way that works in any time zone,
        // so we are testing that parsing the formated date should get you back the original date
        var expected = new Date(2010, 7-1 , 20, 15, 0, 0, 0);
        var resultLocal = expected.toRFC3339LocaleString();
        var resultReconstituted = Date.parse( resultLocal );
        //Error message: "incorrect toRFC3339LocaleString format" );
        expect(resultReconstituted.toUTCString()).toBe(expected.toUTCString());
    });

    it("should parse day out of bounds", function () {
        /* case:
        * if today to 31st, the month to be parsed
        * doesnt have the 31st day, it rolls over to the next month
        */

        //ref old date
        var _Date = window.Date;

        //date mock
        window.Date =  function(){
            if (arguments.length){
            //pass arguments through
            return new _Date(arguments);
            } else {
            //force today to be...
            return new _Date(2012, 0, 31, 15, 0, 0, 0);
            }
        }

        Date.parseRFC3339 = _Date.parseRFC3339;
        Date.parse = _Date.parse;

        //sourceString's month doesnt have a 31st
        var sourceString = "2012-04-31T23:30:00Z";
        var actual = Date.parseRFC3339( sourceString );

        var expected = new Date(0);
        var year = 2012;
        var mon = 4;
        var day = 1;
        var hour = 23;
        var mins = 30;
        var secs = 0;
        var millis = 0;

        //set utc
        expected.setUTCFullYear(year);
        expected.setUTCMonth(mon);
        expected.setUTCDate(day);
        expected.setUTCHours(hour);
        expected.setUTCMinutes(mins);
        expected.setUTCSeconds(secs);
        expected.setUTCMilliseconds(millis);

        //Error message: "datejs parse method probably not invoked correctly to convert: '" + sourceString + "'" );
        expect(actual.toUTCString()).toBe(expected.toUTCString());
        window.Date = _Date;
    });

});

