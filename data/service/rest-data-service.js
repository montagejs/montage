var HttpService = require("data/service/http-service.js");


/**
 * Manages data objects and maps CRUD actions to REST service endpoints.
 *
 * RestDataService minimizes the set up effort required to work with RESTful services
 * and provides the tools necessary to account for API variations on services that deviate
 * from REST.
 *
 * RestDataService subclasses that implement their own constructor should call this
 * class' constructor at the beginning of their constructor implementation
 * with code like the following:
 *
 *     RestDataService.call(this);
 *
 *
 * Currently only one service tree with one
 * [root services]{@link RestDataService#rootService} is supported, and every
 * instance of RestDataService or a RestDataService subclasses must either be that root
 * service or be set as a descendent of that root service.
 *
 * @class
 * @extends external:HttpService
 */


/***
 * TODO
 * 1. Add logic to immediately invalidate cache after a write action
 */

exports.RestDataService = HttpService.specialize({

    deserializeSelf: {
        value:function (deserializer) {
            var value;
            value = deserializer.getProperty("restMappings");
            if (value) {
                Array.prototype.push.apply(this._restMappings, value);
            }

            this.super(deserializer);

        }
    },

    _restMappings: {
        get: function () {
            if (!this._restMappings) {
                this._restMappings = [];
            }
            return this._restMappings;
        }
    }

});
