/**
 * @module montage/core/converter/snake-case-converter
 * @requires montage/core/converter/converter
 *
 * adapted from
 * https://github.com/angus-c/just/blob/master/packages/string-snake-case/index.js
 */
var Converter = require("./converter").Converter,
    // any combination of spaces and punctuation characters
    // thanks to http://stackoverflow.com/a/25575009
    wordSeparators = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/,
    capitals = /[A-Z\u00C0-\u00D6\u00D9-\u00DD]/g,
    singleton;

/**
 * Converts string to snake case.
 *
 * @class SnakeCaseConverter
 * @extends Converter
 */
var SnakeCaseConverter = exports.SnakeCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === SnakeCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    /*
        With preserveConsecutiveUppercase true:
            'HELLO WORLD' -> 'hello_world'
        With preserveConsecutiveUppercase false:
            'HELLO WORLD' -> 'h_e_l_l_o_w_o_r_l_d'
    */
    preserveConsecutiveUppercase: {
        value: true
    },

    convert: {
        value: function (str) {

            if(!this.preserveConsecutiveUppercase) {
                //replace capitals with space + lower case equivalent for later parsing
                str = str.replace(capitals, function(match) {
                    return ' ' + (match.toLowerCase() || match);
                });
            } else {
                str = str.toLowerCase();
            }

            return str
                .trim()
                .split(wordSeparators)
                .join('_');
        }
    }
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new SnakeCaseConverter();
        }

        return singleton;
    }
});
