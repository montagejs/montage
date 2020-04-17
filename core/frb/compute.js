
var parse = require("./parse");
var compileObserver = require("./compile-observer");
var compileBinder = require("./compile-binder");
var Observers = require("./observers");
var Scope = require("./scope");

module.exports = compute;
function compute(target, targetPath, descriptor) {
    descriptor.target = target;
    descriptor.targetPath = targetPath;
    var source = descriptor.source = descriptor.source || target,
        args = descriptor.args,
        compute = descriptor.compute,
        parameters = descriptor.parameters = descriptor.parameters || source,
        document = descriptor.document,
        components = descriptor.components,
        trace = descriptor.trace;

    // TODO consider the possibility that source and target have intrinsic
    // scope properties
    //
    var sourceScope = /* descriptor.sourceScope =*/ new Scope(source);
    sourceScope.parameters = parameters;
    sourceScope.document = document;
    sourceScope.components = components;

    var targetScope = /*descriptor.targetScope =*/ new Scope(target);
    targetScope.parameters = parameters;
    targetScope.document = document;
    targetScope.components = components;


    var argObservers = [];
    for(var i = 0, arg, argSyntax, observeArg, iObserver;(arg = args[i]); i++) {
        argSyntax = parse(arg);
        if (argSyntax.type === "rangeContent") {
            observeArg = compileObserver(argSyntax.args[0]);
            iObserver = Observers.makeRangeContentObserver(observeArg);
        } else if (argSyntax.type === "mapContent") {
            observeArg = compileObserver(argSyntax.args[0]);
            iObserver = Observers.makeMapContentObserver(observeArg);
        } else {
            iObserver = compileObserver(argSyntax);
        }
        argObservers.push(iObserver);
    }
    // var argObservers = args.map(function (arg) {
    //     return parse(arg);
    // }).map(function (argSyntax) {
    //     if (argSyntax.type === "rangeContent") {
    //         var observeArg = compileObserver(argSyntax.args[0]);
    //         return Observers.makeRangeContentObserver(observeArg);
    //     } else if (argSyntax.type === "mapContent") {
    //         var observeArg = compileObserver(argSyntax.args[0]);
    //         return Observers.makeMapContentObserver(observeArg);
    //     } else {
    //         return compileObserver(argSyntax);
    //     }
    // });



    var argsObserver = Observers.makeRangeContentObserver(
            Observers.makeObserversObserver(argObservers)
        ),
        observeSource = Observers.makeComputerObserver(argsObserver, compute, target),

        targetSyntax = parse(targetPath),
        bindTarget = compileBinder(targetSyntax);

    return bindTarget(observeSource, sourceScope, targetScope, descriptor, trace ? {
        sourcePath: args.join(", "),
        targetPath: targetPath
    }: undefined);
}

