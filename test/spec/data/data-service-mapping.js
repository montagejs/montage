var ExpressionDataMapping = require("montage/data/service/expression-data-mapping").ExpressionDataMapping,
    MainPersonService = require("spec/data/logic/service/main-person-service").MainPersonService,
    RawPersonService = require("spec/data/logic/service/raw-person-service").RawPersonService,
    RawPersonServiceB = require("spec/data/logic/service/raw-person-service-b").RawPersonServiceB,
    RawPersonServiceC = require("spec/data/logic/service/raw-person-service-c").RawPersonServiceC,
    RawPersonServiceD = require("spec/data/logic/service/raw-person-service-d").RawPersonServiceD,
    RawPersonChildService = require("spec/data/logic/service/raw-person-child-service").RawPersonChildService,
    ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor,
    DateConverter = require("montage/core/converter/date-converter").DateConverter,
    RawPropertyValueToObjectConverter = require("montage/data/converter/raw-property-value-to-object-converter").RawPropertyValueToObjectConverter;

var DataMapping = require("montage/data/service/data-mapping").DataMapping;

describe("A DataMapping at the DataService level", function() {
    var mainService = new MainPersonService(),
        rawService = new RawPersonService(),
        rawServiceB = new RawPersonServiceB(),
        rawServiceC = new RawPersonServiceC(),
        rawServiceD = new RawPersonServiceD(),
        rawChildService = new RawPersonChildService(),
        registrationPromise,
        personMapping, personReference, personDescriptor,
        personBMapping, personBReference, personBDescriptor,
        personCMapping, personCReference, personCDescriptor,
        personDMapping, personDReference, personDDescriptor,
        employerConverter, positionConverter;

    var dateConverter = Object.create({}, {
            convert: {
                value: function (rawValue) {
                    return rawValue !== undefined ? new Date(rawValue) : undefined;
                }
            },
            revert: {
                value: function (date) {
                    return date.getTime();
                }
            }
        });

    // rawService
    personReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/person", require);
    personDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(personReference, "Person");
    personDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", personDescriptor, 1));
    personDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("birthday", personDescriptor, 1));
    personDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("location", personDescriptor, 1));

    personMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(rawService, personDescriptor);
    personMapping.addRequisitePropertyName("name", "birthday");
    personMapping.addObjectMappingRule("name", {
        "<->": "name"
    });
    personMapping.addObjectMappingRule("birthday", {
        "<->": "birth_date",
        converter: dateConverter
    });


    personBReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/person-b", require);
    personBDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(personBReference, "PersonB");
    personBDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", personBDescriptor, 1));
    personBDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("birthday", personBDescriptor, 1));

    personBMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(rawServiceB, personBDescriptor);
    personBMapping.addRequisitePropertyName("name", "birthday");
    personBMapping.addObjectMappingRule("name", {
        "<->": "name"
    });
    personBMapping.addObjectMappingRule("birthday", {
        "<->": "birth_date",
        converter: dateConverter
    });

    personCReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/person-c", require);
    personCDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(personCReference, "PersonC");
    personCDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", personCDescriptor, 1));
    personCDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("birthday", personCDescriptor, 1));

    personCMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(rawServiceC, personCDescriptor);
    personCMapping.addRequisitePropertyName("name", "birthday");
    personCMapping.addObjectMappingRule("name", {
        "<->": "name"
    });
    personCMapping.addObjectMappingRule("birthday", {
        "<->": "birth_date",
        converter: dateConverter
    });

    personDReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/person-d", require);
    personDDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(personDReference, "PersonD");
    personDDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", personDDescriptor, 1));
    personDDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("birthday", personDDescriptor, 1));
    personDDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("employer", personDDescriptor, 1));
    personDDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("position", personDDescriptor, 1));

    personDMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(rawServiceD, personDDescriptor);
    personDMapping.addRequisitePropertyName("name", "birthday", "employer", "position");
    personDMapping.addObjectMappingRule("name", {
        "<->": "name"
    });
    personDMapping.addObjectMappingRule("birthday", {
        "<->": "birth_date",
        converter: dateConverter
    });

    employerConverter = new RawPropertyValueToObjectConverter().initWithConvertExpression("employer_name == employer");
    employerConverter.service = rawServiceD;
    employerConverter.serviceIdentifier = "spec/data/logic/service/raw-person-child-service";
    employerConverter.isEmployerConverter = true;
    personDMapping.addObjectMappingRule("employer", {
        "<-": "{employer_name: employer_name}",
        converter: employerConverter
    });
    positionConverter = new RawPropertyValueToObjectConverter().initWithConvertExpression("position_name == position");
    positionConverter.service = rawServiceD;
    positionConverter.serviceIdentifier = "spec/data/logic/service/raw-person-child-service";
    personDMapping.addObjectMappingRule("position", {
        "<-": "{position_name: position_name}",
        converter: positionConverter
    });

    mainService.addMappingForType(personMapping, personDescriptor);
    mainService.addMappingForType(personBMapping, personBDescriptor);
    mainService.addMappingForType(personCMapping, personCDescriptor);
    mainService.addMappingForType(personDMapping, personDDescriptor);
    rawServiceD.addChildService(rawChildService);

    registrationPromise = Promise.all([
        mainService.registerChildService(rawService, [personDescriptor]),
        mainService.registerChildService(rawServiceB, [personBDescriptor]),
        mainService.registerChildService(rawServiceC, [personCDescriptor]),
        mainService.registerChildService(rawServiceD, [personDDescriptor]),
    ]);

    it("can map properties with mapping in MainService", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(personDescriptor).then(function (results) {
                var test  = function (person) {
                    expect(person.name).toBeDefined();
                    expect(person.birthday).toBeDefined();
                    expect(person.birthday instanceof Date).toBe(true);
                    expect(person.birth_date).toBeUndefined();
                }
                console.log("results.1", results);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBeTruthy();
                results.forEach(test);
                done();
            });
        });
    });

    it("can map properties with method in RawService", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(personBDescriptor).then(function (results) {
                var test  = function (person) {
                    expect(person.name).toBeDefined();
                    expect(person.birthday).toBeDefined();
                    expect(person.birthday instanceof Date).toBe(true);
                    expect(person.birth_date).toBeUndefined();
                }
                console.log("results.2", results);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBeTruthy();
                results.forEach(test);
                done();
            });
        });
    });

    it("can return mapped data from rawDataService", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(personCDescriptor).then(function (results) {
                var test  = function (person) {
                    expect(person.name).toBeDefined();
                    expect(person.person_name).toBeUndefined();
                    expect(person.birthday).toBeDefined();
                    expect(person.birthday instanceof Date).toBe(true);
                    expect(person.birth_date).toBeUndefined();
                }

                console.log("results.3", results);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBeTruthy();
                results.forEach(test);
                done();
            });
        });
    });

    it("can map raw data returned from child of rawData serviced", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(personDDescriptor).then(function (results) {

                var test  = function (person) {
                    expect(person.name).toBeDefined();
                    expect(person.person_name).toBeUndefined();
                    expect(person.birthday instanceof Date).toBe(true);
                    expect(person.birth_date).toBeUndefined();
                    expect(person.employer).toBeTruthy();
                    expect(person.position).toBeTruthy();
                }

                console.log("results.4", results);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBeTruthy();
                results.forEach(test);
                done();
            });
        });
    });

});
