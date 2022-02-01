/**
 * Defines extensions to the intrinsic `String` object.
 * @see {external:String}
 * @module montage/core/extras/string
 */

/**
 * Returns true if the two strings are equal, otherwise returns false.
 *
 * @function external:String#equals
 * @param {Object} that The object to compare to the string.
 * @returns {boolean} Returns true if the string is equal to
 * `that`.
 */
Object.defineProperty(String.prototype, "equals", {
    value: function (that) {
        return this.valueOf() === Object.getValueOf(that);
    },
    enumerable: false,
    writable: true,
    configurable: true
});

/**
 * Determines whether a substring exists within this string.
 *
 * @function external:String#contains
 * @param {string} content
 * @returns {boolean} whether this string contains the given content
 */
Object.defineProperty(String.prototype, "contains", {
    value: function (substring) {
        return (this.indexOf(substring) !== -1) || (new RegExp(RegExp.escape(substring))).test(this);
    },
    enumerable: false,
    writable: true,
    configurable: true
});

if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, "includes", {
        value: function(search, start) {
        'use strict';

        if (search instanceof RegExp) {
            throw TypeError('first argument must not be a RegExp');
        }
        if (start === undefined) { start = 0; }
            return this.indexOf(search, start) !== -1;
        }
    });
}


/**
 * Capitalizes the first letter in the string.
 *
 * @function external:String#toCapitalized
 * @returns {string} The original string with its first letter capitalized.
 * @example
 * var fname = "abe";
 * var lname = "lincoln";
 * var name = fname.toCapitalized() + " " + lname.toCapitalized();
 * // name == "Abe Lincoln"
 */
Object.defineProperty(String.prototype, "toCapitalized", {
    value: function toCapitalized() {
        var value;
        return toCapitalized.cache.get(String(this)) || (toCapitalized.cache.set(String(this),(value = this[0].toUpperCase() + this.slice(1))) ? value : null);
    },
    enumerable: false,
    writable: true,
    configurable: true
});
String.prototype.toCapitalized.cache = new Map();

/*
    TODO: implement toLocaleCapitalized
    str.toLocaleCapitalized()
    str.toLocaleCapitalized(locale)
    str.toLocaleCapitalized([locale, locale, ...])

*/
Object.defineProperty(String.prototype, "toLocaleCapitalized", {
    value: function toLocaleCapitalized() {
        return (this[0].toLocaleCapitalized.apply(this,arguments) + this.slice(1));
    },
    enumerable: false,
    writable: true,
    configurable: true
});



if (!String.prototype.toCamelCase) {
    function _toCamelCase (sring, cache, isLower) {
        var trimmed = sring.trim(),
            camelCase = cache[trimmed] || '';

        if (!camelCase && trimmed.length) {
            if ((!isLower && /[^A-Z]/.test(trimmed[0])) || /\.|_|-|\s/.test(trimmed)) {
                var data = trimmed.split(/\.|_|-|\s/),
                    str;

                for (var i = 0, length = data.length; i < length; i++) {
                    str = data[i];

                    if (str) {
                        if (isLower && i === 0) {
                            camelCase += str;
                        } else {
                            camelCase += str.toCapitalized();
                        }
                    }
                }

                cache[trimmed] = camelCase;

            } else { // already camelCase
                camelCase = cache[trimmed] = trimmed;
            }
        }

        return camelCase;
    }


    Object.defineProperty(String.prototype, 'toCamelCase', {
        value: function toCamelCase() {
            return _toCamelCase(this, toCamelCase.cache);
        },
        enumerable: false,
        writable: true,
        configurable: true
    });

    String.prototype.toCamelCase.cache = Object.create(null);


    Object.defineProperty(String.prototype, 'toLowerCamelCase', {
        value: function toLowerCamelCase () {
            return _toCamelCase(this, toLowerCamelCase.cache, true);
        },
        enumerable: false,
        writable: true,
        configurable: true
    });

    String.prototype.toLowerCamelCase.cache = Object.create(null);
}

if(typeof String.prototype.removeSuffix !== "function") {
    Object.defineProperty(String.prototype, "removeSuffix", {
        value: function (suffix) {

            if (this.length) {
                if (suffix && suffix.length) {
                    var index = this.lastIndexOf(suffix);

                    if (index !== -1) {
                        return this.substring(0, index);
                    } else {
                        return this;
                    }
                } else {
                    return this;
                }
            } else {
                return this;
            }
        },
        enumerable: false,
        writable: true,
        configurable: true,
    });

}

if(typeof String.prototype.stringByDeletingLastPathComponent !== "function") {
    Object.defineProperty(String.prototype, 'stringByDeletingLastPathComponent', {
        value: function stringByDeletingLastPathComponent () {
            var lastIndex = this.lastIndexOf("/");
            if(lastIndex !== -1 ) {
                return this.substring(0,lastIndex);
            } else {
                return this;
            }
        },
        writable: true,
        configurable: true
    });
}

if(typeof String.prototype.stringByRemovingPathExtension !== "function") {
    Object.defineProperty(String.prototype, 'stringByRemovingPathExtension', {
        value: function stringByRemovingPathExtension () {
            var lastIndex = this.lastIndexOf(".");
            if(lastIndex !== -1 ) {
                return this.substring(0,lastIndex);
            } else {
                return this;
            }
        },
        writable: true,
        configurable: true
    });
}

if(typeof String.prototype.stringByRemovingPrefix !== "function") {
    Object.defineProperty(String.prototype, 'stringByRemovingPrefix', {
        value: function stringByRemovingPrefix (prefix) {
                if(this.startsWith(prefix)) {
                    return this.substring(prefix.length);
                } else {
                    return this;
                }
            },
            writable: true,
            enumerable: false,
            configurable: true
        });
}

if(typeof String.prototype.stringByRemovingSuffix !== "function") {
    Object.defineProperty(String.prototype, 'stringByRemovingSuffix', {
        value: function stringByRemovingSuffix (suffix) {
            if(this.endsWith(suffix)) {
                return this.substring(0, this.length - suffix.length);
            } else {
                return this;
            }
        },
        writable: true,
        enumerable: false,
        configurable: true
    });
}


if(typeof String.prototype.lastPathComponent !== "function") {
    Object.defineProperty(String.prototype, 'lastPathComponent', {
        value: function lastPathComponent () {
            var lastIndex = this.lastIndexOf("/");
            if(lastIndex !== -1 ) {
                return this.substring(lastIndex+1);
            } else {
                return this;
            }
        },
        writable: true,
        configurable: true
    });
}

if(typeof String.prototype.lastPathComponentRemovingExtension !== "function") {
    Object.defineProperty(String.prototype, 'lastPathComponentRemovingExtension', {
        value: function lastPathComponentRemovingExtension () {
            var indexStart = this.lastIndexOf("/") + 1,
                lastDotIndex = this.lastIndexOf("."),
                endIndex = (lastDotIndex > indexStart ? lastDotIndex : this.length );
            if(indexStart > 0 || endIndex < this.length) {
                return this.substring(indexStart, endIndex);
            } else {
                return this;
            }
        },
        writable: true,
        configurable: true
    });
}
