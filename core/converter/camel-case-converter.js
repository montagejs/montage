/**
 * @module montage/core/converter/camel-case-converter
 * @requires montage/core/converter/converter
 * borrowed from https://github.com/angus-c/just/blob/master/packages/string-camel-case/index.js (MIT)
 */
var Converter = require("./converter").Converter,

    // any combination of spaces and punctuation characters
    // thanks to http://stackoverflow.com/a/25575009
    wordSeparatorsRegEx = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/,
    basicCamelRegEx = /^[a-z\u00E0-\u00FCA-Z\u00C0-\u00DC][\d|a-z\u00E0-\u00FCA-Z\u00C0-\u00DC]*$/,
    fourOrMoreConsecutiveCapsRegEx = /([A-Z\u00C0-\u00DC]{4,})/g,
    allCapsRegEx = /^[A-Z\u00C0-\u00DC]+$/,
    singleton;

/**
 * Converts string to camel case.
 *
 * @class CamelCaseConverter
 * @extends Converter
 */
var CamelCaseConverter = exports.CamelCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            // if (this.constructor === CamelCaseConverter) {
            //     if (!singleton) {
            //         singleton = this;
            //     }

            //     return singleton;
            // }

            return this;
        }
    },

    _deCap: {
        value: function deCap(match, endOfWord) {
        var arr = match.split('');
        var first = arr.shift().toUpperCase();
        var last = endOfWord ? arr.pop().toLowerCase() : arr.pop();
        return first + arr.join('').toLowerCase() + last;
      }
    },

    convertFirstLetterToUpperCase: {
        value: false
    },

    convert: {
        value: function CamelCaseConverter_convert(str) {

            var words = str.split(wordSeparatorsRegEx),
                len = words.length,
                mappedWords = new Array(len),
                decap = this._deCap,
                convertFirstLetterToUpperCase = this.convertFirstLetterToUpperCase,
                word, isCamelCase, firstLetter;

            for (var i = 0; i < len; i++) {
              word = words[i];
              if (word === '') {
                continue;
              }
              isCamelCase = basicCamelRegEx.test(word) && !allCapsRegEx.test(word);
              if (isCamelCase) {
                word = word.replace(fourOrMoreConsecutiveCapsRegEx, function(match, p1, offset) {
                  return deCap(match, word.length - offset - match.length == 0);
                });
              }
              firstLetter = word[0];
              firstLetter = (convertFirstLetterToUpperCase || i > 0) ? firstLetter.toUpperCase() : firstLetter.toLowerCase();
              mappedWords[i] = firstLetter + (!isCamelCase ? word.slice(1).toLowerCase() : word.slice(1));
            }
            return mappedWords.join('');
          }
    }

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new CamelCaseConverter();
        }

        return singleton;
    }
});
