
var Bindings = require("frb"),
    parse = require("frb/parse"),
    stringify = require("frb/stringify"),
    expand = require("frb/expand"),
    Scope = require("frb/scope"),
    Serializer = require("core/serialization").Serializer,
    Deserializer = require("core/serialization").Deserializer;

Serializer.defineSerializationUnit("bindings", function (serializer, object) {
    var inputs = Bindings.getBindings(object);
    var outputs = {};
    var hasBindings;

    for (var targetPath in inputs) {
        var input = inputs[targetPath];

        var output = {};

        if (("serializable" in input) && !input.serializable)
            continue;

        var sourcePath = input.sourcePath;
        var syntax = input.sourceSyntax;
        if (input.source !== object) {
            var label = serializer.getObjectLabel(input.source);
            var scope = new Scope({
                type: "component",
                label: label
            });
            scope.components = serializer;
            syntax = expand(syntax, scope);
        }

        var scope = new Scope();
        scope.components = serializer;
        sourcePath = stringify(syntax, scope);

        if (input.twoWay) {
            output["<->"] = sourcePath;
        } else {
            output["<-"] = sourcePath;
        }

        if (input.converter) {
            output.converter = input.converter;
        } else {
            output.convert = input.convert;
            output.revert = input.revert;
        }

        if (input.trace) {
            output.trace = true;
        }

        outputs[targetPath] = output;
        hasBindings = true;
    }

    return hasBindings ? outputs : undefined;
});

Deserializer.defineDeserializationUnit("bindings", function (deserializer, object, bindings) {

    // normalize old and busted bindings
    for (var targetPath in bindings) {
        var descriptor = bindings[targetPath];

        if (typeof descriptor !== "object") {
            throw new Error("Binding descriptor must be an object, not " + typeof descriptor);
            // TODO isolate the source document and produce a more useful error
        }

        if ("boundObject" in descriptor) {
            descriptor.source = deserializer.getObjectByLabel(descriptor.boundObject);
            if (descriptor.oneway) {
                descriptor["<-"] = descriptor.boundPropertyPath;
            } else {
                descriptor["<->"] = descriptor.boundPropertyPath;
            }
            delete descriptor.boundObject;
            delete descriptor.boundObjectPropertyPath;
            delete descriptor.oneway;
        } else {
            if (descriptor["<<->"]) {
                console.warn("WARNING: <<-> in bindings is deprectated, use <-> only, please update now.");
                descriptor["<->"] = descriptor["<<->"];
                delete descriptor["<<->"];
            }
        }
    }

    Bindings.defineBindings(object, bindings, {
        components: deserializer
    });

});

