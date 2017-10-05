var Montage = require("core/core").Montage,
    PropertyDescriptor = require("data/model/property-descriptor").PropertyDescriptor;

/**
 * Describes a type of object.
 * @deprecated
 * @class
 * @extends external:Montage
 */
exports.ObjectDescriptor = Montage.specialize(/** @lends ObjectDescriptor.prototype */ {

    /**
     * Name of the type of object described by this descriptor.
     *
     * @type {string}
     */
    typeName: {
        value: undefined
    },

    /**
     * Prototype of objects of this type.
     *
     * @type {function}
     */
    objectPrototype: {
        value: Montage.prototype
    },

    /**
     * Descriptors of the properties of objects of this type, by property name.
     *
     * The returned map should not be modified.
     * [setPropertyDescriptor()]{@link ObjectDescriptor#setPropertyDescriptor}
     * and
     * [deletePropertyDescriptor()]{@link ObjectDescriptor#deletePropertyDescriptor}
     * should be used instead to modify the property descriptors.
     *
     * @type {Object.<string, PropertyDescriptor>}
     */
    propertyDescriptors: {
        get: function () {
            if (!this._propertyDescriptors) {
                this._propertyDescriptors = {};
            }
            return this._propertyDescriptors;
        }
    },

    /**
     * Add or replace a property descriptor.
     *
     * @method
     * @argument {string} name                   - The name of the property.
     * @argument {PropertyDescriptor} descriptor - Describes the property.
     */
    setPropertyDescriptor: {
        value: function (name, descriptor) {
            this.propertyDescriptors[name] = descriptor;
        }
    },

    /**
     * Remove a property descriptor.
     *
     * @method
     * @argument {string} name - The name of the property whose descriptor
     *                           should be removed.
     */
    deletePropertyDescriptor: {
        value: function (name) {
            delete this.propertyDescriptors[name];
        }
    },

    /**
     * Create a property descriptor.
     *
     * This implementation creates a plain {@link PropertyDescriptor} instance.
     * Subclasses can override this to create property descriptors of a
     * type more appropriate for the subclass. Any such type should be a
     * subclass of {@link PropertyDescriptor}.
     *
     * @method
     * @returns {PropertyDescriptor} - The created property descriptor.
     */
    makePropertyDescriptor: {
        value: function () {
            return new PropertyDescriptor();
        }
    },

    /**
     * @private
     * @method
     * @argument {Object<string, string>} types
     */
    _setPropertyDescriptorsFromTypes: {
        value: function (types) {
            var i, descriptor, key,
                keys = Object.keys(types);
            for (i = 0; (key = keys[i]); ++i) {
                descriptor = this.makePropertyDescriptor();
                this.setPropertyDescriptor(key, descriptor);
            }
        }
    },

    /**
     * @private
     * @method
     * @argument {Object} prototype
     */
    _setPropertyDescriptorsFromPrototype: {
        value: function (prototype) {
            var names, descriptor, i, n;
            for (; prototype !== Montage.prototype && prototype !== null; prototype = Object.getPrototypeOf(prototype)) {
                names = Object.getOwnPropertyNames(prototype);
                for (i = 0, n = names.length; i < n; i += 1) {
                    if (!this.propertyDescriptors[names[i]]) {
                        descriptor = this.makePropertyDescriptor();
                        this.setPropertyDescriptor(names[i], descriptor);
                    }
                }
            }
        }
    }

}, /** @lends ObjectDescriptor */ {

    /**
     * Generates a getter function that will create and cache an object
     * descriptor.
     *
     * @method
     * @argument {Object} exports         - A
     *                                      [Montage Require]{@link external:Require}
     *                                      exports object defining the
     *                                      constructor for the objects to
     *                                      describe. Usually this is `exports`.
     * @argument {string} constructorName - The name with which that constructor
     *                                      can be looked up in the exports.
     *                                      This will also be used as the
     *                                      created descriptor's type name.
     * @argument {Object<string, string>}
     *           [propertyTypes]          - The types of each of the described
     *                                      objects' properties, by property
     *                                      name. If this is not specified the
     *                                      property information will be derived
     *                                      from the properties of the objects'
     *                                      prototype.
     */
    getterFor: {
        value: function (exports, constructorName, propertyTypes) {
            // The returned getter function has to check
            // `this.hasOwnProperty("_TYPE")`, not just `this._TYPE`, because if
            // the class using the getter is a subclass of another class using a
            // similar getter `this._TYPE` will return the value of the the
            // superclass type instead of the desired subclass type.
            var self = this;
            return function () {
                if (!this.hasOwnProperty("_TYPE")) {
                    this._TYPE = new self();
                    this._TYPE.typeName = constructorName;
                    this._TYPE.objectPrototype = exports[constructorName].prototype;
                    if (propertyTypes) {
                        this._TYPE._setPropertyDescriptorsFromTypes(propertyTypes);
                    } else {
                        this._TYPE._setPropertyDescriptorsFromPrototype(this._TYPE.objectPrototype);
                    }
                }
                return this._TYPE;
            };
        }
    }

});
