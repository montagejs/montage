/**
 * @module montage/data/service/u-r-l-search-param-identity-service
 */

var DataService = require("data/service/data-service").DataService,
    IdentityService = require("data/service/identity-service").IdentityService,
    DataOperation = require("data/service/data-operation").DataOperation,
    Identity = require("data/model/identity").Identity,
    IdentityObjectDescriptor = require("data/model/identity.mjson").montageObject,
    ReadEvent = require("../model/read-event").ReadEvent,
    URLSearchParamIdentityService;


/**
 *
 * @class
 * @extends DataIdentityService
 */
exports.URLSearchParamIdentityService = URLSearchParamIdentityService = IdentityService.specialize( /** @lends URLSearchParamIdentityService.prototype */ {


    constructor: {
        value: function URLSearchParamIdentityService() {
            IdentityService.call(this);

            return this;
        }
    },

     /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value:function (deserializer) {
            this.super(deserializer);

            value = deserializer.getProperty("searchParamName");
            if (value) {
                this.searchParamName = value;
            }

            value = deserializer.getProperty("identityQuery");
            if (value) {
                this.identityQuery = value;
            }

        }
    },


    /**
     * The name of search param the data service should get it's value from to create a DataIdentity
     *
     * @property {String} serializable
     * @default undefined
     */
    searchParamName: {
        value: undefined
    },

    searchParamValue: {
        value: undefined
    },

    identityQuery: {
        value: undefined
    },

    _identity: {
        value: undefined
    },

    handleReadOperation: {
        value: function (operation) {
            // var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
            var stream = this.contextForPendingDataOperation(operation);
            this.fetchRawData(stream);
            this.unregisterPendingDataOperation(operation);
        }
    },

    fetchRawData: {
        value: function (stream) {

            if(!this._identity) {
                this._identity = new Identity();

                this.searchParamValue =
                appointmentOriginId = this.application.url.searchParams.get(this.searchParamName);

                this._identity.scope = [this.identityQuery];
            }

            this.addRawData(stream, [this._identity]);
            this.rawDataDone(stream);
        }
    }
}, {
});
