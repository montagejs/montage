var Bindings = require("frb"),
    stringify = require("frb/stringify"),
    expand = require("frb/expand"),
    Scope = require("frb/scope"),
    Serializer = require("../serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("../serialization/deserializer/montage-deserializer").MontageDeserializer,
    ONE_WAY = "<-",
    TWO_WAY = "<->";


Serializer.defineSerializationUnit("bindings", function (serializer, object) {
    var inputs = Bindings.getBindings(object),
        outputs = {},
        hasBindings,
        mapIter = inputs.keys(),
        targetPath;

    while (targetPath = mapIter.next().value) {
    //for (var targetPath in inputs) {
        var input = inputs.get(targetPath);

        var output = {};

        if (("serializable" in input) && !input.serializable) {
            continue;
        } else if (!input.sourceSyntax) {
            continue;
        }

        var sourcePath = input.sourcePath;
        var syntax = input.sourceSyntax;
        if (input.source && input.source !== object) {
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
            output[TWO_WAY] = sourcePath;
        } else {
            output[ONE_WAY] = sourcePath;
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

var deserializeBindings = exports.deserializeBindings = function (deserializer, object, bindings) {
    var commonDescriptor = {
        components: deserializer
    },
        targetPath,
        descriptor;

    for (targetPath in bindings) {
        descriptor = bindings[targetPath];

        if (typeof descriptor !== "object") {
            throw new Error("Binding descriptor must be an object, not " + typeof descriptor);
            // TODO isolate the source document and produce a more useful error
        }

        Bindings.defineBinding(object, targetPath, descriptor, commonDescriptor);
    }
};

//deprecated
Deserializer.defineDeserializationUnit("bindings", deserializeBindings);
