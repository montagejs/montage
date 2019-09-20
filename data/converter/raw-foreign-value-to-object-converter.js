var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    Promise = require("core/promise").Promise;
/**
 * @class RawForeignValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends RawValueToObjectConverter
 */
exports.RawForeignValueToObjectConverter = RawValueToObjectConverter.specialize( /** @lends RawForeignValueToObjectConverter# */ {


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

            if((v && !(v instanceof Array )) || (v instanceof Array && v.length > 0)) {
                var self = this,
                criteria = new Criteria().initWithSyntax(self.convertSyntax, v),
                query;

                return this._descriptorToFetch.then(function (typeToFetch) {
                    var type = typeToFetch.module.id;

                    type += "/";
                    type += typeToFetch.name;

                    if (self.serviceIdentifier) {
                        criteria.parameters.serviceIdentifier = self.serviceIdentifier;
                    }

                    query = DataQuery.withTypeAndCriteria(type, criteria);

                    return self.service ? self.service.then(function (service) {
                        return service.rootService.fetchData(query);
                    }) : null;
                });
            }
            else {
                return Promise.resolve();
            }
        }
    },



    /**
     * Reverts the relationship back to raw data.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {Promise} v
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
            return Promise.resolve();
        }
    }

});
