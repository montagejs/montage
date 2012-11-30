
var parse = require("./parse");
var solve = require("./algebra");
var compileObserver = require("./compile-observer");
var compileBinder = require("./compile-binder");
var Observers = require("./observers");

module.exports = bind;
function bind(target, targetPath, descriptor) {

    descriptor.target = target;
    descriptor.targetPath = targetPath;
    var source = descriptor.source = descriptor.source || target;

    var sourcePath = descriptor["<-"] || descriptor["<->"] || "";
    var twoWay = descriptor.twoWay = "<->" in descriptor;
    descriptor.sourcePath = sourcePath;
    var value = descriptor.value;
    var parameters = descriptor.parameters = descriptor.parameters || source;
    var trace = descriptor.trace;

    // promote convert and revert from a converter object up to the descriptor
    if (descriptor.converter) {
        var converter = descriptor.converter;
        if (converter.convert) {
            descriptor.convert = converter.convert.bind(converter);
        }
        if (converter.revert) {
            descriptor.revert = converter.revert.bind(converter);
        }
    }

    var convert = descriptor.convert;
    var revert = descriptor.revert;

    var sourceSyntax = descriptor.sourceSyntax = parse(sourcePath);
    var targetSyntax = descriptor.targetSyntax = parse(targetPath);

    // <- source to target
    trace && console.log("DEFINE BINDING", targetPath, "<-", sourcePath, target);
    var cancelSourceToTarget = bindOneWay(
        target,
        targetSyntax,
        source,
        sourceSyntax,
        parameters,
        convert,
        descriptor,
        trace ? {
            sourcePath: sourcePath,
            targetPath: targetPath
        } : undefined
    );

    // -> target to source
    var cancelTargetToSource = noop;
    if (twoWay) {
        trace && console.log("DEFINE BINDING", targetPath, "->", sourcePath, source);
        cancelTargetToSource = bindOneWay(
            source,
            sourceSyntax,
            target,
            targetSyntax,
            parameters,
            revert,
            descriptor,
            trace ? {
                sourcePath: targetPath,
                targetPath: sourcePath
            } : undefined
        );
    }

    return function cancel() {
        cancelSourceToTarget();
        cancelTargetToSource();
    };

}

function bindOneWay(
    target,
    targetSyntax,
    source,
    sourceSyntax,
    parameters,
    convert,
    descriptor,
    trace
) {

    // rotate operators from the target side of the binding to the
    // by inversion onto the source
    var solution = solve(targetSyntax, sourceSyntax);
    targetSyntax = solution[0];
    sourceSyntax = solution[1];

    var observeSource = compileObserver(sourceSyntax);
    if (convert) {
        observeSource = Observers.makeConverterObserver(
            observeSource,
            convert,
            source
        );
    }

    var bindTarget = compileBinder(targetSyntax);
    return bindTarget(
        observeSource,
        source,
        target,
        parameters,
        descriptor,
        trace
    );

}

function noop() {}

