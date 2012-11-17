
# Functional Reactive Bindings

In their simplest form, bindings provide the illusion that two objects
have the same property.  Changing the property on one object causes the
same change in the other.  This is useful for coordinating state between
views and models, among other entangled objects.  For example, if you
enter text into a text field, the same text might be added to the
corresponding database record.

```javascript
bind(object, "a.b", {"<->": "c.d"});
```

Functional Reactive Bindings go farther.  They can gracefully bind long
property paths and the contents of collections.  They can also
incrementally update the results of chains of queries including maps,
flattened arrays, sums, and averages.  They can also add and remove
elements from sets based on the changes to a flag.  FRB makes it easy to
incrementally ensure consistent state.

```javascript
bind(company, "payroll", {"<-": "departments.map{employees.sum{salary}}.sum()"});
bind(document, "body.classList.has('dark')", {"<-": "darkMode", source: viewModel});
```

FRB is built from a combination of powerful functional and generic
building blocks, making it reliable, easy to extend, and easy to
maintain.


## Getting Started

`frb` is a CommonJS package, with JavaScript modules suitable for use
with [Node.js][] on the server side or [Mr][] on the client side. 

```
❯ npm install frb
```




## Tutorial

In this example, we bind `model.content` to `document.body.innerHTML`.

```javascript
var bind = require("frb/bind");
var model = {content: "Hello, World!"};
var cancelBinding = bind(document, "body.innerHTML", {
    "<-": "content",
    "source": model
});
```

When a source property is bound to a target property, the target gets
reassigned to the source any time the source changes.

```javascript
model.content = "Farewell.";
expect(document.body.innerHTML).toBe("Farewell.");
```

Bindings can be recursively detached from the objects they observe with
the returned cancel function.

```javascript
cancelBinding();
model.content = "Hello again!"; // doesn't take
expect(document.body.innerHTML).toBe("Farewell.");
```

### Two-way Bindings

Bindings can go one way or in both directions.  Declare one-way
bindings with the ```<-``` property, and two-way bindings with the
```<->``` property.

In this example, the "foo" and "bar" properties of an object will be
inexorably intertwined.

```javascript
var object = {};
var cancel = bind(object, "foo", {"<->": "bar"});

// <-
object.bar = 10;
expect(object.foo).toBe(10);

// ->
object.foo = 20;
expect(object.bar).toBe(20);
```

### Right-to-left

Note that even with a two-way binding, the right-to-left binding
precedes the left-to-right.  In this example, "foo" and "bar" are bound
together, but both have initial values.

```javascript
var object = {foo: 10, bar: 20};
var cancel = bind(object, "foo", {"<->": "bar"});
expect(object.foo).toBe(20);
expect(object.bar).toBe(20);
```

The right-to-left assignment of `bar` to `foo` happens first, so the
initial value of `foo` gets lost.

### Property chains

Bindings can follow deeply nested chains, on both the left and the right
side.

In this example, we have two object graphs, `foo`, and `bar`, with the
same structure and initial values.  This binds `bar.a.b` to `foo.a.b`
and also the other way around.

```javascript
var foo = {a: {b: 10}};
var bar = {a: {b: 10}};
var cancel = bind(foo, "a.b", {
    "<->": "a.b",
    source: bar
});
// <-
bar.a.b = 20;
expect(foo.a.b).toBe(20);
// ->
foo.a.b = 30;
expect(bar.a.b).toBe(30);
```

In this case, the source of the binding is a different object than the
target, so the binding descriptor specifies the alternate source.

### Structure changes

Changes to the structure of either side of the binding are no matter.
All of the orphaned event listeners will automatically be canceled, and
the binders and observers will reattach to the new object graph.

Continuing from the previous example, we store and replace the `a`
object from one side of the binding.  The old `b` property is now
orphaned, and the old `b` property adopted in its place.

```javascript
var a = foo.a;
expect(a.b).toBe(30); // from before

foo.a = {}; // orphan a and replace
foo.a.b = 40;
// ->
expect(bar.a.b).toBe(40); // updated

bar.a.b = 50;
// <-
expect(foo.a.b).toBe(50); // new one updated
expect(a.b).toBe(30); // from before it was orphaned
```

### Sum

Some advanced queries are possible with one-way bindings from
collections.  FRB updates sums incrementally.  When values are added or
removed from the array, the sum of only those items is taken and added
or removed from the last known sum.

```javascript
var object = {array: [1, 2, 3]};
bind(object, "sum", {"<-": "array.sum()"});
expect(object.sum).toEqual(6);
```

### Average

The arithmetic mean of a collection can be updated incrementally.  Each
time the array changes, the added and removed items adjust the last
known sum and count of values in the array.

```javascript
var object = {array: [1, 2, 3]};
bind(object, "average", {"<-": "array.average()"});
expect(object.average).toEqual(2);
```

### Map

You can also create mappings from one array to a new array and an
expression to evaluate on each item.  The mapped array is bound once,
and all changes to the source array are incrementally updated in the
target array.  Unaffected items in the array are not affected.

```javascript
var object = {objects: [
    {number: 10},
    {number: 20},
    {number: 30}
]};
bind(object, "numbers", {"<-": "objects.map{number}"});
expect(object.numbers).toEqual([10, 20, 30]);
object.objects.push({number: 40});
expect(object.numbers).toEqual([10, 20, 30, 40]);
```

Any function, like `sum` or `average`, can be applied to the result of a
mapping.  The straight-forward path would be
`objects.map{number}.sum()`, but you can use a block with any function
as a short hand, `objects.sum{number}`.

### Filter

A filter block generates an incrementally updated array filter.  The
resulting array will contain only those elements from the source array
that pass the test deescribed in the block.  As items of the source
array are added, removed, or changed such that they go from passing to
failing or failing to passing, the filtered array gets incrementally
updated to include or exclude those items in their proper positions, as
if the whole array were regenerated with `array.filter` by brute force.

```javascript
var object = {numbers: [1, 2, 3, 4, 5, 6]};
bind(object, "evens", {"<-": "numbers.filter{!(%2)}"});
expect(object.evens).toEqual([2, 4, 6]);
object.numbers.push(7, 8);
object.numbers.shift();
object.numbers.shift();
expect(object.evens).toEqual([4, 6, 8]);
```

### Sorted

A sorted block generates an incrementally updated sorted array.  The
resulting array will contain all of the values from the source except in
sorted order.

```javascript
var object = {numbers: [5, 2, 7, 3, 8, 1, 6, 4]};
bind(object, "sorted", {"<-": "numbers.sorted{}"});
expect(object.sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
```

The block may specify a property or expression by which to compare
values.

```javascript
var object = {arrays: [[1, 2, 3], [1, 2], [], [1, 2, 3, 4], [1]]};
bind(object, "sorted", {"<-": "arrays.sorted{-length}"});
expect(object.sorted.map(function (array) {
    return array.slice(); // to clone
})).toEqual([
    [1, 2, 3, 4],
    [1, 2, 3],
    [1, 2],
    [1],
    []
]);
```

The sorted binding responds to changes to the sorted property by
removing them at their former place and adding them back at their new
position.

```javascript
object.arrays[0].push(4, 5);
expect(object.sorted.map(function (array) {
    return array.slice(); // to clone
})).toEqual([
    [1, 2, 3, 4, 5], // new
    [1, 2, 3, 4],
    // old
    [1, 2],
    [1],
    []
]);
```

### View

Suppose that your source is a large data store, like a `SortedSet` from
the [Collections][] package.  You might need to view a sliding window
from that collection as an array.  The `view` binding reacts to changes
to the collection and the position and length of the window.

```javascript
var SortedSet = require("collections/sorted-set");
var controller = {
    index: SortedSet([1, 2, 3, 4, 5, 6, 7, 8]),
    start: 2,
    length: 4
};
var cancel = bind(controller, "view", {
    "<-": "index.view(start, length)"
});

expect(controller.view).toEqual([3, 4, 5, 6]);

// change the window length
controller.length = 3;
expect(controller.view).toEqual([3, 4, 5]);

// change the window position
controller.start = 5;
expect(controller.view).toEqual([6, 7, 8]);

// add content behind the window
controller.index.add(0);
expect(controller.view).toEqual([5, 6, 7]);
```

### Enumerate

An enumeration observer produces `{index, value}` pairs.  You can bind
to the index or the item in subsequent stages.

```javascript
var object = {letters: ['a', 'b', 'c', 'd']};
bind(object, "lettersAtEvenIndicies", {
    "<-": "letters.enumerate().filter{!(index % 2)}.map{value}"
});
expect(object.lettersAtEvenIndicies).toEqual(['a', 'c']);
object.letters.shift();
expect(object.lettersAtEvenIndicies).toEqual(['b', 'd']);
```

### Flatten

You can flatten nested arrays.  In this example, we have an array of
arrays and bind it to a flat array.

```javascript
var arrays = [[1, 2, 3], [4, 5, 6]];
var object = {};
bind(object, "flat", {
    "<-": "flatten()",
    source: arrays
});
expect(object.flat).toEqual([1, 2, 3, 4, 5, 6]);
```

Note that changes to the inner and outer arrays are both projected into
the flattened array.

```javascript
arrays.push([7, 8, 9]);
arrays[0].unshift(0);
expect(object.flat).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
```

Also, as with all other bindings that produce arrays, the flattened
array is never replaced, just incrementally updated.

```javascript
var flat = object.flat;
arrays.splice(0, arrays.length);
expect(object.flat).toBe(flat); // === same object
```

### Reversed

You can bind the reversal of an array.

```javascript
var object = {forward: [1, 2, 3]};
bind(object, "backward", {
    "<->": "forward.reversed()"
});
expect(object.backward.slice()).toEqual([3, 2, 1]);
object.forward.push(4);
expect(object.forward.slice()).toEqual([1, 2, 3, 4]);
expect(object.backward.slice()).toEqual([4, 3, 2, 1]);
```

Note that you can do two-way bindings, ```<->``` with reversed arrays.
Changes to either side are updated to the opposite side.

```javascript
object.backward.pop();
expect(object.backward.slice()).toEqual([4, 3, 2]);
expect(object.forward.slice()).toEqual([2, 3, 4]);
```

### Has

You can bind a property to always reflect whether a collection contains
a particular value.

```javascript
var object = {
    haystack: [1, 2, 3],
    needle: 3
};
bind(object, "hasNeedle", {"<-": "haystack.has(needle)"});
expect(object.hasNeedle).toBe(true);
object.haystack.pop(); // 3 comes off
expect(object.hasNeedle).toBe(false);
```

The binding also reacts to changes to the value you seek.

```javascript
// Continued from above...
object.needle = 2;
expect(object.hasNeedle).toBe(true);
```

`has` bindings are not incremental, but with the right data-structure,
updates are cheap.  The [Collections][] package contains Lists, Sets,
and OrderedSets that all can send content change notifications and thus
can be bound.

```javascript
// Continued from above...
var Set = require("collections/set");
object.haystack = new Set([1, 2, 3]);
expect(object.hasNeedle).toBe(true);
```

`has` bindings can also be left-to-right and bi-directional.

```javascript
bind(object, "hasNeedle", {"<->": "haystack.has(needle)"});
object.hasNeedle = false;
expect(object.haystack.has(2)).toBe(false);
```

The collection on the left-hand-side must implement `has` or `contains`,
`add`, and `delete` or `remove`.  FRB shims `Array` to have `has`,
`add`, and `delete`, just like all the collections in [Collections][].
It happens that the `classList` properties of DOM elements, when they
are supported, implement `add`, `remove`, and `contains`.

```javascript
var model = {darkMode: false};
bind(document.body, "classList.has('dark')", {
    "<-": "darkMode",
    source: model
});
```

The DOM `classList` does not however implement
`addContentChangeListener` or `removeContentChangeListener`, so it
cannot be used on the right-hand-side of a binding, and such bindings
cannot be bidirectional.  With some DOM [Mutation Observers][], you
might be able to help FRB overcome this limitation in the future.

### Get

A binding can observe changes in key-to-value mappings in arrays and map
[Collections][].

```javascript
var object = {
    array: [1, 2, 3],
    second: null
};
var cancel = bind(object, "second", {
    "<->": "array[1]"
});
expect(object.array.slice()).toEqual([1, 2, 3]);
expect(object.second).toBe(2);

object.array.shift();
expect(object.array.slice()).toEqual([2, 3]);
expect(object.second).toBe(3);

object.second = 4;
expect(object.array.slice()).toEqual([2, 4]);

cancel();
object.array.shift();
expect(object.second).toBe(4); // still
```

The source collection can be a Map, Dict, MultiMap, SortedMap,
SortedArrayMap, or anything that implements `get` and
`addMapChangeListener` as specified in [Collections][].  The key can
also be a variable.

```javascript
var Map = require("collections/map");
var a = {id: 0}, b = {id: 1};
var object = {
    source: Map([[a, 10], [b, 20]]),
    key: null,
    selected: null
};

var cancel = bind(object, "selected", {
    "<-": "source[key]"
});
expect(object.selected).toBe(null);

object.key = a;
expect(object.selected).toBe(10);

object.key = b;
expect(object.selected).toBe(20);

object.source.set(b, 30);
expect(object.selected).toBe(30);

var SortedMap = require("collections/sorted-map");
object.source = SortedMap();
expect(object.selected).toBe(30); // no change

object.source.set(b, 40);
expect(object.selected).toBe(40);

cancel();
object.key = a; // no effect
expect(object.selected).toBe(40);
```

You can also bind the entire content of a map-like collection to the
content of another.  Bear in mind that the content of the source
replaces the content of the target initially.

```javascript
var Map = require("collections/map");
var object = {
    a: Map({a: 10}),
    b: Map()
};
var cancel = bind(object, "a[*]", {"<->": "b[*]"});
expect(object.a.toObject()).toEqual({});
expect(object.b.toObject()).toEqual({});

object.a.set('a', 10);
expect(object.a.toObject()).toEqual({a: 10});
expect(object.b.toObject()).toEqual({a: 10});

object.b.set('b', 20);
expect(object.a.toObject()).toEqual({a: 10, b: 20});
expect(object.b.toObject()).toEqual({a: 10, b: 20});
```

### Equals

You can bind to whether expressions are equal.

```javascript
var fruit = {apples: 1, oranges: 2};
bind(fruit, "equal", {"<-": "apples == oranges"});
expect(fruit.equal).toBe(false);
fruit.orange = 1;
expect(fruit.equal).toBe(true);
```

Equality can be bound both directions.  In this example, we do a two-way
binding between whether a radio button is checked and a corresponding
value in our model.

```javascript
var component = {
    orangeElement: {checked: false},
    appleElement: {checked: true}
};
Bindings.defineBindings(component, {
    "orangeElement.checked": {"<->": "fruit = 'orange'"},
    "appleElement.checked": {"<->": "fruit = 'apple'"},
});

component.orangeElement.checked = true;
expect(component.fruit).toEqual("orange");

component.appleElement.checked = true;
expect(component.fruit).toEqual("apple");
```

Because equality and assignment are interchanged in this language, you
can use either `=` or `==`.

### Operators

FRB can also recognize many operators.  These are in order of precedence
unary `-` negation, `+` numeric coercion, and `!` logical negation and
then binary `**` power, `//` root, `%%` logarithm, `*`, `/`, `%` modulo,
`%%` remainder, `+`, `-`, ```<```, ```>```, ```<=```, ```>=```, `=` or
`==`, `!=`, `&&` and `||`.

```javascript
var object = {height: 10};
bind(object, "heightPx", {"<-": "height + 'px'"});
expect(object.heightPx).toEqual("10px");
```

### Algebra

FRB can automatically invert algebraic operators as long as they operate
strictly on numbers and the left-most expressions on both the source and
target are bindable properties.

In this examlple, the primary binding is ```notToBe <- !toBe```, and the
inverse binding is automatically computed ```toBe <- !notToBe```.

```javascript
var caesar = {toBe: false};
bind(caesar, "notToBe", {"<->": "!toBe"});
expect(caesar.toBe).toEqual(false);
expect(caesar.notToBe).toEqual(true);

caesar.notToBe = false;
expect(caesar.toBe).toEqual(true);
```

FRB does algebra by rotating the expressions on one side of a binding to
the other until only one independent property remains (the left most
expression) on the target side of the equation.

```
convert: y <- !x
revert: x <- !y
```

```
convert: y <- x + a
revert: x <- y - a
```

The left-most independent variable on the right hand side becomes the
dependent variable on the inverted binding.  At present, this only works
for numbers and when the left-most expression is a bindable property
because it cannot assign a new value to the literal 10.  For example,
FRB cannot yet implicitly revert ```y <-> 10 + x```.

### Literals

You may have noticed literals in the previous examples.  String literals
take the form of any characters between single quotes.  Any character
can be escaped with a back slash.

```javascript
var object = {};
bind(object, "greeting", {"<-": "'Hello, World!'"});
expect(object.greeting).toBe("Hello, World!");
```

Number literals are digits with an optional mantissa.

```javascript
bind(object, 'four', {"<-": "2 + 2"});
```

### Tuples

Bindings can produce fixed-length arrays.  These are most useful in
conjunction with mappings.  Tuples are comma-delimited and
parantheses-enclosed.

```javascript
var object = {array: [[1, 2, 3], [4, 5]]};
bind(object, "summary", {"<-": "array.map{[length, sum()]}"});
expect(object.summary).toEqual([
    [3, 6],
    [2, 9]
]);
```

### Records

Bindings can also produce fixed-shape objects.  The notation is
comma-delimited, colon-separated items, enclosed by curly-braces.

```javascript
var object = {array: [[1, 2, 3], [4, 5]]};
bind(object, "summary", {
    "<-": "array.map{{length: length, sum: sum()}}"
});
expect(object.summary).toEqual([
    {length: 3, sum: 6},
    {length: 2, sum: 9}
]);
```

The left hand side of an item in a record is any combination of letters
or numbers.  The right side is any expression.

### Parameters

Bindings can also involve parameters.  The source of parameters is by
default the same as the source.  The source, in turn, defaults to the
same as the target object.  It can be specified on the binding
descriptor.  Parameters are declared by any expression following a
dollar sign.

```javascript
var object = {a: 10, b: 20, c: 30};
bind(object, "foo", {
    "<-": "[$a, $b, $c]"},
    parameters: object
});
```

Bindings also react to changes to the parameters.

```javascript
object.a = 0;
object.b = 1;
object.c = 2;
expect(object.foo).toEqual([0, 1, 2]);
```

The degenerate case of the property language is an empty string.  This
is a valid property path that observes the value itself.  So, as an
emergent pattern, a `$` expression by itself corresponds to the whole
parameters object.

```javascript
var object = {};
bind(object, "ten", {"<-": "$", parameters: 10});
expect(object.ten).toEqual(10);
```

### Observers

FRB’s bindings use observers and binders internally.  You can create an
observer from a property path with the `observe` function exported by
the `frb/observe` module.

```javascript
var results = [];
var object = {foo: {bar: 10}};
var cancel = observe(object, "foo.bar", function (value) {
    results.push(value);
});

object.foo.bar = 10;
expect(results).toEqual([10]);

object.foo.bar = 20;
expect(results).toEqual([10, 20]);
```

For more complex cases, you can specify a descriptor instead of the
callback.  For example, to observe a property’s value *before it changes*, you can use the `beforeChange` flag.

```javascript
var results = [];
var object = {foo: {bar: 10}};
var cancel = observe(object, "foo.bar", {
    change: function (value) {
        results.push(value);
    },
    beforeChange: true
});

expect(results).toEqual([10]);

object.foo.bar = 20;
expect(results).toEqual([10, 10]);

object.foo.bar = 30;
expect(results).toEqual([10, 10, 20]);
```

If the product of an observer is an array, that array is always updated
incrementally.  It will only get emitted once.  If you want it to get
emitted every time its content changes, you can use the `contentChange`
flag.

```javascript
var lastResult;
var array = [[1, 2, 3], [4, 5, 6]];
observe(array, "map{sum()}", {
    change: function (sums) {
        lastResult = sums.slice();
        // 1. [6, 15]
        // 2. [6, 15, 0]
        // 3. [10, 15, 0]
    },
    contentChange: true
});

expect(lastResult).toEqual([6, 15]);

array.push([0]);
expect(lastResult).toEqual([6, 15, 0]);

array[0].push(4);
expect(lastResult).toEqual([10, 15, 0]);
```

### Nested Observers

To get the same effect as the previous example, you would have to nest
your own content change observer.

```javascript
var i = 0;
var array = [[1, 2, 3], [4, 5, 6]];
var cancel = observe(array, "map{sum()}", function (array) {
    function contentChange() {
        if (i === 0) {
            expect(array.slice()).toEqual([6, 15]);
        } else if (i === 1) {
            expect(array.slice()).toEqual([6, 15, 0]);
        } else if (i === 2) {
            expect(array.slice()).toEqual([10, 15, 0]);
        }
        i++;
    }
    contentChange();
    array.addContentChangeListener(contentChange);
    return function cancelContentChange() {
        array.removeContentChangeListener(contentChange);
    };
});
array.push([0]);
array[0].push(4);
cancel();
```

This illustrates one crucial aspect of the architecture.  Observers
return cancelation functions.  You can also return a cancelation
function inside a callback observer.  That canceler will get called each
time a new value is observed, or when the parent observer is canceled.
This makes it possible to nest observers.

```javascript
var object = {foo: {bar: 10}};
var cancel = observe(object, "foo", function (foo) {
    return observe(foo, "bar", function (bar) {
        expect(bar).toBe(10);
    });
});
```

### Bindings

FRB provides utilities for declaraing and managing multiple bindings on
objects.  The `frb` (`frb/bindings`) module exports this interface.

```javascript
var Bindings = require("frb");
```

The `Bindings` module provides `defineBindings` and `cancelBindings`,
`defineBinding` and `cancelBinding`, as well as binding inspector
methods `getBindings` and `getBinding`.  All of these take a target
object as the first argument.

The `Bindings.defineBinding(target, descriptors)` method returns the
target object for convenience.

```javascript
var target = Bindings.defineBindings({}, {
    "fahrenheit": {"<->": "celsius * 1.8 + 32"},
    "celsius": {"<->": "kelvin - 272.15"}
});
target.celsius = 0;
expect(target.fahrenheit).toEqual(32);
expect(target.kelvin).toEqual(272.15);
```

`Bindings.getBindings` in that case would return an object with
`fahrenheit` and `celsius` keys.  The values would be identical to the
given binding descriptor objects, like `{"<->": "kelvin - 272.15"}`, but
it also gets annotated with a `cancel` function and the default values
for any ommitted properties like `source` (same as `target`),
`parameters` (same as `source`), and others.

`Bindings.cancelBindings` cancels all bindings attached to an object and
removes them from the bindings descriptors object.

```javascript
Bindings.cancelBindings(target);
expect(Bindings.getBindings(object)).toEqual({});
```

### Binding Descriptors

Binding descriptors describe the source of a binding and additional
parameters.  `Bindings.defineBindings` can set up bindings (```<-``` or
```<->```), computed (```compute```) properties, and falls back to
defining ES5 properties with permissive defaults (`enumerable`,
`writable`, and `configurable` all on by default).

If a descriptor has a ```<-``` or ```<->```, it is a binding descriptor.
FRB creates a binding, adds the canceler to the descriptor, and adds the
descriptor to an internal table that tracks all of the bindings defined
on that object.

```javascript
var object = Bindings.defineBindings({
    darkMode: false,
    document: document
}, {
    "document.body.classList.has('dark')": {
        "<-": "darkMode"
    }
});
```

You can get all the binding descriptors with `Bindings.getBindings`, or a
single binding descriptor with `Bindings.getBinding`.  `Bindings.cancel` cancels
all the bindings to an object and `Bindings.cancelBinding` will cancel just
one.

```javascript
// Continued from above...
var bindings = Bindings.getBindings(object);
var descriptor = Bindings.getBinding(object, "document.body.classList.has('dark')");
Bindings.cancelBinding(object, "document.body.classList.has('dark')");
Bindings.cancelBindings(object);
expect(Object.keys(bindings)).toEqual([]);
```

### Converters

A binding descriptor can have a `convert` function, a `revert` function,
or alternately a `converter` object.  Converters are useful for
transformations that cannot be expressed in the property language, or
are not reversible in the property language.

In this example, `a` and `b` are synchronized such that `a` is always
half of `b`, regardless of which property gets updated.

```javascript
var object = Bindings.defineBindings({
    a: 10
}, {
    b: {
        "<->": "a",
        convert: function (a) {
            return a * 2;
        },
        revert: function (b) {
            return b / 2;
        }
    }
});
expect(object.b).toEqual(20);

object.b = 10;
expect(object.a).toEqual(5);
```

Converter objects are useful for reusable or modular converter types and
converters that track additional state.

```javascript
var object = Bindings.defineBindings({
    a: 10
}, {
    b: {
        "<->": "a",
        converter: {
            factor: 2,
            convert: function (a) {
                return a * this.factor;
            },
            revert: function (b) {
                return b / this.factor;
            }
        }
    }
});
expect(object.b).toEqual(20);

object.b = 10;
expect(object.a).toEqual(5);
```

### Computed Properties

A computed property is one that gets updated with a function call when
one of its arguments changes.  Like a converter, it is useful in cases
where a transformation or computation cannot be expressed in the
property language, but can additionally accept multiple arguments as
input.  A computed property can be used as the source for another
binding.

In this example, we create an object as the root of multiple bindings.
The object synchronizes the properties of a "form" object with the
window’s search string, effectively navigating to a new page whenever
the "q" or "charset" entries of the form change.

```javascript
Bindings.defineBindings({
    window: window,
    form: {
        q: "",
        charset: "utf-8"
    }
}, {
    queryString: {
        args: ["form.q", "form.charset"],
        compute: function (q, charset) {
            return "?" + QS.stringify({
                q: q,
                charset: charset
            });
        }
    },
    "window.location.search": {
        "<-": "queryString"
    }
});
```

### Debugging with Traces

A binding can be configured to log when it changes and why.  The `trace`
property on a descriptor instructs the binder to log changes to the
console.

```javascript
Bindings.defineBindings({
    a: 10
}, {
    b: {
        "<-": "a + 1",
    }
});
```

## Reference

Functional Reactive Bindings is an implementation of synchronous,
incremental object-property and collection-content bindings for
JavaScript.  It was ripped from the heart of the [Montage][] web
application framework and beaten into this new, slightly magical form.
It must prove itself worthy before it can return.

-   **functional**: The implementation uses functional building blocks
    to compose observers and binders.
-   **generic**: The implementation uses generic methods on collections,
    like `addContentChangeListener`, so any object can implement the
    same interface and be used in a binding.
-   **reactive**: The values of properties and contents of collections
    react to changes in the objects and collections on which they
    depend.
-   **synchronous**: All bindings are made consistent in the statement
    that causes the change.  The alternative is asynchronous, where
    changes are queued up and consistency is restored in a later event.
-   **incremental**: If you update an array, it produces a content
    change which contains the values you added, removed, and the
    location of the change.  Most bindings can be updated using only
    these values.  For example, a sum is updated by decreasing by the
    sum of the values removed, and increasing by the sum of the values
    added.  FRB can incrementally update `map`, `reversed`, `flatten`,
    `sum`, and `average` observers.  It can also incrementally update
    `has` bindings.
-   **unwrapped**: Rather than wrap objects and arrays with observable
    containers, FRB modifies existing arrays and objects to make them
    dispatch property and content changes.  For objects, this involves
    installing getters and setters using the ES5 `Object.defineProperty`
    method.  For arrays, this involves replacing all of the mutation
    methods, like `push` and `pop`, with variants that dispatch change
    notifications.  The methods are either replaced by swapping the
    `__proto__` or adding the methods to the instance with
    `Object.defineProperties`.  These techniques should [work][Define
    Property] starting in Internet Explorer 9, Firefox 4, Safari 5,
    Chrome 7, and Opera 12.


### Architecture

-   [Collections][] provides **property, mapped content, and ranged
    content change events** for objects, arrays, and other collections.
    For objects, this adds a property descriptor to the observed object.
    For arrays, this either swaps the prototype or mixes methods into
    the array so that all methods dispatch change events.  
    Caveats: you have to use a `set` method on Arrays to dispatch
    property and content change events.  Does not work in older Internet
    Explorers since they support neither prototype assignment or ES5
    property setters.
-   **observer** functions for watching an entire object graph for
    incremental changes, and gracefully rearranging and canceling those
    observers as the graph changes.  Observers can be constructed
    directly or with a very small query language that compiles to a tree
    of functions so no parsing occurs while the graph is being watched.
-   one- and two-way **bindings** using binder and obserer functions to
    incrementally update objects.
-   **declarative** interface for creating an object graph with
    bindings, properties, and computed properties with dependencies.


### Bindings

The highest level interface for FRB resembles the ES5 Object constructor
and can be used to declare objects and define and cancel bindings on
them with extended property descriptors.

```javascript
var Bindings = require("frb");

// create an object
var object = Bindings.defineBindings({
    foo: 0,
    graph: [
        {numbers: [1,2,3]},
        {numbers: [4,5,6]}
    ]
}, {
    bar: {"<->": "foo", enumerable: false},
    numbers: {"<-": "graph.map{numbers}.flatten()"},
    sum: {"<-": "numbers.sum()"},
    reversed: {"<-": "numbers.reversed()"}
});

expect(object.bar).toEqual(object.foo);
object.bar = 10;
expect(object.bar).toEqual(object.foo);
expect.foo = 20;
expect(object.bar).toEqual(object.foo);

// note that the identity of the bound numbers array never
// changes, because all of the changes to that array are
// incrementally updated
var numbers = object.numbers;

// first computation
expect(object.sum).toEqual(21);

// adds an element to graph,
// which pushes [7, 8, 9] to "graph.map{numbers}",
// which splices [7, 8, 9] to the end of
//  "graph.map{numbers}.flatten()",
// which increments "sum()" by [7, 8, 9].sum()
object.graph.push({numbers: [7, 8, 9]});
expect(object.sum).toEqual(45);

// splices [1] to the beginning of [1, 2, 3],
// which splices [1] to the beginning of "...flatten()"
// which increments "sum()" by [1].sum()
object.graph[0].numbers.unshift(1);
expect(object.sum).toEqual(46);

// cancels the entire observer hierarchy, then attaches
//  listeners to the new one.  updates the sum.
object.graph = [{numbers: [1,2,3]}];
expect(object.sum).toEqual(6);

expect(object.reversed).toEqual([3, 2, 1]);

expect(object.numbers).toBe(numbers) // still the same object

Bindings.cancelBindings(object); // cancels all bindings on this object and
// their transitive observers and event listeners as deep as
// they go
```

-   `Bindings.defineBindings(object, name, descriptor)`
-   `Bindings.defineBinding(object, name, descriptor)`
-   `Bindings.getBindings(object)`
-   `Bindings.getBinding(object, name)`
-   `Bindings.cancelBindings(object)`
-   `Bindings.cancelBinding(object, name)`

A binding descriptor contains:

-   `target`: the
-   `targetPath`: the target
-   `targetSyntax`: the syntax tree for the target path
-   `source`: the source object, which defaults to `target`
-   `sourcePath`: the source path, from either ```<-``` or ```<->```
-   `sourceSyntax`: the syntax tree for the source path
-   `twoWay`: whether the binding goes in both directions, if ```<->```
    was the source path.
-   `parameters`: the parameters, which default to `source`.
-   `cancel`: a function to cancel the binding

### Bind

The `bind` module provides direct access to the `bind` function.

```javascript
var bind = require("frb/bind");

var source = [{numbers: [1,2,3]}, {numbers: [4,5,6]}];
var target = {};
var cancel = bind(target, "summary", {
    "<-": "map{[numbers.sum(), numbers.average()]}",
    source: source
});

expect(target.summary).toEqual([
    [6, 2],
    [15, 5]
]);

cancel();
```

`bind` is built on top of `parse`, `compileBinder`, and
`compileObserver`.

### Compute

The `compute` module provides direct access to the `compute` function,
used by `Bindings` to make computed properties.

```javascript
var compute = require("frb/compute");

var source = {operands: [10, 20]};
var target = {};
var cancel = compute(target, "sum", {
    source: source,
    args: ["operands.0", "operands.1"],
    compute: function (a, b) {
        return a + b;
    }
});

expect(target.sum).toEqual(30);

// change one operand
source.operands.set(1, 30); // needed to dispatch change notification
expect(target.sum).toEqual(40);
```

### Observe

The `observe` modules provides direct access to the `observe` function.
`observe` is built on top of `parse` and `compileObserver`.
`compileObserver` creates a tree of observers using the methods in the
`observers` module.

```javascript
var observe = require("frb/observe");

var source = [1, 2, 3];
var sum;
var cancel = observe(source, "sum()", function (newSum) {
    sum = newSum;
});

expect(sum).toBe(6);

source.push(4);
expect(sum).toBe(10);

source.unshift(0); // no change
expect(sum).toBe(10);

cancel();
source.splice(0, source.length); // would change
expect(sum).toBe(10);
```

`observe` produces a cancelation hierarchy.  Each time a value is
removed from an array, the underlying observers are canceled.  Each time
a property is replaced, the underlying observer is canceled.  When new
values are added or replaced, the observer produces a new canceler.  The
cancel function returned by `observe` commands the entire underlying
tree.

Observers also optional accept a descriptor argument in place of a
callback.

-   `set`: the change handler, receives `value` for most observers, but
    also `key` and `object` for property changes.
-   `parameters`: the value for `$` expressions.
-   `beforeChange`: instructs an observer to emit the previous value
    before a change occurs.
-   `contentChange`: instructs an observer to emit an array every time
    its content changes.  By default, arrays are only emitted once.

```javascript
var object = {};
var cancel = observe(object, "array", {
    change: function (value) {
        // may return a cancel function for a nested observer
    },
    parameters: {},
    beforeChange: false,
    contentChange: true
});

object.array = []; // emits []
object.array.push(10); // emits [10]
```


### The Language

Bindings and observers used a small query language intended to resemble
the same code that you would write in JavaScript to update a binding by
brute force.

#### Grammar

-   **expression** = **logical-or-expression**
-   **logical-or-expression** = **logical-and-expression** ( `||`
    **relation expression** )?
-   **logical-and-expression** = **relation-expression** ( `&&`
    **relation-expression** )?
-   **relation-expression** = **arithmetic expression** (
    **relation-operator** **arithmetic-expression** )?
    -   **relation-operator** = `=` | `==` | ```<``` | ```<=``` |
        ```>``` | ```>=```
-   **arithmetic-expression** = **multiplicative-expresion** *delimited
    by* **arithmetic-operator**
    -   **arithmetic-operator** = `+` | `-`
-   **multiplicative-expression** = **exponential-expression**
    *delimited by* **multiplicative-operator**
    -   **multiplicative-operator** = `*` | `/` | `%` | `rem`
-   **exponential-expression** = **unary-expression** *delimited by*
    **exponential-operator**
    -   **exponential-operator** = `**` | `//` | `%%`
-   **unary-expression** = **unary-operator** ? **path-expression**
    -   **unary-operator** = `+` | `-` | `!`
-   **path-expression** =
    **literal** *or*
    **array-expression** *or*
    **object-expression** *or*
    `(` **expression** `)` **tail-expression** *or*
    **property-name** **tail-expression** **or**
    **function-call** **tail-expression** **or**
    **block-call** **tail-expression** **or**
    `#` **element-id** **tail-expression** *or*
    `@` **component-label** **tail-expression**
    -   **tail-expression** =
        **property-expression** *or*
        **get-expression** *or*
        **range-content-expression** *or*
        **map-content-expression**
    -   **property-expression** = `.` **property-name** **tail-expression**
    -   **get-expression** = `[` **expression** `]` **tail-expression**
    -   **range-content-expression** = `.*`
    -   **map-content-expression** = `[*]`
    -   **array-expression** = `[` **expression** *delimited by* `,` `]`
    -   **object-expression** = `{` (**property-name** `:` **expression**)
        *delimited-by* `,` `}`
-   **property-name** = ( **non-space-character** )+
-   **function-call** = **function-name** `(` **expression** *delimited
    by* `,` `)`
    -   **function-name** = `flatten` *or* `reversed` *or* `sum` *or*
        `average` *or* `has`
-   **block-call** = **function-name** `{` **expression** `}`
    -   **block-name** = `map` *or* `filter` *or* `sorted` *or*
        **function-name**
-   **literal** = **string-literal** *or* **number-literal**
    -   **number-literal** = **digits** ( `.` **digits** )?
    -   **string-literal** = `'` ( **non-quote-character** *or* `\`
        **character** )* `'`

#### Semantics

An expression is observed with a source value and emits a target
one or more times.  All expressions emit an initial value.  Array
targets are always updated incrementally.  Numbers and boolean are
emited anew each time their value changes.

If any operand is `null` or `undefine`, a binding will not emit an
update.  Thus, if a binding’s source becomes invalid, it does not
corrupt its target but waits until a valid replacement becomes
available.

-   In a chained expression, the first term is evaluated with the source
    value.
-   Each subsequent term uses the target of the previous as its source.
-   Literals are interpreted as their corresponding value.
-   A property expression observes the named key of the source object.
-   An element identifier (with the `#` prefix) uses the `document`
    property of the `parameters` object and emits
    `document.getElementById(id)`, or dies trying.  Changes to the
    document are not observed.
-   A component label (with the `@` prefix) uses the `serialization`
    property of `parameters` object and emits
    `serialization.getObjectForLable(label)`, or dies trying.  Changes
    to the serialization are not observed.  This syntax exists to
    support [Montage][] serializations.
-   A "map" block observes the source array and emits a target array.
    The target array is emitted once and all subsequent updates are
    reflected as content changes that can be independently observed with
    `addContentChangeListener`.  Each element of the target array
    corresponds to the observed value of the block expression using the
    respective element in the source array as the source value.
-   A "filter" block observes the source array and emits a target array
    containing only those values from the source array that actively
    pass the predicate described in the block expression useing the
    respective element in the source array as the source value.  As with
    "map", filters update the target array incrementally.
-   Any function call with a "block" implies calling the function on the
    result of a "map" block.
-   A "flatten" function call observes a source array and produces a
    target array.  The source array must only contain inner arrays.  The
    target array is emitted once and all subsequent updates can be
    independently observed with `addContentChangeListener`.  The target
    array will always contain the concatenation of all of the source
    arrays.  Changes to the inner and outer source arrays are reflected
    with incremental splices to the target array in their corresponding
    positions.
-   A "reversed" function call observes the source array and produces a
    target array that contains the elements of the source array in
    reverse order.  The target is incrementally updated.
-   A "sum" function call observes the numeric sum of the source array.
    Each alteration to the source array causes a new sum to be emitted,
    but the sum is computed incrementally by observing the smaller sums
    of the spliced values, added and removed.
-   An "average" function call observes the average of the input values,
    much like "sum".
-   A "has" function call observes the source collection for whether it
    contains an observed value.
-   A "tuple" expression observes a source value and emits a single
    target array with elements corresponding to the respective
    expression in the tuple.  Each inner expression is evaluated with
    the same source value as the outer expression.
-   `.*` at the end of a chain has no effect on an observed value.

On the left hand side of a binding, the last term has alternate
semantics.  Binders receive a target as well as a source.

-   A "property" observes an object and a property name from the target,
    and a value from the source.  When any of these change, the binder
    upates the value for the property name of the object.
-   A "equals" expression observes a boolean value from the source.  If
    that boolean becomes true, the equality expression is made true by
    assigning the right expression to the left property of the equality,
    turning the "equals" into an "assign" conceptually.  No action is
    taken if the boolean becomes false.
-   A "reversed" expression observes an indexed collection and maintains
    a mirror array of that collection.
-   A "has" function call observes a boolean value from the source, and
    an collection and a sought value from the target.  When the value is
    true and the value is absent in the collection, the binder uses the
    `add` method of the collection (provided by a shim for arrays) to
    make it true that the collection contains the sought value.  When
    the value is false and the value does appear in the collection one
    or more times, the binder uses the `delete` or `remove` method of
    the collection to remove all occurrences of the sought value.

If the target expression ends with `.*`, the content of the target is
bound instead of the property.  This is useful for binding the content
of a non-array collection to the content of another indexed collection.
The collection can be any collection that implements the "observable
content" interface including `dispatchContentChange(plus, minus,
index)`, `addContentChangeListener`, and `removeContentChangeListener`.

#### Interface

```javascript
var parse = require("frb/parse");
var compileObserver = require("frb/compile-observer");
var compileBinder = require("frb/compile-binder");
```

-   `parse(text)` returns a syntax tree.
-   `compileObserver(syntax)` returns an observer function of the form
    `observe(callback, source, parameters)` which in turn returns a
    `cancel()` function.  `compileObserver` visits the syntax tree and
    creates functions for each node, using the `observers` module.
-   `compileBinder(syntax)` returns a binder function of the form
    `bind(observeValue, source, target, parameters)` which in turn
    returns a `cancel()` function.  `compileBinder` visits the root node
    of the syntax tree and delegates to `compileObserver` for its terms.
    The root node must be a `property` at this time, but could
    conceivably be any function with a clear inverse operation like
    `map` and `reversed`.

#### Syntax Tree

The syntax tree is JSON serializable and has a "type" property.  Nodes
have the following types:

-   `value` corresponds to observing the source value
-   `parameters` corresponds to observing the parameters object
-   `literal` has a `value` property and observes that value

All other node types have an "args" property that is an array of syntax
nodes.

-   `property`: corresponds to observing a property named by the right
    argument of the left argument.
-   `get`: corresponds to observing the value for a key in a collection.
-   `mapBlock`: the left is the input, the right is an expression to
    observe on each element of the input.
-   `filterBlock`: the left is the input, the right is an expression to
    determine whether the result is included in the output.
-   `sortedBlock`: the left is the input, the right is a relation on
    each value of the input on which to compare to determine the order.
-   `map`: the left is the input, the right is a function that accepts
    a value and returns the mapped result for each value of the input.
-   `filter` (TODO): the left is the input, the right is a function that
    accepts a value and returns whether to include that value in the
    output.
-   `sorted` (TODO): the left is the input, the right is a function that
    accepts a value and returns a value to compare to determine the
    order of the sorted output.
-   `tuple`: has any number of arguments, each an expression to observe
    in terms of the source value.
-   `view`: the arguments are the input, the start position, and the
    length of the sliding window to view from the input.  The input may
    correspond to any ranged content collection, like an array or sorted
    set.

For all operators, the "args" property are operands.  The node types for
unary operators are:

-   ```+```: `number`, arithmetic coercion
-   ```-```: `neg`, arithmetic negation
-   ```!```: `not`, logical negation

For all binary operators, the node types are:

-   ```**```: `pow`, exponential power
-   ```//```: `root`, binary
-   ```%%```: `log`, logarithm with base
-   ```*```: `mul`, multiplication
-   ```/```: `div`, division
-   ```%```: `mod`, modulo (toward negative infinity, always positive)
-   ```rem```: `rem`, remainder (toward zero, negative if negative)
-   ```+```: `add`, addition
-   ```-```: `sub`, subtraction
-   ```<```: `lt`, less than
-   ```<=```: `le`, less than or equal
-   ```>```: `gt`, greater than
-   ```>=```: `ge`, greater than or equal
-   ```=``` and ```==```: ``equals``, equality comparison and assignment
-   ```!=``` produces unary negation and equality comparison or
    assignment so does not have a corresponding node type.  The
    simplification makes it easier to rotate the syntax tree
    algebraically.
-   ```&&```, `and`, logical and
-   ```||```, `or`, logical or

For all function calls, the right hand side is a tuple of arguments,
presently ignored.

-   `reversed`
-   `enumerate`
-   `flatten`
-   `sum`
-   `average`


### Observers and Binders

The `observers` module contains functions for making all of the
different types of observers, and utilities for creating new ones.
All of these functions are or return an observer function of the form
`observe(emit, value, parameters)` which in turn returns `cancel()`.

-   `observeValue`
-   `observeParameters`
-   `makeLiteralObserver(value)`
-   `makeElementObserver(id)`
-   `makeComponentObserver(label)`
-   `makeRelationObserver(callback, thisp)` is unavailable through the
    property binding language, translates a value through a JavaScript
    function.
-   `makeComputerObserver(observeArgs, compute, thisp)` applies
    arguments to the computation function to get a new value.
-   `makeConverterObserver(observeValue, convert, thisp)` calls the
    converter function to transform a value to a converted value.
-   `makePropertyObserver(observeObject, observeKey)`
-   `makeGetObserver(observeCollection, observeKey)`
-   `makeMapFunctionObserver(observeArray, observeFunction)`
-   `makeMapBlockObserver(observeArray, observeRelation)`
-   `makeFilterBlockObserver(observeArray, observePredicate)`
-   `makeSortedBlockObserver(observeArray, observeRelation)`
-   `makeEnumerationObserver(observeArray)`
-   `makeFlattenObserver(observeOuterArray)`
-   `makeTupleObserver(...observers)`
-   `makeObserversObserver(observers)`
-   `makeReversedObserver(observeArrayh)`
-   `makeWindowObserver` is not presently available through the language
    and is subject to change.  It is for watching a length from an array
    starting at an observable index.
-   `makeSumObserver(observeArray)`
-   `makeAverageObserver(observeArray)`

These are utilities for making observer functions.

-   `makeNonReplacing(observe)` accepts an array observer (the emitted
    values must be arrays) and returns an array observer that will only
    emit the target once and then incrementally update that target.  All
    array observers use this decorator to handle the case where the
    source value gets replaced.
-   `makeArrayObserverMaker(setup)` generates an observer that uses an
    array as its source and then incrementally updates a target value,
    like `sum` and `average`.  The `setup(source, emit)` function must
    return an object of the form `{contentChange, cancel}` and arrange
    for `emit` to be called with new values when `contentChange(plus,
    minus, index)` receives incremental updates.
-   `makeUniq(callback)` wraps an emitter callback such that it only
    forwards new values.  So, if a value is repeated, subsequent calls
    are ignored.
-   `autoCancelPrevious(callback)` accepts an observer callback and
    returns an observer callback.  Observer callbacks may return
    cancelation functions, so this decorator arranges for the previous
    canceler to be called before producing a new one, and arranges for
    the last canceler to be called when the whole tree is done.
-   `once(callback)` accepts a canceler function and ensures that the
    cancelation routine is only called once.

The `binders` module contains similar functions for binding an observed
value to a bound value.  All binders are of the form `bind(observeValue,
source, target, parameters)` and return a `cancel()` function.

-   `makePropertyBinder(observeObject, observeKey)`
-   `makeGetBinder(observeCollection, observeKey)`
-   `makeHasBinder(observeCollection, observeValue)`
-   `makeEqualityBinder(observeLeft, observeRight)`
-   `makeRangeContentBinder(observeTarget)`
-   `makeMapContentBinder(observeTarget)`
-   `makeReversedBinder(observeTarget)`


[Collections]: https://github.com/kriskowal/collections
[Define Property]: http://kangax.github.com/es5-compat-table/#define-property-webkit-note
[Montage]: https://github.com/montagejs/montage
[Mr]: https://github.com/kriskowal/mr
[Mutation Observers]: https://developer.mozilla.org/en-US/docs/DOM/DOM_Mutation_Observers
[Node.js]: http://nodejs.org/

