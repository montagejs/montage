var ExpressionDataMapping = require("montage/data/service/expression-data-mapping").ExpressionDataMapping,
    MainPersonService = require("spec/data/logic/service/main-person-service").MainPersonService,
    RawPersonService = require("spec/data/logic/service/raw-person-service").RawPersonService,
    RawPersonService2 = require("spec/data/logic/service/raw-person-service-b").RawPersonServiceB,
    ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor,
    DateConverter = require("montage/core/converter/date-converter").DateConverter;

var DataMapping = require("montage/data/service/data-mapping").DataMapping;

describe("A DataMapping at the DataService level", function() {
    var mainService = new MainPersonService(),
        rawService = new RawPersonService(),
        rawService2 = new RawPersonService2(),
        registrationPromise,
        personMapping, personReference, personDescriptor;

    var dateConverter = Object.create({}, {
            convert: {
                value: function (rawValue) {
                    return new Date(rawValue);
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


    person2Reference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/person-b", require);
    person2Descriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(person2Reference, "PersonB");
    person2Descriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", person2Descriptor, 1));
    person2Descriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("birthday", person2Descriptor, 1));

    mainService.addMappingForType(personMapping, personDescriptor);
    // rawService.addMappingForType(personMapping, personDescriptor);
    mainService.addChildService(rawService);

    registrationPromise = Promise.all([
        mainService.registerChildService(rawService, [personDescriptor]),
        mainService.registerChildService(rawService2, [person2Descriptor]),
    ]);

    it("can map properties with mapping in MainService", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(personDescriptor).then(function (results) {
                var person;
                expect(results).toBeDefined();
                person = results[0];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                person = results[1];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                person = results[2];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                expect(Array.isArray(results)).toBeTruthy();
                done();
            });
        });
    });

    it("can map properties with method in RawService", function (done) {
        registrationPromise.then(function () {
            mainService.fetchData(person2Descriptor).then(function (results) {
                var person;
                expect(results).toBeDefined();
                person = results[0];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                person = results[1];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                person = results[2];
                expect(person.name).toBeDefined();
                expect(person.birthday).toBeDefined();
                expect(person.birthday instanceof Date).toBe(true);
                expect(Array.isArray(results)).toBeTruthy();
                done();
            });
        });
    });


});
