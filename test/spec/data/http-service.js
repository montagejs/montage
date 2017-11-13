var DataService = require("montage/data/service/data-service").DataService,
    HttpService = require("montage/data/service/http-service").HttpService,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataSelector = require("montage/data/service/data-selector").DataSelector,
    Criteria = require("montage/core/criteria").Criteria,
    WeatherReport = require("./logic/model/weather-report").WeatherReport,
    WeatherService = require("./logic/service/weather-service").WeatherService,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("An HttpService", function() {

    // it("needs to be tested", function (done) {

    //     var dataExpression = "city = $city && unit = $unit && country = $country";
    //     var dataParameters = {
    //         city: 'San-Francisco',
    //         country: 'us',
    //         unit: 'imperial'
    //     };
    //     var dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
    //     var dataType = WeatherReport.TYPE;
    //     var dataQuery  = DataSelector.withTypeAndCriteria(dataType, dataCriteria);

    //     var mainService = new DataService();
    //     //TODO: Test with addChildService in addition to registerChildService
    //     mainService.registerChildService(new WeatherService()).then(function () {
    //         mainService.fetchData(dataQuery).then(function (weatherReports) {
    //             expect(typeof weatherReports[0].temp).toBe('number');
    //             done();
    //         });
    //     })
    // });

    describe("fetch http arguments", function () {
        it("can be parsed with query", function () {
            var service = new HttpService(),
                url = "http://montagestudio.com",
                headers = service.FORM_URL_ENCODED,
                body = null,
                types = [],
                query = new DataQuery(),
                sendCredentials = false,
                parsed;
    
            parsed = service._parseFetchHttpRawDataArguments(url, headers, body, types, query, sendCredentials);
    
            expect(parsed.url).toEqual(url);
            expect(parsed.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
            expect(parsed.body).toBe(undefined);
            expect(parsed.types).toBeDefined();
            expect(parsed.types.length).toEqual(1);
            expect(parsed.types[0]).toBe(HttpService.DataType.JSON);
            expect(parsed.query).toBe(query);
            expect(parsed.credentials).toEqual(sendCredentials);
    
            parsed = service._parseFetchHttpRawDataArguments(url, headers, body, query, sendCredentials);

            expect(parsed.url).toEqual(url);
            expect(parsed.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
            expect(parsed.body).toBe(undefined);
            expect(parsed.types).toBeDefined();
            expect(parsed.types.length).toEqual(1);
            expect(parsed.types[0]).toBe(HttpService.DataType.JSON);
            expect(parsed.query).toBe(query);
            expect(parsed.credentials).toEqual(sendCredentials);
        });
    
    
        it("can be parsed with method", function () {
            var service = new HttpService(),
                url = "http://montagestudio.com",
                headers = service.FORM_URL_ENCODED,
                body = null,
                types = [],
                method = "GET",
                sendCredentials = false,
                parsed;
    
            parsed = service._parseFetchHttpRawDataArguments(url, headers, body, types, method, sendCredentials);
    
            expect(parsed.url).toEqual(url);
            expect(parsed.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
            expect(parsed.body).toBe(undefined);
            expect(parsed.types).toBeDefined();
            expect(parsed.types.length).toEqual(1);
            expect(parsed.types[0]).toBe(HttpService.DataType.JSON);
            expect(parsed.method).toEqual(method);
            expect(parsed.credentials).toEqual(sendCredentials);
    
            parsed = service._parseFetchHttpRawDataArguments(url, headers, body, method, sendCredentials);

            expect(parsed.url).toEqual(url);
            expect(parsed.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
            expect(parsed.body).toBe(undefined);
            expect(parsed.types).toBeDefined();
            expect(parsed.types.length).toEqual(1);
            expect(parsed.types[0]).toBe(HttpService.DataType.JSON);
            expect(parsed.method).toEqual(method);
            expect(parsed.credentials).toEqual(sendCredentials);
        });
    })

    

});
