var ObjectDescriptor = require("montage/data/model/object-descriptor").ObjectDescriptor,
    Montage = require("montage").Montage,
    PropertyDescriptor = require("montage/data/model/property-descriptor").PropertyDescriptor;

describe("An ObjectDescriptor", function() {

    it("can be created", function () {
        expect(new ObjectDescriptor()).toBeDefined();
    });

    it("initially has no type name", function () {
        expect(new ObjectDescriptor().typeName).toBeUndefined();
    });

    it("preserves its type name", function () {
        var descriptor = new ObjectDescriptor(),
            name = "String" + Math.random();
        descriptor.typeName = name;
        expect(descriptor.typeName).toEqual(name);
    });

    it("has Montage.prototype as its initial object prototype value", function () {
        expect(new ObjectDescriptor().objectPrototype).toEqual(Montage.prototype);
    });

    it("preserves its object prototype value", function () {
        var descriptor = new ObjectDescriptor(),
            prototype = Object.create({});
        descriptor.objectPrototype = prototype;
        expect(descriptor.objectPrototype).toBe(prototype);
    });

    it("initially has no property descriptors", function () {
        expect(new ObjectDescriptor().propertyDescriptors).toEqual({});
    });

    it("preserves its property descriptors", function () {
        var descriptor = new ObjectDescriptor(),
            properties = {},
            i;
        properties["property" + Math.random()] = new PropertyDescriptor();
        properties["property" + Math.random()] = new PropertyDescriptor();
        properties["property" + Math.random()] = new PropertyDescriptor();
        for (i in properties) {
            descriptor.setPropertyDescriptor(i, properties[i]);
        }
        expect(descriptor.propertyDescriptors).toEqual(properties);
    });

    it("can be created with a getter", function () {
        var className1 = "Class" + Math.random(),
            className2 = "Class" + Math.random(),
            propertyName1 = "property" + Math.random(),
            propertyName2 = "property" + Math.random(),
            propertyName3 = "property" + Math.random(),
            propertyName4 = "property" + Math.random(),
            exports = {},
            descriptors1 = {},
            descriptors2 = {},
            descriptor1,
            descriptor2;
        descriptors1[propertyName1] = {value: Math.random()};
        descriptors1[propertyName2] = {value: Math.random()};
        descriptors2[propertyName3] = {value: Math.random()};
        descriptors2[propertyName4] = {value: Math.random()};
        exports[className1] = Montage.specialize(descriptors1);
        exports[className2] = Montage.specialize(descriptors2);
        descriptor1 = ObjectDescriptor.getterFor(exports, className1).call({});
        descriptor2 = ObjectDescriptor.getterFor(exports, className2).call({});
        expect(descriptor1).not.toEqual(descriptor2);
        expect(descriptor1.typeName).toEqual(className1);
        expect(descriptor2.typeName).toEqual(className2);
        expect(Object.keys(descriptor1.propertyDescriptors).sort()).toEqual(['_serializableAttributeProperties', propertyName1, propertyName2].sort());
        expect(Object.keys(descriptor2.propertyDescriptors).sort()).toEqual(['_serializableAttributeProperties', propertyName3, propertyName4].sort());
    });

    // TODO [Charles]: Update this for API changes.
    xit("can add relationships", function () {
        // Generate test data.
        var descriptor = new ObjectDescriptor(),
            type1 = new ObjectDescriptor(),
            type2 = new ObjectDescriptor(),
            expressions1 = {foo: "String" + Math.random(), bar: "String" + Math.random()},
            expressions2 = {a: "String" + Math.random(), b: "String" + Math.random()},
            expressions3 = {x: "String" + Math.random(), y: "String" + Math.random()},
            expressions4 = {},
            relationship1;
        // Add one relationship.
        type1.name = "String" + Math.random();
        descriptor._addRelationship({
            destinationType: type1,
            valueExpressions: expressions1,
            criteriaExpressions: expressions2,
        });
        // Verify that the corresponding relationship descriptors were added.
        expect(Object.keys(descriptor.properties).sort()).toEqual(["bar", "foo"]);
        expect(descriptor.properties.foo).toEqual(jasmine.any(PropertyDescriptor));
        expect(descriptor.properties.foo.relationship).toEqual(jasmine.any(RelationshipDescriptor));
        expect(descriptor.properties.foo.relationship.destinationType).toBe(type1);
        expect(descriptor.properties.foo.relationship.valueExpressions).toEqual(expressions1);
        expect(descriptor.properties.foo.relationship.criteriaExpressions).toEqual(expressions2);
        expect(descriptor.properties.bar).toEqual(jasmine.any(PropertyDescriptor));
        expect(descriptor.properties.bar.relationship).toBe(descriptor.properties.foo.relationship);
        // Record some state for later testing.
        property1 = descriptor.properties.foo;
        property2 = descriptor.properties.bar;
        // Add another relationship.
        type2.name = "String" + Math.random();
        descriptor._addRelationship({
            destinationType: type2,
            valueExpressions: expressions3,
            criteriaExpressions: expressions4,
        });
        // Verify that the properties corresponding to the originally added
        // relationship have not been affected.
        expect(descriptor.properties.foo).toBe(property1);
        expect(descriptor.properties.bar).toBe(property2);
        // Verify that the correspondingproperty descriptors have been added,
        // and that they all includes a reference to the added relationship.
        expect(Object.keys(descriptor.properties).sort()).toEqual(["bar", "foo", "x", "y"]);
        expect(descriptor.properties.x).toEqual(jasmine.any(PropertyDescriptor));
        expect(descriptor.properties.x.relationship).toEqual(jasmine.any(RelationshipDescriptor));
        expect(descriptor.properties.x.relationship.destinationType).toBe(type2);
        expect(descriptor.properties.x.relationship.valueExpressions).toEqual(expressions3);
        expect(descriptor.properties.x.relationship.criteriaExpressions).toEqual(expressions4);
        expect(descriptor.properties.y).toEqual(jasmine.any(PropertyDescriptor));
        expect(descriptor.properties.y.relationship).toBe(descriptor.properties.x.relationship);
    });


    xit("needs to be further tested", function () {});

});
