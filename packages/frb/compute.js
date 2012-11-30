
var parse = require("./parse");
var compileObserver = require("./compile-observer");
var compileBinder = require("./compile-binder");
var Observers = require("./observers");

module.exports = compute;
function compute(target, targetPath, descriptor) {
    descriptor.target = target;
    descriptor.targetPath = targetPath;
    var source = descriptor.source = descriptor.source || target;
    var args = descriptor.args;
    var compute = descriptor.compute;
    var parameters = descriptor.parameters = descriptor.parameters || source;
    var trace = descriptor.trace;

    var argObservers = args.map(parse).map(function (argSyntax) {
        if (argSyntax.type === "rangeContent") {
            var observeArg = compileObserver(argSyntax.args[0]);
            return Observers.makeRangeContentObserver(observeArg);
        } else if (argSyntax.type === "mapContent") {
            var observeArg = compileObserver(argSyntax.args[0]);
            return Observers.makeMapContentObserver(observeArg);
        } else {
            return compileObserver(argSyntax);
        }
    });
    var argsObserver = Observers.makeRangeContentObserver(
        Observers.makeObserversObserver(argObservers)
    );
    var observeSource = Observers.makeComputerObserver(argsObserver, compute, target);

    var targetSyntax = parse(targetPath);
    var bindTarget = compileBinder(targetSyntax);

    return bindTarget(observeSource, source, target, parameters, descriptor, trace ? {
        sourcePath: args.join(", "),
        targetPath: targetPath
    }: undefined);
}

