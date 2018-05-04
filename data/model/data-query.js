var Montage = require("montage").Montage,
    ModuleReference = require("core/module-reference").ModuleReference;

/**
 * Defines the criteria that objects must satisfy to be included in a set of
 * data as well as other characteristics that data must possess.
 *
 * @class
 * @extends external:Montage
 */
exports.DataQuery = Montage.specialize(/** @lends DataQuery.prototype */ {


    deserializeSelf: {
        value: function (deserializer) {
            var result, value;

            value = deserializer.getProperty("criteria");
            if (value !== void 0) {
                this.criteria = value;
            }

            value = deserializer.getProperty("orderings");
            if (value !== void 0) {
                this.orderings = value;
            }

            value = deserializer.getProperty("prefetchExpressions");
            if (value !== void 0) {
                this.prefetchExpressions = value;
            }

            value = deserializer.getProperty("selectBindings");
            if (value !== void 0) {
                this.selectBindings = value;
            }

            value = deserializer.getProperty("selectExpression");
            if (value !== void 0) {
                this.selectExpression = value;
            }

            
            value = deserializer.getProperty("type");
            if (value !== void 0) {
                this.type = value;
            } else {
                value = deserializer.getProperty("typeModule");
                if (value) {
                    var self = this;
                    
                    result = value.require.async(value.id).then(function (exports) {
                        self.type = exports.montageObject;
                        return self;
                    });
                }
            }

            return result || Promise.resolve(this);
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("criteria", this.criteria);
            serializer.setProperty("orderings", this.orderings);
            serializer.setProperty("prefetchExpressions", this.prefetchExpressions);
            serializer.setProperty("selectBindings", this.selectBindings);
            serializer.setProperty("selectExpression", this.selectExpression);
            
            if (this.type.objectDescriptorInstanceModule) {
                serializer.setProperty("typeModule", this.type.objectDescriptorInstanceModule);
            } else {
                serializer.setProperty("type", this.type);
            }

        }
    },

    /**
     * The type of the data object to retrieve.
     *
     * @type {DataObjectDescriptor}
     */
    type: {
        serializable: "value",
        value: undefined
    },

    /**
     * An object defining the criteria that must be satisfied by objects for
     * them to be included in the data set defined by this query.
     *
     * Initially this can be any object and will typically be a set of key-value
     * pairs, ultimately this will be a boolean expression to be applied to data
     * objects to determine whether they should be in the selected set or not.
     *
     * @type {Object}
     */
    criteria: {
        get: function () {
            if (!this._criteria) {
                this._criteria = {};
            }
            return this._criteria;
        },
        set: function (criteria) {
            this._criteria = criteria;
        }
    },

    _criteria: {
        value: undefined
    },

    /**
     * An array of DataOrdering objects which, combined, define the order
     * desired for the data in the set specified by this query.
     *
     * @type {Array}
     */
    orderings: {
        get: function () {
            if (!this._orderings) {
                this._orderings = [];
            }
            return this._orderings;
        },
        set: function (orderings) {
            this._orderings = orderings;
        }
    },

    _orderings: {
        value: undefined
    },

    /**
     * An object defining bindings that will be created on the array
     * of the dataStream returned by DataService's fetchData. The bindings
     * follow the same syntax as used for regular bindings, creating dynamic
     * properties that array. Expressions on the right side starts by data as the
     * source is automatically set to the DataStream used in a fetchData and
     * DataStream's data property is an array containing the results.
     *
     * For example, if one would want the number of objects fetched, one would do:
     *  aDataQuery.selectBindings = {
     *      "count": {"<-": "data.length"
     * };
     *
     *  aDataQuery.selectBindings = {
     *      "averageAge": {"<-": "data.map{age}.average()"
     * };
     * will add on the array passed to the then function following a fetchData
     * a property averageAge with the average of the property age of all object in the array
     *
     *   aDataQuery.selectBindings = {
     *       "clothingByColor": {"<-": "data.group{color}"
     *   };
     *   mainService.fetchData(aDataQuery).then(function(results){
     *   //assuming  results is [
     *   //     {type: 'shirt', color: 'blue'},
     *   //     {type: 'pants', color: 'red'},
     *   //     {type: 'blazer', color: 'blue'},
     *   //     {type: 'hat', color: 'red'}
     *   // ];
     *
     *   expect(results.clothingByColor).toEqual([
     *           ['blue', [
     *           {type: 'shirt', color: 'blue'},
     *           {type: 'blazer', color: 'blue'}
     *       ]],
     *       ['red', [
     *           {type: 'pants', color: 'red'},
     *           {type: 'hat', color: 'red'}
     *       ]]
     *   ]);
     *  })
     * Since it is a one-way binding, if a DataService is capable of live updating a query,
     * the value these properties created on the array will stay current/updated over time.
     *
     * It is possible that a DataService may obtain the results of these properties from the
     * server itself, which is preferred, as fetchData can returns objects in batches. These
     * expressions should be built from the whole result set, not the current client view of that
     * result set.
     * @type {Object}
     */

    selectBindings: {
        value: undefined
    },

    selectExpression: {
        value: undefined
    },


    /**
     * An object defining a list of expressions to resolve at the same time as the query.
     * expressions are based on the content of results described by criteria. A common
     * use is to prefetch relationships off fetched objects.
     * @type {Array}
     */

    prefetchExpressions: {
        value: null
    }

}, /** @lends DataQuery */ {

    /**
     * @todo Document.
     */
    withTypeAndCriteria: {
        value: function (type, criteria) {
            var query;
            query = new this();
            query.type = type;
            query.criteria = criteria;
            return query;
        }
    }

});
