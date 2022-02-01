var Bindings = require("../frb/bindings"),
    stringify = require("../frb/stringify"),
    assign = require("../frb/assign"),
    evaluate = require("../frb/evaluate"),
    expand = require("../frb/expand"),
    Scope = require("../frb/scope"),
    ONE_ASSIGNMENT = "=",
    ONE_WAY = "<-",
    TWO_WAY = "<->";

var serializeObjectBindings = exports.serializeObjectBindings = function (serializer, object) {
    var inputs = Bindings.getBindings(object),
        outputs = {},
        hasBindings,
        mapIter = inputs.keys(),
        targetPath;

    while ((targetPath = mapIter.next().value)) {
    //for (var targetPath in inputs) {
        var input = inputs.get(targetPath);

        var output = {};

        if (("serializable" in input) && !input.serializable) {
            continue;
        } else if (!input.sourceSyntax) {
            continue;
        }

        var scope;
        var sourcePath = input.sourcePath;
        var syntax = input.sourceSyntax;
        if (input.source && input.source !== object) {
            var label = serializer.getObjectLabel(input.source);
            scope = new Scope({
                type: "component",
                label: label
            });
            scope.components = serializer;
            syntax = expand(syntax, scope);
        }

        scope = new Scope();
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


var deserializeObjectBindings = exports.deserializeObjectBindings = function deserializeObjectBindings(deserializer, object, bindings) {
    var commonDescriptor = {
        components: deserializer
    },
        targetPath,
        descriptor,
        i, keys;

    /* jshint forin: true */
    //for (targetPath in bindings) {
    for (i=0, keys = Object.keys(bindings); (targetPath = keys[i]); i++) {
    /* jshint forin: false */

        descriptor = bindings[targetPath];

        if (typeof descriptor !== "object") {
            if (!targetPath.includes('.')) {
                throw new Error("Binding descriptor must be an object, not " + typeof descriptor);
                // TODO isolate the source document and produce a more useful error
            } else {
                descriptor = {
                    "=" : "" + descriptor
                };
            }
        }

        if (ONE_ASSIGNMENT in descriptor) {
            var value = descriptor[ONE_ASSIGNMENT];

            assign(
                object,
                targetPath,
                typeof value === 'string' ? evaluate(value, object, null, null, deserializer) : value,
                null,
                null,
                deserializer
            );
        } else {
            //TODO: use the API on object firt so it has an opportunity to know what's being bound to him.
            object.defineBinding
                ? object.defineBinding(targetPath, descriptor, commonDescriptor)
                : Bindings.defineBinding(object, targetPath, descriptor, commonDescriptor);
        }
    }
};
