var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService,
    DataSelector = require("montage/data/service/data-selector").DataSelector,
    WeatherReport = require("../model/weather-report").WeatherReport;

/**
 * Provides area briefs data for Contour applications.
 *
 * @class
 * @extends external:DataService
 */
 var WeatherService = exports.WeatherService = HttpService.specialize(/** @lends AreaBriefService.prototype */ {

    API_KEY: {
        value: '7593a575795cbd73f54c69a321ed86fe'
    },

    ENDPOINT: {
        value: 'http://api.openweathermap.org/data/2.5/'
    },

    types: {
        value: [WeatherReport.TYPE]
    },

    fetchRawData: {
        value: function (stream) {
            var self = this,
                criteria = stream.query.criteria;

            return self.fetchHttpRawData(this._getUrl(criteria, true), false).then(function (data) {
                if (data) {
                    self.addRawData(stream, [data], criteria);
                    self.rawDataDone(stream);
                }
            });
        }
    },

    mapRawDataToObject: {
        value: function (rawData, object, criteria) {
            object.temp = rawData.main.temp;
        }
    },

    _getUrl: {
        value: function (criteria, detect) {
            var parameters = criteria.parameters;
            return this.ENDPOINT + "weather?q=" + parameters.city + "," + parameters.country + "&units=" + parameters.unit + "&appid=" + this.API_KEY;
        }
    }
});
