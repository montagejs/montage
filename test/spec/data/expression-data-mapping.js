var ExpressionDataMapping = require("montage/data/service/expression-data-mapping").ExpressionDataMapping,
    CategoryService = require("spec/data/service/category-service").CategoryService,
    DataService = require("montage/data/service/data-service").DataService,
    DateConverter = require("montage/core/converter/date-converter").DateConverter,
    ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    Promise = require("montage/core/promise").Promise,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    RawPropertyValueToObjectConverter = require("montage/data/converter/raw-property-value-to-object-converter").RawPropertyValueToObjectConverter;

describe("An Expression Data Mapping", function() {

    var categoryMapping,
        categoryModuleReference,
        categoryObjectDescriptor,
        categoryPropertyDescriptor,
        categoryService,
        dateConverter,
        mainService,
        isFeaturedPropertyDescriptor,
        movieBudgetPropertyDescriptor,
        movieMapping,
        movieModuleReference,
        movieObjectDescriptor,
        movieReleaseDatePropertyDescriptor,
        movieSchema,
        movieSchemaModuleReference,
        movieService,
        plotSummaryModuleReference,
        plotSummaryObjectDescriptor,
        plotSummaryPropertyDescriptor,
        registrationPromise,
        schemaBudgetPropertyDescriptor,
        schemaIsFeaturedPropertyDescriptor,
        schemaReleaseDatePropertyDescriptor;


    dateConverter = Object.create({}, {
        converter: {
            value: new DateConverter()
        },
        formatString: {
            value: "MM/dd/yyyy"
        },
        convert: {
            value: function (rawValue) {
                return new Date(Date.parse(rawValue));
            }
        },
        revert: {
            value: function (date) {
                this.converter.pattern = this.formatString;
                return this.converter.convert(date);
            }
        }
    });

    DataService.mainService = undefined;
    mainService = new DataService();
    mainService.NAME = "Movies";
    movieService = new RawDataService();
    movieModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/model/logic/movie", require);
    movieObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(movieModuleReference, "Movie");
    movieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("title", movieObjectDescriptor, 1));
    movieSchemaModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/schema/logic/movie", require);
    movieSchema = new ModuleObjectDescriptor().initWithModuleAndExportName(movieSchemaModuleReference, "Movie");
    categoryService = new CategoryService();

    categoryModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/model/logic/category", require);
    categoryObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(categoryModuleReference, "Category");
    categoryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", categoryObjectDescriptor, 1));
    categoryPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("category", movieObjectDescriptor, 1);
    categoryPropertyDescriptor.valueDescriptor = categoryObjectDescriptor;
    movieObjectDescriptor.addPropertyDescriptor(categoryPropertyDescriptor);

    plotSummaryModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/model/logic/plot-summary", require);
    plotSummaryObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(plotSummaryModuleReference, "PlotSummary");
    plotSummaryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("summary", plotSummaryObjectDescriptor, 1));
    plotSummaryPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("plotSummary", movieObjectDescriptor, 1);
    plotSummaryPropertyDescriptor.valueDescriptor = plotSummaryObjectDescriptor;
    movieObjectDescriptor.addPropertyDescriptor(plotSummaryPropertyDescriptor);

    schemaBudgetPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("budget", movieSchema, 1);
    movieSchema.addPropertyDescriptor(schemaBudgetPropertyDescriptor);
    movieBudgetPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("budget", movieObjectDescriptor, 1);
    movieBudgetPropertyDescriptor.valueType = "number";
    movieObjectDescriptor.addPropertyDescriptor(movieBudgetPropertyDescriptor);

    movieReleaseDatePropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("releaseDate", movieObjectDescriptor, 1);
    movieObjectDescriptor.addPropertyDescriptor(movieReleaseDatePropertyDescriptor);

    isFeaturedPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("isFeatured", movieObjectDescriptor, 1);
    isFeaturedPropertyDescriptor.valueType = "boolean";
    movieObjectDescriptor.addPropertyDescriptor(isFeaturedPropertyDescriptor);
    schemaIsFeaturedPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("is_featured", movieSchema, 1);
    schemaIsFeaturedPropertyDescriptor.valueType = "string";
    movieSchema.addPropertyDescriptor(schemaIsFeaturedPropertyDescriptor);

    movieMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(movieService, movieObjectDescriptor, movieSchema);
    movieMapping.addRequisitePropertyName("title", "category", "budget", "isFeatured", "releaseDate");
    movieMapping.addObjectMappingRule("title", {"<->": "name"});
    movieMapping.addObjectMappingRule("category", {
        "<-": "category_id",
        converter: new RawPropertyValueToObjectConverter().initWithConvertExpression("category_id")
    });
    movieMapping.addObjectMappingRule("releaseDate", {
        "<->": "release_date",
        converter: dateConverter
    });
    movieMapping.addObjectMappingRule("budget", {"<-": "budget"});
    movieMapping.addObjectMappingRule("isFeatured", {"<-": "is_featured"});
    movieMapping.addRawDataMappingRule("budget", {"<-": "budget"});
    movieMapping.addRawDataMappingRule("is_featured", {"<-": "isFeatured"});
    movieService.addMappingForType(movieMapping, movieObjectDescriptor);
    categoryMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(categoryService, categoryObjectDescriptor);
    categoryMapping.addObjectMappingRule("name", {"<->": "name"});
    categoryMapping.addRequisitePropertyName("name");
    categoryService.addMappingForType(categoryMapping, categoryObjectDescriptor);

    it("can be created", function () {
        expect(new ExpressionDataMapping()).toBeDefined();
    });

    registrationPromise = Promise.all([
        mainService.registerChildService(movieService, movieObjectDescriptor),
        mainService.registerChildService(categoryService, categoryObjectDescriptor)
    ]);

    it("properly registers the object descriptor type to the mapping object in a service", function (done) {
        return registrationPromise.then(function () {
            expect(movieService.parentService).toBe(mainService);
            expect(movieService.mappingWithType(movieObjectDescriptor)).toBe(movieMapping);
            done();
        });
    });

    it("can map raw data to object properties", function (done) {
        var movie = {},
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true",
                release_date: "05/25/1977"
            };
        return movieMapping.mapRawDataToObject(data, movie).then(function () {
            expect(movie.title).toBe("Star Wars");
            expect(movie.category).toBeDefined();
            expect(movie.category && movie.category.name === "Action").toBeTruthy();
            expect(typeof movie.releaseDate === "object").toBeTruthy();
            expect(movie.releaseDate.getDate()).toBe(25);
            expect(movie.releaseDate.getMonth()).toBe(4);
            expect(movie.releaseDate.getFullYear()).toBe(1977);
            done();
        });
    });

    it("can automatically convert raw data to the correct type", function (done) {
        var movie = {},
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true"

            };
        return movieMapping.mapRawDataToObject(data, movie).then(function () {
            expect(typeof movie.budget === "number").toBeTruthy();
            expect(typeof movie.category === "object").toBeTruthy();
            expect(typeof movie.isFeatured === "boolean").toBeTruthy();
            expect(typeof movie.title === "string").toBeTruthy();
            done();
        });
    });

    it("can map objects to raw data", function (done) {
        var movie = {
                title: "Star Wars",
                budget: 14000000.00,
                isFeatured: true,
                releaseDate: new Date(1977, 4, 25)
            },
            data = {};
        movieMapping.mapObjectToRawData(movie, data).then(function () {
            expect(data.name).toBe("Star Wars");
            expect(data.budget).toBe("14000000");
            expect(data.is_featured).toBe("true");
            expect(data.release_date).toBe("05/25/1977");
            done();
        });
    });

    it("can automatically revert objects to raw data of the correct type", function (done) {
        var movie = {
                title: "Star Wars",
                budget: 14000000.00,
                isFeatured: true
            },
            data = {};
        movieMapping.mapObjectToRawData(movie, data).then(function () {
            expect(typeof data.budget === "string").toBeTruthy();
            expect(typeof data.is_featured === "string").toBeTruthy();
            expect(typeof data.name === "string").toBeTruthy();
            done();
        });
    });


});
