var DataService = require("montage/data/service/data-service").DataService,
    HttpService = require("montage/data/service/http-service").HttpService,
    DataSelector = require("montage/data/service/data-selector").DataSelector,
    Criteria = require("montage/core/criteria").Criteria,
    WeatherReport = require("./logic/model/weather-report").WeatherReport,
    WeatherService = require("./logic/service/weather-service").WeatherService,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("An HttpService", function() {

    it("needs to be tested", function (done) {

        var dataExpression = "city = $city && unit = $unit && country = $country";
        var dataParameters = {
            city: 'San-Francisco',
            country: 'us',
            unit: 'imperial'
        };
        var dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
        var dataType = WeatherReport.TYPE;
        var dataQuery  = DataSelector.withTypeAndCriteria(dataType, dataCriteria);

        var mainService = new DataService();
        var weatherService = new WeatherService();


        //TODO: Test with addChildService in addition to registerChildService
        mainService.registerChildService(weatherService).then(function () {
            expect(weatherService instanceof HttpService).toBe(true);
            /*
            // TODO fail 404, use mock service or other http service see 
            // ./logic/service/weather-service.js for changes to be made

            mainService.fetchData(dataQuery).then(function (weatherReports) {
                expect(typeof weatherReports[0].temp).toBe('number');
            });
            */
            done();    
        })
    });

});
