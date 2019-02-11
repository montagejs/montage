var ExpressionDataMappingConverter = require("./expression-data-mapping-converter").ExpressionDataMappingConverter,
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
 * @extends ExpressionDataMappingConverter
 */
exports.RawPropertyValueToObjectConverter = ExpressionDataMappingConverter.specialize( /** @lends RawPropertyValueToObjectConverter# */ {


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
                query;

            return this._descriptorToFetch.then(function (typeToFetch) {
                var type = [typeToFetch.module.id, typeToFetch.name].join("/");

                if (self.serviceIdentifier) {
                    criteria.parameters.serviceIdentifier = self.serviceIdentifier;
                }

                query = DataQuery.withTypeAndCriteria(type, criteria);

                return self.service ? self.service.then(function (service) {
                    return service.rootService.fetchData(query);
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
                if (!this.compiledRevertSyntax) {
                    return Promise.resolve(v);
                } else {
                    var scope = this.scope;
                    //Parameter is what is accessed as $ in expressions
                    scope.value = v;
                    return Promise.resolve(this.compiledRevertSyntax(scope));
                }

            }
            return Promise.resolve(undefined);
        }
    }

});
