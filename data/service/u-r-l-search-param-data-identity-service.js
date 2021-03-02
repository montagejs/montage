/**
 * @module montage/data/service/u-r-l-search-param-data-identity-service
 */

var DataIdentityService = require("data/service/data-identity-service").DataIdentityService,
DataIdentity = require("data/model/data-identity").DataIdentity,
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
