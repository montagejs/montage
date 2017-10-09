var ObjectDescriptor = require("./object-descriptor").ObjectDescriptor,
    DataPropertyDescriptor = require("./data-property-descriptor").DataPropertyDescriptor;

/**
 * Extends an object descriptor with the additional object information needed by
 * Montage Data.
 *
 * @deprecated
 * @class
 * @extends ObjectDescriptor
 */
exports.DataObjectDescriptor = ObjectDescriptor.specialize(/** @lends DataObjectDescriptor.prototype */ {

    /**
     * The names of the properties containing the identifier for this type of
     * data object.
     *
     * @type {Array.<string>}
     */
    identifierNames: {
        value: []
    },

    /**
     * Descriptors of the properties of data objects of this type, by property
     * name.
     *
     * The returned map should not be modified.
     * [setPropertyDescriptor()]{@link DataObjectDescriptor#setPropertyDescriptor}
     * and
     * [deletePropertyDescriptor()]{@link ObjectDescriptor#deletePropertyDescriptor}
     * should be used instead to modify the property descriptors.
     *
     * @type {Object.<string, DataPropertyDescriptor>}
     */
    propertyDescriptors: {
        get: function () {
            // This returns the same value as the superclass property of the
            // same name, only the JSDoc type is different.
            return Object.getOwnPropertyDescriptor(ObjectDescriptor.prototype, "propertyDescriptors").get.call(this);
        }
    },

    /**
     * Add or replace a property descriptor.
     *
     * @method
     * @argument {string} name                       - The name of the property.
     * @argument {DataPropertyDescriptor} descriptor - Describes the property.
     */
    setPropertyDescriptor: {
        // This does the same thing as the superclass method of the same name,
        // only the JSDoc type is different.
        value: function (name, descriptor) {
            ObjectDescriptor.prototype.setPropertyDescriptor.call(this, name, descriptor);
        }
    },

    /**
     * Create a property descriptor.
     *
     * This overrides the
     * [superclass implementation]{@link PropertyDescriptor#makePropertyDescriptor}
     * to create a {@link DataPropertyDescriptor} instead of a
     * {@link PropertyDescriptor} instance.
     *
     * @method
     * @returns {DataPropertyDescriptor} - The created property descriptor.
     */
    makePropertyDescriptor: {
        value: function () {
            return new DataPropertyDescriptor();
        }
    },

    /**
     * @private
     * @method
     */
    _addRelationships: {
        value: function (relationships) {
            var names, i, n;
            if (relationships) {
                names = Object.keys(relationships);
                for (i = 0, n = names.length; i < n; i += 1) {
                    this._addRelationship(names[i], relationships[names[i]]);
                }
            }
        }
    },

    /**
     * @private
     * @method
     */
    _addRelationship: {
        value: function (name, relationship) {
            // TODO: Add derived properties, relationship criteria,
            // relationship targets, and shared fetch information.
            if (!this.propertyDescriptors[name]) {
                this.setPropertyDescriptor(name, this.makePropertyDescriptor());
            }
            this.propertyDescriptors[name].isRelationship = true;
            this.propertyDescriptors[name].isGlobal = relationship.isGlobal ? true : false;
        }
    }

}, /** @lends DataObjectDescriptor */ {

    /**
     * Generates a getter function that will create and cache a data object
     * descriptor.
     *
     * @method
     * @argument {Object} exports             - A
     *                                          [Montage Require]{@link external:Require}
     *                                          exports object defining the
     *                                          constructor for the object to
     *                                          describe. Usually this is
     *                                          `exports`.
     * @argument {string} constructorName     - The name with which that
     *                                          constructor can be looked up in
     *                                          the exports. This will also be
     *                                          used as the created descriptor's
     *                                          type name.
     * @argument {Object<string, string>}
     *           [propertyTypes]              - The types of each of the
     *                                          described objects' properties,
     *                                          by property name. Optional
     *                                          except if identifier names or
     *                                          relationship information are to
     *                                          be specified. Pass in a null
     *                                          or undefined value to specify
     *                                          identifier names or relationship
     *                                          information but no property
     *                                          types. If no types array is
     *                                          specified the property
     *                                          information will be derived from
     *                                          the properties of the objects'
     *                                          prototype. If an empty types
     *                                          array is specified the objects
     *                                          will be assumed to have no
     *                                          properties.
     * @argument {Array.<string>}
     *           [identifierNames=[]]         - The names of the properties of
     *                                          described objects whose values,
     *                                          when taken together, define
     *                                          a unique identifier for each
     *                                          such object. If no names are
     *                                          specified those objects are
     *                                          assumed to not be uniquely
     *                                          identifiable. The names can be
     *                                          specified as an array or as a
     *                                          sequence of strings.
     * @argument {Object<string, Object>}
     *           [relationshipInformation={}] - Information about each of the
     *                                          objects' relationships, by
     *                                          relationship property name. If
     *                                          no information is provided the
     *                                          objects are assumed to have no
     *                                          relationships.
     */
    getterFor: {
        value: function (exports, constructorName, propertyTypes, identifierNames, relationshipInformation) {
            // The returned getter function has to check
            // `this.hasOwnProperty("_TYPE")`, not just `this._TYPE`, because if
            // the class using the getter is a subclass of another class using a
            // similar getter `this._TYPE` will return the value of the the
            // superclass type instead of the desired subclass type.
            var self = this,
                parsed = this._parseGetterForArguments.apply(this, arguments),
                getter = ObjectDescriptor.getterFor.call(this, parsed.exports, parsed.name, parsed.types);
            return function () {
                
                if (!this.hasOwnProperty("_TYPE")) {
                    this._TYPE = getter.call(this);
                    this._TYPE.identifierNames = parsed.identifiers;
                    this._TYPE._addRelationships(parsed.relationships);
                }

                return this._TYPE;
            };
        }
    },

    /**
     * @private
     * @method
     */
    _parseGetterForArguments: {
        value: function (/* exports, constructorName, [propertyTypes,] identifierNames[, relationshipInformation]
                            exports, constructorName, [propertyTypes,] relationshipInformation
                            exports, constructorName */) {
            var parsed, index, i, n;
            // Parse the exports object and constructor name.
            parsed = {exports: arguments[0], name: arguments[1]};
            // Parse the property types if they are provided: They must be a
            // "real" object (non-array, non-string, non-numeric, and
            // non-boolean), and they can't be the last argument (they must
            // be followed by either an identifier name or a relationship
            // information argument). After this parsing "index" will point to
            // the next argument to parse.
            if (arguments.length > 3 && this._isRealObject(arguments[2])) {
                parsed.types = arguments[2];
                index = 3;
            } else {
                index = 2;
            }
            // Parse the identifier names: If provided these will be in an array
            // or in a sequence of string. After this parsing "index" will point
            // to the next argument to parse.
            if (Array.isArray(arguments[index])) {
                parsed.identifiers = arguments[index];
                index += 1;
            } else {
                for (i = index, n = arguments.length; i < n && typeof arguments[i] === "string"; i += 1) {
                    parsed.identifiers = Array.prototype.slice.call(arguments, index, i);
                }
                index = i;
            }
            // Parse the relationship information.
            parsed.relationships = arguments[index];
            // Return the parsed arguments.
            return parsed;
        }
    },

    /**
     * @private
     * @method
     */
    _isRealObject: {
        value: function (value) {
            return value &&
                   typeof value === "object" &&
                   !Array.isArray(value) &&
                   !(value instanceof String) &&
                   !(value instanceof Number) &&
                   !(value instanceof Boolean);
        }
    }

});
