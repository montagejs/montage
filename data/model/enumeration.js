var Montage = require("core/core").Montage;

/**
 * Subclasses of this class represent enumerated types. Instances of those
 * subclasses represent possible values of those types. Enumerated type
 * subclasses and their possible values can be defined as in the following:
 *
 *     exports.Suit = Enumeration.specialize("id", "name", {
 *         SPADES: [0, "Spades"],
 *         HEARTS: [1, "Hearts"],
 *         DIAMONDS: [2, "Diamonds"],
 *         CLUBS: [3, "Clubs"]
 *     });
 *
 *     // To be use like this:
 *     myCard = {value: 12, suit: Suit.HEARTS};
 *
 * Enumerated types can also be defined as class properties using the
 * [getterFor()]{@link Enumeration.getterFor} constructor, as in the following:
 *
 *     exports.Card = Montage.specialize({
 *
 *         value: {
 *             value: undefined
 *         },
 *
 *         suit: {
 *             value: undefined
 *         }
 *
 *     }, {
 *
 *         Suit: {
 *             get: Enumeration.getterFor("_Suit", "id", "name", {
 *                 SPADES: [1, "Spade"],
 *                 HEARTS: [2, "Heart"],
 *                 DIAMONDS: [3, "Diamond"],
 *                 CLUBS: [4, "Club"]
 *             })
 *         }
 *
 *     });
 *
 *     // To be use like this:
 *     myCard = new Card();
 *     myCard.value = 12;
 *     myCard.suit = Card.Suit.HEARTS;
 *
 * In addition to being created as shown above, instances of an enumerated
 * type subclasses can be created using a `with*()` class method that will be
 * automatically generated for each subclass based on the subclass' property
 * names, as in the following:
 *
 *     Card.Suit.ROSES = Card.Suit.withIdAndName(5, "Roses");
 *
 * Once instances of an enumerated type subclass are created they can be looked
 * up using `for*()` class methods that will be automatically generated for each
 * of the subclass's unique property names, as in the following:
 *
 *     myCard.value = Math.floor(1 + 13 * Math.random());
 *     myCard.suit = Card.Suit.forId(Math.floor(1 + 4 * Math.random()));
 *
 * @class
 * @extends external:Montage
 *
 * @todo [Charles] Simplify this extremely, notably by making enumerations
 * instances of the Enumeration class instead of subclasses of it and by
 * reworking the [getterFor()]{@link Enumeration.getterFor} constructor.
 * @todo [Charles] Switch to initial-caps enumeration value names like "Spades"
 * instead of all-caps names like "NAMES".
 * @todo [Charles] Provide a "values" property to the enumeration similar to
 * Java's "values()" Enum method.
 */
exports.Enumeration = Montage.specialize({}, /** @lends Enumeration */ {

    /**
     * Creates a new enumeration subclass with the specified attributes.
     *
     * @method
     * @argument {Array.<string>|string} [uniquePropertyNames]
     * @argument {Array.<string>|...string} [otherPropertyNames]
     * @argument {Object} [prototypeDescriptor]
     * @argument {Object} [constructorDescriptor]
     * @argument {Object} [constants]
     * @returns {function()} - The created Enumeration subclass.
     *
     * @todo [Charles] Simplify this API, possibly by making
     * "uniquePropertyNames", "otherPropertyNames", and "constants"
     * properties of the derived instance, leaving "specialize()"
     * to its "Montage.specialize()" API and meaning.
     */
    specialize: {
        value: function (uniquePropertyNames, otherPropertyNames,
                         prototypeDescriptor, constructorDescriptor,
                         constants) {
            return this._specialize(this._parseSpecializeArguments.apply(this, arguments));
        }
    },

    /**
     * Creates and returns a getter which, when first called, will create and
     * cache a new enumeration subclass with the specified attributes.
     *
     * @method
     * @argument {string} key
     * @argument {Array.<string>|string} [uniquePropertyNames]
     * @argument {Array.<string>|...string} [otherPropertyNames]
     * @argument {Object} [prototypeDescriptor]
     * @argument {Object} [constructorDescriptor]
     * @argument {Object} [constants]
     * @returns {function()} - A getter that will create and cache the desired
     * Enumeration subclass.
     *
     * @todo [Charles] Simplify this API, replacing it with simpler
     * methods like Enumeration.withNames(), Enumeration.withValues(),
     * and Enumeration.withPrototypeAndValues().
     */
    getterFor: {
        value: function (key, uniquePropertyNames, otherPropertyNames,
                         prototypeDescriptor, constructorDescriptor,
                         constants) {
            var specializeArguments = this._parseSpecializeArguments.apply(this, Array.prototype.slice.call(arguments, 1));
            // Return a function that will create the desired enumeration.
            return function () {
                if (!this.hasOwnProperty(key)) {
                    this[key] = exports.Enumeration._specialize(specializeArguments);
                }
                return this[key];
            };
        }
    },

    _parseSpecializeArguments: {
        value: function (/* uniquePropertyNames, otherPropertyNames,
                         prototypeDescriptor, constructorDescriptor,
                         constants */) {
            var start, unique, other, end, i, n;
            // The unique property names array is the first argument if that's
            // an array, or an array containing the first argument if that's a
            // non-empty string, or an empty array.
            start = 0;
            if (Array.isArray(arguments[start])) {
                unique = arguments[start];
            } else if (typeof arguments[start] === "string" && arguments[start].length > 0) {
                unique = [arguments[start]];
            } else if (arguments[start] === null || arguments[start] === undefined || arguments[start] === "") {
                unique = [];
            } else {
                unique = [];
                start -= 1;
            }
            // The other property names array is the next argument if that's an
            // array, or an array containing the next argument and all following
            // ones that are strings if there are any, or an empty array.
            other = Array.isArray(arguments[start + 1]) && arguments[start + 1];
            for (i = start + 1, n = arguments.length; !other; i += 1) {
                if (i === n || !arguments[i] || typeof arguments[i] !== "string") {
                    other = Array.prototype.slice.call(arguments, start + 1, i);
                    start = i - 2;
                }
            }
            // The remaining argument values come from the remaining arguments.
            end = Math.min(arguments.length, start + 5);
            return {
                uniquePropertyNames: unique,
                otherPropertyNames: other,
                prototypeDescriptor: end > start + 3 ? arguments[start + 2] : {},
                constructorDescriptor: end > start + 4 ? arguments[start + 3] : {},
                constantDescriptors: end > start + 2 ? arguments[end - 1] : {}
            };
        }
    },

    /**
     * @private
     * @method
     */
    _specialize: {
        value: function (parsed) {
            var unique = parsed.uniquePropertyNames,
                other = parsed.otherPropertyNames,
                prototype = parsed.prototypeDescriptor,
                constructor = parsed.constructorDescriptor,
                constants = parsed.constantDescriptors,
                enumeration, create, i, keys, key;
            // Create the desired enumeration, including a constructor taking
            // only unique property values (like `withId()`), and if there are
            // other property values a constructor taking values for those too
            // (like `withIdAndName()`).
            this._addPropertiesToDescriptor(prototype, unique, other);
            this._addLookupFunctionsToDescriptor(constructor, unique);
            this._addConstructorFunctionToDescriptor(constructor, unique, []);
            if (other.length) {
                this._addConstructorFunctionToDescriptor(constructor, unique, other);
            }
            enumeration = Montage.specialize.call(exports.Enumeration, prototype, constructor);
            // Add the requested constants.
            create = this._makeCreateFunction(unique, other);
            keys = Object.keys(constants);
            for (i = 0; (key = keys[i]); ++i) {
                enumeration[key] = create.apply(enumeration, constants[key]);
            }
            // Return the created enumeration.
            return enumeration;
        }
    },

    _addPropertiesToDescriptor: {
        value: function(prototypeDescriptor, uniquePropertyNames, otherPropertyNames) {
            var i, n;
            for (i = 0, n = uniquePropertyNames.length; i < n; i += 1) {
                if (!prototypeDescriptor[uniquePropertyNames[i]]) {
                    prototypeDescriptor[uniquePropertyNames[i]] = {value: undefined};
                }
            }
            for (i = 0, n = otherPropertyNames.length; i < n; i += 1) {
                if (!prototypeDescriptor[otherPropertyNames[i]]) {
                    prototypeDescriptor[otherPropertyNames[i]] = {value: undefined};
                }
            }
        }
    },

    _addLookupFunctionsToDescriptor: {
        value: function(constructorDescriptor, uniquePropertyNames) {
            var name, lookup, i, n;
            for (i = 0, n = uniquePropertyNames.length; i < n; i += 1) {
                name = "for" + uniquePropertyNames[i][0].toUpperCase() + uniquePropertyNames[i].slice(1);
                lookup = this._makeLookupFunction(uniquePropertyNames[i]);
                constructorDescriptor[name] = {value: lookup};
            }
        }
    },

    _makeLookupFunction: {
        value: function(propertyName) {
            return function (propertyValue) {
                return this._instances &&
                       this._instances[propertyName] &&
                       this._instances[propertyName][propertyValue];
            };
        }
    },

    _addConstructorFunctionToDescriptor: {
        value: function(constructorDescriptor, uniquePropertyNames, otherPropertyNames) {
            var create, names, name, i, n;
            if (uniquePropertyNames.length || otherPropertyNames.length) {
                create = this._makeCreateFunction(uniquePropertyNames, otherPropertyNames);
                names = ["with"];
                for (i = 0, n = uniquePropertyNames.length; i < n; i += 1) {
                    names.push(uniquePropertyNames[i][0].toUpperCase());
                    names.push(uniquePropertyNames[i].slice(1));
                }
                for (i = 0, n = otherPropertyNames.length; i < n; i += 1) {
                    names.push(otherPropertyNames[i][0].toUpperCase());
                    names.push(otherPropertyNames[i].slice(1));
                }
                if (names.length > 3) {
                    names.splice(names.length - 2, 0, "And");
                }
                constructorDescriptor[names.join("")] = {value: create};
            }
        }
    },

    _makeCreateFunction: {
        value: function(uniquePropertyNames, otherPropertyNames) {
            var self = this;
            return function (propertyValues, propertiesDescriptor) {
                var createArguments = self._parseCreateArguments(uniquePropertyNames, otherPropertyNames, arguments);
                return self._create(this, uniquePropertyNames, otherPropertyNames, createArguments);
            };
        }
    },

    _parseCreateArguments: {
        value: function(uniquePropertyNames, otherPropertyNames, zArguments) {
            var count = uniquePropertyNames.length + otherPropertyNames.length;
            return {
                propertyValues: Array.prototype.slice.call(zArguments, 0, count),
                propertyDescriptors: zArguments[count] || {}
            };
        }
    },

    _create: {
        value: function(type, uniquePropertyNames, otherPropertyNames, zArguments) {
            var instance, name, i, m, n;
            // Create the instance.
            instance = new type();
            // Add to the instance the properties specified in the descriptor.
            Montage.defineProperties(instance, zArguments.propertyDescriptors);
            // Add to the instance the property values specified.
            for (i = 0, n = uniquePropertyNames.length, m = otherPropertyNames.length; i < n + m; i += 1) {
                name = i < n ? uniquePropertyNames[i] : otherPropertyNames[i - n];
                instance[name] = zArguments.propertyValues[i];
            }
            // Record the instance in the appropriate lookup maps.
            for (i = 0, n = uniquePropertyNames.length; i < n; i += 1) {
                type._instances = type._instances || {};
                type._instances[uniquePropertyNames[i]] = type._instances[uniquePropertyNames[i]] || {};
                type._instances[uniquePropertyNames[i]][zArguments.propertyValues[i]] = instance;
            }
            // Return the created instance.
            return instance;
        }
    }

});
