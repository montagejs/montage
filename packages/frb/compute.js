
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

    var argSyntacies = args.map(parse);
    var argObservers = argSyntacies.map(compileObserver).map(Observers.makeContentObserver);
    var argsObserver = Observers.makeContentObserver(
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

