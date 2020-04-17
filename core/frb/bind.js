
var parse = require("./parse"),
    solve = require("./algebra"),
    stringify = require("./stringify"),
    compileObserver = require("./compile-observer"),
    compileBinder = require("./compile-binder"),
    compileAssigner = require("./compile-assigner"),
    Observers = require("./observers"),
    observeRangeChange = Observers.observeRangeChange,
    Binders = require("./binders"),
    Scope = require("./scope"),
    ONE_WAY = "<-",
    ONE_WAY_RIGHT = "->",
    TWO_WAY = "<->";


module.exports = bind;
function bind(target, targetPath, descriptor) {

    descriptor.target = target;
    descriptor.targetPath = targetPath;
    var source = descriptor.source = descriptor.source || target,
        twoWay = descriptor.twoWay = TWO_WAY in descriptor,
        sourcePath = descriptor.sourcePath = !twoWay ? descriptor[ONE_WAY] : descriptor[TWO_WAY] || "",
        parameters = descriptor.parameters = descriptor.parameters || source,
        document = descriptor.document,
        components = descriptor.components,
        trace = descriptor.trace,

    // TODO: consider the possibility that source and target have intrinsic
    // scope properties

        sourceScope = /*descriptor.sourceScope =*/ new Scope(source),
        targetScope = /*descriptor.targetScope =*/ new Scope(target);

    sourceScope.parameters = parameters;
    sourceScope.document = document;
    sourceScope.components = components;
    targetScope.parameters = parameters;
    targetScope.document = document;
    targetScope.components = components;

    // promote convert and revert from a converter object up to the descriptor
    if (descriptor.converter) {
        var converter = descriptor.converter;
        if (converter.convert) {
            descriptor.convert = converter.convert.bind(converter);
        }
        if (converter.revert) {
            descriptor.revert = converter.revert.bind(converter);
        }
    } else if (descriptor.reverter) {
        var reverter = descriptor.reverter;
        if (reverter.convert) {
            descriptor.revert = reverter.convert.bind(reverter);
        }
        if (reverter.revert) {
            descriptor.convert = reverter.revert.bind(reverter);
        }
    }

    var convert = descriptor.convert;
    var revert = descriptor.revert;

    var sourceSyntax = descriptor.sourceSyntax = parse(sourcePath);
    var targetSyntax = descriptor.targetSyntax = parse(targetPath);

    var solution = solve(targetSyntax, sourceSyntax);
    targetSyntax = solution[0];
    sourceSyntax = solution[1];

    if (twoWay) {
        if (targetSyntax.type === "rangeContent") {
            return bindRangeContent(
                targetScope,
                targetSyntax.args[0],
                sourceScope,
                sourceSyntax,
                convert,
                revert,
                descriptor,
                trace ? {
                    sourcePath: stringify(sourceSyntax),
                    targetPath: stringify(targetSyntax.args[0])
                } : null
            );
        }
    }

    // <- source to target
    trace && console.log("DEFINE BINDING", targetPath, ONE_WAY, sourcePath, target);
    var cancelSourceToTarget = bindOneWay(
        targetScope,
        targetSyntax,
        sourceScope,
        sourceSyntax,
        convert,
        descriptor,
        trace
    );

    // flip the arrow
    var solution = solve(sourceSyntax, targetSyntax);
    sourceSyntax = solution[0];
    targetSyntax = solution[1];

    // -> target to source
    var cancelTargetToSource = Function.noop;
    if (twoWay) {
        trace && console.log("DEFINE BINDING", targetPath, ONE_WAY_RIGHT, sourcePath, source);
        cancelTargetToSource = bindOneWay(
            sourceScope,
            sourceSyntax,
            targetScope,
            targetSyntax,
            revert,
            descriptor,
            trace
        );
    }

    return function cancel() {
        cancelSourceToTarget();
        cancelTargetToSource();
    };

}

function bindOneWay(
    targetScope,
    targetSyntax,
    sourceScope,
    sourceSyntax,
    convert,
    descriptor,
    trace
) {

    var observeSource = compileObserver(sourceSyntax);
    if (convert) {
        observeSource = Observers.makeConverterObserver(
            observeSource,
            convert,
            sourceScope
        );
    }

    var bindTarget = compileBinder(targetSyntax);
    return bindTarget(
        observeSource,
        sourceScope,
        targetScope,
        descriptor,
        trace ? {
            sourcePath: stringify(sourceSyntax),
            targetPath: stringify(targetSyntax)
        } : null
    );

}

function bindRangeContent(
    targetScope,
    targetSyntax,
    sourceScope,
    sourceSyntax,
    convert,
    revert,
    descriptor,
    trace
) {

    var observeSource = compileObserver(sourceSyntax);
    var observeTarget = compileObserver(targetSyntax);
    var assignSource = compileAssigner(sourceSyntax);
    var assignTarget = compileAssigner(targetSyntax);

    var cancel = Function.noop;

    var target;
    var source;
    // We make multiple uses of the isActive variable.
    var isActive;

    // We will observe the source and target expressions independently. For
    // initialization, if both produce an array, the source will overwrite the
    // content of the target.  If only the source produces an array, we will
    // propagate it to the target, and if only the target produces an array,
    // we'll propagate it to the source. If neither produces an array, we will
    // assign one.

    // We check the target expression first, but we will use isActive to
    // prevent the target from overwriting an existing source.

    isActive = true;
    var cancelTargetObserver = observeTarget(function replaceRangeContentTarget(_target) {
        cancel();
        cancel = Function.noop;
        trace && console.log("RANGE CONTENT TARGET", trace.targetPath, "SET TO", _target);
        if (_target && _target.addRangeChangeListener) {
            target = _target;
            if (source && target) {
                trace && console.log("RANGE CONTENT TARGET REPLACES SOURCE", trace.targetPath, ONE_WAY_RIGHT, trace.sourcePath, "WITH", target);
                isActive = true;
                source.swap(0, source.length, target);
                isActive = false;
                cancel = establishRangeContentBinding();
            } else if (!source && !isActive) {
                trace && console.log("RANGE CONTENT TARGET INITIALIZED TO COPY OF SOURCE", trace.targetPath, ONE_WAY, tarce.sourcePath, "WITH", source);
                assignSource(target.clone(), sourceScope);
            }
        }
    }, targetScope);
    isActive = false;

    var cancelSourceObserver = observeSource(function replaceRangeContentSource(_source) {
        cancel();
        cancel = Function.noop;
        trace && console.log("RANGE CONTENT SOURCE", trace.sourcePath, "SET TO", _source);
        if (_source && _source.addRangeChangeListener) {
            source = _source;
            if (target && source) {
                trace && console.log("RANGE CONTENT SOURCE REPLACES TARGET", trace.targetPath, ONE_WAY, trace.sourcePath, "WITH", source);
                isActive = true;
                target.swap(0, target.length, source);
                isActive = false;
                cancel = establishRangeContentBinding();
            } else if (!target) {
                assignTarget(source.clone(), targetScope);
            }
        }
    }, sourceScope);

    // Even if neither the source nor target are provided, we will kick off
    // with an empty array. The source will propagate to the target.
    if (!target && !source) {
        assignSource([], sourceScope);
    }

    function sourceRangeChange(plus, minus, index) {
        if (!isActive) {
            isActive = true;
            trace && console.log("RANGE CONTENT PROPAGATED", trace.targetPath, ONE_WAY, trace.sourcePath, "PLUS", plus, "MINUS", minus, "AT", index);
            target.swap(index, minus.length, plus);
            isActive = false;
        }
    }

    function targetRangeChange(plus, minus, index) {
        if (!isActive) {
            isActive = true;
            trace && console.log("RANGE CONTENT PROPAGATED", trace.targetPath, ONE_WAY_RIGHT, trace.sourcePath, "PLUS", plus, "MINUS", minus, "AT", index);
            source.swap(index, minus.length, plus);
            isActive = false;
        }
    }

    function establishRangeContentBinding() {
        if (source === target) {
            return;
        }
        trace && console.log("RANGE CONTENT BOUND", trace.targetPath, TWO_WAY, trace.sourcePath);
        isActive = true;
        var cancelSourceRangeChangeObserver = observeRangeChange(source, sourceRangeChange, sourceScope);
        var cancelTargetRangeChangeObserver = observeRangeChange(target, targetRangeChange, targetScope);
        isActive = false;
        return function cancelRangeContentBinding() {
            trace && console.log("RANGE CONTENT UNBOUND", trace.targetPath, TWO_WAY, trace.sourcePath);
            cancelSourceRangeChangeObserver();
            cancelTargetRangeChangeObserver();
        };
    }

    return function cancelRangeContentBinding() {
        cancel();
        cancelTargetObserver();
        cancelSourceObserver();
    };
}
