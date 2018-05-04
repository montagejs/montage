var Criteria = require("montage/core/criteria").Criteria,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    ObjectDescriptor = require("montage/data/model/object-descriptor").ObjectDescriptor,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor,
    WeatherReportType = require("./logic/model/weather-report").Type,
    WeatherReport = require("./logic/model/weather-report").WeatherReport,
    serialize = require("montage/core/serialization/serializer/montage-serializer").serialize,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

var movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("A DataQuery", function() {

    it("can be created", function () {
        expect(new DataQuery()).toBeDefined();
    });

    it("initially has no type", function () {
        expect(new DataQuery().type).toBeUndefined();
    });

    it("preserves its type", function () {
        var selector = new DataQuery(),
            type = new ObjectDescriptor(),
            name = "String" + Math.random();
        type.name = name;
        selector.type = type;
        expect(selector.type).toBe(type);
        expect(selector.type.name).toEqual(name);
    });

    xit("initially has no criteria", function () {
        expect(new DataQuery().criteria).toBeUndefined();
    });

    xit("preserves its criteria", function () {
        var selector = new DataQuery(),
            criteria = {a: Math.random(), b: Math.random(), c: Math.random()};
        selector.criteria.a = criteria.a;
        selector.criteria.b = criteria.b;
        selector.criteria.c = criteria.c;
        expect(selector.criteria).toEqual(criteria);
    });





    describe("can serialize and deserialize", function () {

        var dataExpression = "city = $city && unit = $unit && country = $country";
        var dataParameters = {
            city: 'San-Francisco',
            country: 'us',
            unit: 'imperial'
        }, dataType, dataCriteria, dataQuerySource, dataQueryJson, dataQueryJsonObj;

        it("with constructor as type", function (done) {
    
            dataType = WeatherReport;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
    
            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);
    
            try {
                expect(dataQueryJson).toBeDefined();
                var dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.weatherreport).toBeDefined();
                expect(dataQueryJsonObj.weatherreport.object).toBe('spec/data/logic/model/weather-report');
    
                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('montage/core/criteria');
                var dataQuery = deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryJson).toBeDefined();
                    done();
                }, function (err) {
                    fail(err);
                });
    
            } catch (err) {
                fail(err);
            }
        });

        it("with programmatic objectDescriptor as type", function (done) {

            var weatherReportReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/weather-report", require),
                weatherReportDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(weatherReportReference, "WeatherReport");
                
            weatherReportDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("title", weatherReportDescriptor, 1));
    
            dataType = weatherReportDescriptor;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
    
            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);
            try {
                expect(dataQueryJson).toBeDefined();
                var dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.objectDescriptor_weatherreport).toBeDefined();
                expect(dataQueryJsonObj.objectDescriptor_weatherreport.prototype).toBeDefined();
                // expect(dataQueryJsonObj.weatherreport.object).toBe('spec/data/logic/model/weather-report');
    
                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('montage/core/criteria');

                deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryFromJson).toBeDefined();
                    done();
                }, function (err) {
                    fail(err);
                });
    
            } catch (err) {
                fail(err);
            }

        });

        it("with mjson objectDescriptor as type", function (done) {
            dataType = movieDescriptor;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
    
            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);

            try {
                expect(dataQueryJson).toBeDefined();
                dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.root.values.typeModule["%"]).toBe(movieDescriptor.objectDescriptorInstanceModule.id);
    
                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('montage/core/criteria');

                deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryFromJson).toBeDefined();
                    expect(dataQueryFromJson.type).toBe(movieDescriptor);
                    done();
                }, function (err) {
                    fail(err);
                });
    
            } catch (err) {
                fail(err);
            }

        });


    });
});
