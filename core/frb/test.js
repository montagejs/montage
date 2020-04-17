var Bindings = require("./bindings");

var o = Bindings.defineBindings({
    target: [1]
}, {
    source: {"<->": "target.rangeContent()"}
});

assertEqual(o.source[0], 1);

var oldSource = o.source;
assertEqual(oldSource[0], 1);

o.source = [2];
assertEqual(oldSource[0], 1);

o.target.splice(0, 3, 3);
assertEqual(oldSource, o.source);
assertEqual(oldSource[0], 1);
assertEqual(o.source[0], 3);

/*
defineBinding: 
    descriptor = {
         "<-": "a",
         target: o,
         parameters: undefined,
         document: document,
         components: undefined
         cancel: bind(o, "b", descriptor)
     }

 bind (object, name, descriptor):
    descriptor.target = o
    descriptor.targetPath = "b"
    source = o
    sourcePath = "a"

    sourceScope = new Scope(o)
    targetScope = new Scope(o)

    sourceSyntax = parse(sourcePath)
    targetSyntax = parse(targetPath)
sourceSyntax
Object
args: Array[1]
0: Object
args: Array[2]
0: Object
type: "value"
1: Object
type: "literal"
value: "target"
length: 2
type: "property"
length: 1
type: "rangeContent"

targetSyntax
Object
args: Array[2]
0: Object
type: "value"
1: Object
type: "literal"
value: "source"
length: 2
type: "property"

    bindOneWay(target, source, ...)
    bindOneWay(source, target, ...) // if two-way

bindOneWay():
    // rotate operators from target to source
    [targetSyntax, sourceSyntax] = solve(targetSyntax, sourceSyntax)

    observeSource = compileObserver(sourceSyntax)
    compileBinder(targetSyntax)(observeSource, sourceScope, targetScope, ...)

*/

function assertEqual(x, y) {
    console.log(x===y ? "* " : "x ", x, y);
}
