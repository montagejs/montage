var Montage = require("./core").Montage,
Calendar = require("./date/calendar").Calendar,
currentEnvironment = require("./environment").currentEnvironment;

/*

Finding the users locale
First I need to know the locale of the user. This is usually expressed in the form of culture codes they look like this, en-GB. This code represents English (United Kingdom). It turns out browsers actually expose a few different ways to get this information.

navigator.language
navigator.languages
navigator.browserLanguage
navigator.userLanguage
Intl.DateTimeFormat().resolvedOptions().locale
Like most things JavaScript not all these options return the same thing or what you might expect. My initial attempt at solving this problem was to use Intl.DateTimeFormat().resolvedOptions().locale.

This seemed to work fine however I run a Mac and swap between MacOS and Windows 10 running on Parallels. I noticed on MacOS this returned en-GB as I was expecting but on Windows 10 it returned en-US. I checked all my settings and everything appeared to be correctly set to UK culture. This made me slightly concerned that this was not working completely correctly.

After a bit of Googling and reading I decided to go with a combination of the other options. Most people seem to agree this gives the most accurate result in the majority of situations. It looks like this.

getBrowserLocale: function () {
    return (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';
}


*/

/*
a valid source of all locales:

https://github.com/unicode-cldr/cldr-core/blob/master/availableLocales.json

*/


/**
    Locale

    - follows Intl.Locale
    - offer richer types when we do (Calendar)
    - more to add as needed from by https://developer.apple.com/documentation/foundation/nslocale?language=objc

    Information about linguistic, cultural, and technological conventions for use in formatting data for presentation.


    References:
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules/PluralRules (x Safari)
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales


    @class module:montage/core/date/locale.Locale
    @extends module:montage/core/core.Montage
 */


 /*
    in order to react to locale change at the browser, we can use:

    window.addEventListemer("languagechange",function(event) {
        console.log('languagechange event detected!');
    });

    We shall have our own preferences at some point with direct way to change a locale/language, so
    we'll need to use  window.addEventListemer("languagechange" ...) as an input to that and globally observe changes on our Locale with our own change events

 */

var Locale = exports.Locale = Montage.specialize({
    identifier: {
        value: undefined
    },

    /**
     * initializes a new calendar locale by a given identifier.
     *
     * @function
     * @param {String} localeIdentifier The module id of the HTML page to load.
     * @param {Object} options          An object that contains configuration for the Locale. Keys are Unicode locale tags,
     *                                  values are valid Unicode tag values.
     *
     * @returns {Locale}                a new Locale instance.
     */
    initWithIdentifier: {
        value: function(localeIdentifier) {
            this.identifier = localeIdentifier;
            return this;
        }
    },
    _localeByIdentifier: {
        value: new Map()
    },

    /* Instance properties */

    /**
     * The baseName property returns basic, core information about the Locale in the form of a substring
     * of the complete data string. Specifically, the property returns the substring containing the language,
     * and the script and region if available. baseName returns the language ["-" script] ["-" region] *("-" variant)
     * subsequence of the unicode_language_id grammar.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/baseName
     *
     * @property {String}
     */
    baseName: {
        value: undefined
    },

    /**
     * Returns the part of the Locale that indicates the Locale's calendar era.
     *
     * @property {Calendar}
     */
    calendar: {
        value: undefined
    },
    /**
     * Returns whether case is taken into account for the locale's collation rules.
     *
     * @property {boolean}
     */
    caseFirst: {
        value: undefined
    },
    /**
     * returns the collation type for the Locale, which is used to order strings according to the locale's rules.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/collation
     *
     * Collation is the process of ordering strings of characters. It is used whenever strings must be sorted and
     * placed into a certain order, from search query results to ordering records in a database.
     * While the idea of placing strings in order might seem trivial, the idea of order can vary from region to
     * region and language to language. The collation property helps to make it easier for JavaScript programmers
     * to access the collation type used by a particular locale.
     *
     * Valid collation types
     *      Collation Type	    Description
     *      big5han	            Pinyin ordering for Latin, big5 charset ordering for CJK characters (used in Chinese)
     *      compat	            A previous version of the ordering, for compatibility
     *      dict	            Dictionary style ordering (such as in Sinhala)
     *
     *      direct              The direct collation type has been deprected. Do not use.
     *                          Binary code point order (used in Hindi)
     *
     *      ducet	            The default Unicode collation element table order
     *      emoji	            Recommended ordering for emoji characters
     *      eor	                European ordering rules
     *      gb2312	            Pinyin ordering for Latin, gb2312han charset ordering for CJK characters (used in Chinese)
     *      phonebk	            Phonebook style ordering (such as in German)
     *      phonetic	        Phonetic ordering (sorting based on pronunciation)
     *      pinyin	            Pinyin ordering for Latin and for CJK characters (used in Chinese)
     *      reformed	        Reformed ordering (such as in Swedish)
     *      search	            Special collation type for string search
     *      searchjl	        Special collation type for Korean initial consonant search
     *      standard	        Default ordering for each language
     *      stroke	            Pinyin ordering for Latin, stroke order for CJK characters (used in Chinese)
     *      trad	            Traditional style ordering (such as in Spanish)
     *      unihan	            Pinyin ordering for Latin, Unihan radical-stroke ordering for CJK characters (used in Chinese)
     *      zhuyin	            Pinyin ordering for Latin, zhuyin order for Bopomofo and CJK characters (used in Chinese)
     *
     * @property {String}
     */
    collation: {
        value: undefined
    },
    /**
     * The Intl.Locale.prototype.hourCycle property is an accessor property that returns the time keeping
     * format convention used by the locale.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/hourCycle
     *
     * Description
     *
     * There are 2 main types of time keeping conventions (clocks) used around the world: the 12 hour clock and the 24 hour clock.
     * The hourCycle property makes it easier for JavaScript programmers to access the clock type used by a particular locale.
     * Like other additional locale data, hour cycle type is an extension subtag, which extends the data contained in a locale string.
     * The hour cycle type can have several different values, which are listed in the table below
     *
     * Valid hour cycle types
     *
     * Hour cycle type      Description
     * h12	                Hour system using 1–12; corresponds to 'h' in patterns. The 12 hour clock, with midnight starting at 12:00 am.
     * h23	                Hour system using 0–23; corresponds to 'H' in patterns. The 24 hour clock, with midnight starting at 0:00.
     * h11	                Hour system using 0–11; corresponds to 'K' in patterns. The 12 hour clock, with midnight starting at 0:00 am.
     * h24	                Hour system using 1–24; corresponds to 'k' in pattern. The 24 hour clock, with midnight starting at 24:00.
     *
     * @property {String}
     */
    hourCycle: {
        value: undefined
    },
    /**
     * Returns the language associated with the locale.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/language
     *
     * @property {String}
     */
    _language: {
        value: undefined
    },
    language: {
        get: function() {
            if(!this._language) {
                this._buildLanguageRegion();
            }
            return this._language;
        }
    },
    _buildLanguageRegion: {
        value: function() {
            //Could be "en-Latn-US" in a browser? so we pick first for language
            //and last for country
            var split = this.identifier.split("-");
            this._language = split[0];
            this._region = split.length > 1 ? split[split.length-1] : "*";
        }
    },
    /**
     * returns the numeral system used by the locale.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/numberingSystem
     *
     * @property {String}
     */
    numberingSystem: {
        value: undefined
    },

    /**
     * returns whether the locale has special collation handling for numeric characters.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/numeric
     *
     * @property {boolean}
     */
    numeric: {
        value: undefined
    },

    /**
     * returns the region of the world (usually a country) associated with the locale.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/region
     *
     * @property {String}
     */
    _region: {
        value: undefined
    },
    region: {
        get: function() {
            if(!this._region) {
                this._buildLanguageRegion();
            }
            return this._region;
        }
    },

    /**
     * Returns the script used for writing the particular language used in the locale.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/script
     *
     * @property {String}
     */
    script: {
        value: undefined
    }
},{

    _systemLocale: {
        value: undefined
    },
    systemLocale: {
        get: function() {
            if(!this._systemLocale) {
                var systemLocaleIdentifier = currentEnvironment.systemLocaleIdentifier,
                    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/resolvedOptions
                    resolvedOptions = Intl.DateTimeFormat(systemLocaleIdentifier).resolvedOptions(),
                    calendar = resolvedOptions.calendar, /*"gregory"*/
                    day = resolvedOptions.day, /*"numeric"*/
                    month = resolvedOptions.month, /*"numeric"*/
                    year = resolvedOptions.year, /*"year"*/
                    locale = resolvedOptions.locale, /* should be equal to navigatorLocaleIdentifier */
                    numberingSystem = resolvedOptions.year, /*"latn"*/
                    timeZone = resolvedOptions.timeZone, /* "America/Los_Angeles" */
                    aLocale;

                //Using timeZone extra data through a TimeZone instance (and extra meta data, we could in certain cases guess the region)
                aLocale = this.withIdentifier(locale,{
                    calendar: this.Calendar.withIdentifier(calendar),
                    numberingSystem: numberingSystem
                });

                this._systemLocale = aLocale;

            }
            return this._systemLocale;
        },
        set: function(value) {
            this._systemLocale = value;
        }
    },



    /**
     * Creates a new calendar specified by a given identifier.
     *
     *
     * @function
     * @param {String} localeIdentifier The module id of the HTML page to load.
     * @param {Object} options          An object that contains configuration for the Locale. Keys are Unicode locale tags,
     *                                  values are valid Unicode tag values.
     *
     * @returns {Locale}                a new Locale instance.
     */

    withIdentifier: {
        value: function(localeIdentifier, options) {
            return new this().initWithIdentifier(localeIdentifier, options);
        }
    }
});

Locale.Calendar = Calendar;
