var Bindings = require("frb"),
    stringify = require("frb/stringify"),
    assign = require("frb/assign"),
    evaluate = require("frb/evaluate"),
    expand = require("frb/expand"),
    Scope = require("frb/scope"),
    Serializer = require("../serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("../serialization/deserializer/montage-deserializer").MontageDeserializer,
    ONE_ASSIGNMENT = "=",
    ONE_WAY = "<-",
    TWO_WAY = "<->";

var serializeObjectBindings = exports.serializeObjectBindings = function (serializer, object) {
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

    return hasBindings ? outputs : void 0;
};

//deprecated
Serializer.defineSerializationUnit("bindings", serializeObjectBindings);

var deserializeObjectBindings = exports.deserializeObjectBindings = function (deserializer, object, bindings) {
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

        if (ONE_ASSIGNMENT in descriptor) {
            assign(
                object,
                targetPath,
                evaluate(descriptor[ONE_ASSIGNMENT], object, null, null, deserializer),
                null,
                null,
                deserializer
            );
        } else {
            Bindings.defineBinding(object, targetPath, descriptor, commonDescriptor);
        }
    }
};

//deprecated
Deserializer.defineDeserializationUnit("bindings", deserializeObjectBindings);
