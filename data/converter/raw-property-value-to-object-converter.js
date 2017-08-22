var Converter = require("core/converter/converter").Converter,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
    Promise = require("core/promise").Promise,
    Scope = require("frb/scope"),
    parse = require("frb/parse"),
    compile = require("frb/compile-evaluator");

/**
 * @class RawPropertyValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends Converter
 */
exports.RawPropertyValueToObjectConverter = Converter.specialize( /** @lends RawPropertyValueToObjectConverter# */ {


    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            serializer.setProperty("convertExpression", this.convertExpression);

            serializer.setProperty("foreignDescriptor", this._foreignDescriptorReference);

            serializer.setProperty("revertExpression", this.revertExpression);

            serializer.setProperty("root", this.owner);

            serializer.setProperty("serviceIdentifier", this.serviceIdentifier);
            serializer.setProperty("service", this.service);

        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("convertExpression");
            if (value) {
                this.convertExpression = value;
            }

            value = deserializer.getProperty("revertExpression");
            if (value) {
                this.revertExpression = value;
            }

            value = deserializer.getProperty("foreignDescriptor");
            if (value) {
                this._foreignDescriptorReference = value;
            }

            value = deserializer.getProperty("service");
            if (value) {
                this.service = value;
            }

            value = deserializer.getObjectByLabel("root");
            if (value) {
                this.owner = value;
            }

            value = deserializer.getProperty("serviceIdentifier");
            if (value) {
                this.serviceIdentifier = value;
            }

            deserializer.deserializeUnit("bindings");
        }
    },

    /*********************************************************************
     * Initialization
     */

    /**
     * @param {string} convertExpression the expression to be used for building a criteria to obtain the object corresponding to the value to convert.
     * @return itself
     */
    initWithConvertExpression: {
        value: function (convertExpression) {
            this.convertExpression = convertExpression;
            return this;
        }
    },

    /*********************************************************************
     * Properties
     */


    _convertExpression: {
        value: null
    },

    /**
     * The expression used to convert a raw value into a modeled one, for example a foreign property value into the objet it represents.
     * @type {string}
     * */
    convertExpression: {
        get: function() {
            return this._convertExpression;
        },
        set: function(value) {
            if(value !== this._convertExpression) {
                this._convertExpression = value;
                this._convertSyntax = undefined;
            }
        }
    },

    _convertSyntax: {
        value: undefined
    },

    /**
     * Object created by parsing .convertExpression using frb/grammar.js that will
     * be used to initialize the convert query criteria
     * @type {Object}
     * */

    convertSyntax: {
        get: function() {
            return this._convertSyntax || (this._convertSyntax = parse(this.convertExpression));
        }
    },




    _revertExpression: {
        value: null
    },

    /**
     * The expression used to revert the modeled value into a raw one. For example,
     * reverting an object into it's primary key.
     * @type {string}
     * */
    revertExpression: {
        get: function() {
            return this._revertExpression;
        },
        set: function(value) {
            if(value !== this._revertExpression) {
                this._revertExpression = value;
                this._revertSyntax = undefined;
            }
        }
    },

    _revertSyntax: {
        value: undefined
    },

    /**
     * Object created by parsing .revertExpression using frb/grammar.js that will
     * be used to revert the modeled value into a raw one
     * @type {Object}
     * */
    revertSyntax: {
        get: function() {
            return this._revertSyntax || (this._revertSyntax = parse(this.revertExpression));
        }
    },


    /**
     * The descriptor of the destination object. If one is not provided,
     * .objectDescriptor will be used. If .objectDescriptor is not provided,
     * the value descriptor of the property descriptor that defines the
     * relationship will be used.
     * @type {?ObjectDescriptorReference}
     * */
    foreignDescriptor: {
        serializable: false,
        get: function () {
            return this._foreignDescriptorReference && this._foreignDescriptorReference.promise(require);
        },
        set: function (descriptor) {
            this._foreignDescriptorReference = new ObjectDescriptorReference().initWithValue(descriptor);
        }
    },

    /**
     * The descriptor of the source object. It will be used only if it is provided and
     * .foreignDescriptor is not provided.
     * @type {?ObjectDescriptor}
     **/
    objectDescriptor: {
        get: function () {
            return  this._objectDescriptor                    ? this._objectDescriptor :
                    this.owner && this.owner.objectDescriptor ? this.owner.objectDescriptor  :
                    undefined;
        },
        set: function (value) {
            this._objectDescriptor = value;
        }
    },

    owner: {
        get: function () {
            return this._owner ? this._owner.then ? this._owner : Promise.resolve(this._owner) : undefined;
        },
        set: function (value) {
            this._owner = value;
        }
    },

    __scope: {
        value: null
    },

    /**
     * Scope with which convert and revert expressions are evaluated.
     * @type {?Scope}
     **/
    scope: {
        get: function() {
            return this.__scope || (this.__scope = new Scope(this));
        }
    },



    /**
     * The service to use to make requests.
     */
    service: {
        get: function () {
            return  this._service ? this._service :
                    this.owner    ? this.owner.then(function (object) { return object.service; }) :
                                                       undefined;
        },
        set: function (value) {
            this._service = !value || value.then ? value : Promise.resolve(value);
        }
    },

    /**
     * Identifier of the child of .service that the query should be routed to
     */
    serviceIdentifier: {
        value: undefined
    },

    /*********************************************************************
     * Public API
     */

    /**
     * Converts the fault for the relationship to an actual object that has an ObjectDescriptor.
     * @function
     * @param {Property} v The value to format.
     * @returns {Promise} A promise for the referenced object.  The promise is
     * fulfilled after the object is successfully fetched.
     */
    convert: {
        value: function (v) {
            var self = this,
                criteria = new Criteria().initWithSyntax(self.convertSyntax, v),
                descriptorPromise = this.foreignDescriptor || Promise.resolve(this.objectDescriptor),
                query;

            return descriptorPromise.then(function (typeToFetch) {
                var type = [typeToFetch.module.id, typeToFetch.name].join("/");

                if (self.serviceIdentifier) {
                    criteria.parameters.serviceIdentifier = self.serviceIdentifier;
                }

                query = DataQuery.withTypeAndCriteria(type, criteria);

                return self.service ? self.service.then(function (service) {
                        return service.rootService.fetchData(query)
                    }) : null;
            });
        }
    },

    /**
     * Reverts the relationship back to raw data.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {string} v
     */
    revert: {
        value: function (v) {
            if (v) {
                if (!this._revertSyntax) {
                    return Promise.resolve(v);
                } else {
                    var scope = this.scope;
                    //Parameter is what is accessed as $ in expressions
                    scope.parameters = v;
                    return Promise.resolve(this._revertSyntax(scope));
                }

            }
            return Promise.resolve(undefined);
        }
    }

});

