
var Bindings = require("frb"),
    parse = require("frb/parse"),
    stringify = require("frb/stringify"),
    expand = require("frb/expand"),
    Serializer = require("core/serializer").Serializer,
    Deserializer = require("core/deserializer").Deserializer;

Serializer.defineSerializationUnit("bindings", function (object, serializer) {
    var inputs = Bindings.getBindings(object);
    var outputs = {};
    var hasBindings;

    var parameters = {
        serialization: serializer
    };

    for (targetPath in inputs) {
        var input = inputs[targetPath];
        var output = {};

        if (("serializable" in input) && !input.serializable)
            continue;

        var sourcePath = input.sourcePath;

        var syntax = expand(parse(sourcePath), null, parameters);
        sourcePath = stringify(syntax);

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

Deserializer.defineDeserializationUnit("bindings", function (object, bindings, deserializer) {

    // normalize old and busted bindings
    for (var targetPath in bindings) {
        var descriptor = bindings[targetPath];
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
        serialization: deserializer
    });

});

