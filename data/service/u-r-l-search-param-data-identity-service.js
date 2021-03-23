/**
 * @module montage/data/service/u-r-l-search-param-data-identity-service
 */

var DataService = require("data/service/data-service").DataService,
    DataIdentityService = require("data/service/data-identity-service").DataIdentityService,
    DataOperation = require("data/service/data-operation").DataOperation,
    DataIdentity = require("data/model/data-identity").DataIdentity,
    DataIdentityObjectDescriptor = require("data/model/data-identity.mjson").montageObject,
IdentityService;


/**
 *
 * @class
 * @extends DataIdentityService
 */
exports.URLSearchParamDataIdentityService = URLSearchParamDataIdentityService = DataIdentityService.specialize( /** @lends URLSearchParamDataIdentityService.prototype */ {


    constructor: {
        value: function URLSearchParamDataIdentityService() {
            DataIdentityService.call(this);
            /*
                This is done in DataService's constructor as well,
                needs to decide where is best, but not do it twice.
            */
            //IdentityService.identityServices.push(this);

            DataIdentityObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);

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

            value = deserializer.getProperty("dataIdentityQuery");
            if (value) {
                this.dataIdentityQuery = value;
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

    dataIdentityQuery: {
        value: undefined
    },

    _dataIdentity: {
        value: undefined
    },

    handleReadOperation: {
        value: function (operation) {
            var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
            this.fetchRawData(stream);
            DataService.mainService.unregisterDataStreamForDataOperation(operation);
        }
    },

    fetchRawData: {
        value: function (stream) {

            if(!this._dataIdentity) {
                this._dataIdentity = new DataIdentity();

                this.searchParamValue =
                appointmentOriginId = this.application.url.searchParams.get(this.searchParamName);

                this._dataIdentity.query = this.dataIdentityQuery;
            }

            this.addRawData(stream, [this._dataIdentity]);
            this.rawDataDone(stream);
        }
    }
}, {
});
