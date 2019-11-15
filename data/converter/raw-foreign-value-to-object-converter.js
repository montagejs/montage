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

                    if (self.serviceIdentifier) {
                        criteria.parameters.serviceIdentifier = self.serviceIdentifier;
                    }

                    query = DataQuery.withTypeAndCriteria(typeToFetch, criteria);

                    return self.service ? self.service.then(function (service) {
                        return service.rootService.fetchData(query);
                    }) : null;
                });
            }
            else {
                return Promise.resolve(null);
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
                //No specific instruction, so we return the primary keys using default assumptions.
                if (!this.compiledRevertSyntax) {
                    return this.service ? this.service.then(function (service) {

                        if(v instanceof Array) {
                            var result=[];
                            //forEach skipps over holes of a sparse array
                            v.forEach(function(value) {
                                result.push(service.dataIdentifierForObject(value).primaryKey);
                            });
                            return result;
                        }
                        else {
                            return service.dataIdentifierForObject(v).primaryKey;
                        }

                    }) : Promise.resolve(v);
                } else {
                    var scope = this.scope;
                    //Parameter is what is accessed as $ in expressions
                    scope.parameters = v;
                    scope.value = this;
                    return Promise.resolve(this.compiledRevertSyntax(scope));
                }

            }
            return Promise.resolve();
        }
    }

});
