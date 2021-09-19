<img src="frb.png" align="right" alt="FRB Logo">

# Functional Reactive Bindings

[![npm version](https://img.shields.io/npm/v/frb.svg?style=flat)](https://www.npmjs.com/package/frb)

[![Build Status](https://travis-ci.org/montagejs/frb.png?branch=master)](http://travis-ci.org/montagejs/frb)

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
var bind = require("core/frb/bind");
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

### Properties

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

### Strings

String concatenation is straightforward.

```javascript
var object = {name: "world"};
bind(object, "greeting", {"<-": "'hello ' + name + '!'"});
expect(object.greeting).toBe("hello world!");
```

### Sum

Some advanced queries are possible with one-way bindings from
collections.  FRB updates sums incrementally.  When values are added or
removed from the array, the sum of only those values is taken and added
or removed from the last known sum.

```javascript
var object = {array: [1, 2, 3]};
bind(object, "sum", {"<-": "array.sum()"});
expect(object.sum).toEqual(6);
```

### Average

The arithmetic mean of a collection can be updated incrementally.  Each
time the array changes, the added and removed values adjust the last
known sum and count of values in the array.

```javascript
var object = {array: [1, 2, 3]};
bind(object, "average", {"<-": "array.average()"});
expect(object.average).toEqual(2);
```

### Rounding

The `round`, `floor`, and `ceil` methods operate on numbers and return
the nearest integer, the nearest integer toward -infinity, and the
nearest integer toward infinity respectively.

```javascript
var object = {number: -0.5};
Bindings.defineBindings(object, {
    "round": {"<-": "number.round()"},
    "floor": {"<-": "number.floor()"},
    "ceil": {"<-": "number.ceil()"}
});
expect(object.round).toBe(0);
expect(object.floor).toBe(-1);
expect(object.ceil).toBe(0);
```

### Last

FRB provides an operator for watching the last value in an Array.

```javascript
var array = [1, 2, 3];
var object = {array: array, last: null};
Bindings.defineBinding(object, "last", {"<-": "array.last()"});
expect(object.last).toBe(3);

array.push(4);
expect(object.last).toBe(4);
```

When the dust settles, `array.last()` is equivalent to
`array[array.length - 1]`, but the `last` observer guarantees that it
will not jitter between the ultimate value and null or the penultimate
value of the collection.  With `array[array.length]`, the underlying may
not change its content and length atomically.

```javascript
var changed = jasmine.createSpy();
PropertyChanges.addOwnPropertyChangeListener(object, "last", changed);
array.unshift(0);
array.splice(3, 0, 3.5);
expect(object.last).toBe(4);
expect(changed).not.toHaveBeenCalled();

array.pop();
expect(object.last).toBe(3);

array.clear();
expect(object.last).toBe(null);
```

### Only

FRB provides an `only` operator, which can either observe or bind the
only element of a collection.  The `only` observer watches a collection
for when there is only one value in that collection and emits that
value..  If there are multiple values, it emits null.

```javascript
var object = {array: [], only: null};
Bindings.defineBindings(object, {
    only: {"<->": "array.only()"}
});

object.array = [1];
expect(object.only).toBe(1);

object.array.pop();
expect(object.only).toBe(undefined);

object.array = [1, 2, 3];
expect(object.only).toBe(undefined);
```

The `only` binder watches a value.  When the value is null, it does
nothing.  Otherwise, it will update the bound collection such that it
only contains that value.  If the collection was empty, it adds the
value.  Otherwise, if the collection did not have the value, it replaces
the collection's content with the one value.  Otherwise, it removes
everything but the value it already contains.  Regardless of the means,
the end result is the same.  If the value is non-null, it will be the
only value in the collection.

```javascript
object.only = 2;
expect(object.array.slice()).toEqual([2]);
// Note that slice() is necessary only because the testing scaffold
// does not consider an observable array equivalent to a plain array
// with the same content

object.only = null;
object.array.push(3);
expect(object.array.slice()).toEqual([2, 3]);
```

### One

Like the `only` operator, there is also a `one` operator.  The `one`
operator will observe one value from a collection, whatever value is
easiest to obtain.  For an array, it's the first value; for a sorted
set, it's whatever value was most recently found or added; for a heap,
it's whatever is on top.  However, if the collection is null, undefined,
or empty, the result is `undefined`.

```javascript
var object = {array: [], one: null};
Bindings.defineBindings(object, {
    one: {"<-": "array.one()"}
});

expect(object.one).toBe(undefined);

object.array.push(1);
expect(object.one).toBe(1);

// Still there...
object.array.push(2);
expect(object.one).toBe(1);
```

Unlike `only`, `one` is not bindable.

### Map

You can also create mappings from one array to a new array and an
expression to evaluate on each value.  The mapped array is bound once,
and all changes to the source array are incrementally updated in the
target array.

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
that pass the test deescribed in the block.  As values of the source
array are added, removed, or changed such that they go from passing to
failing or failing to passing, the filtered array gets incrementally
updated to include or exclude those values in their proper positions, as
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

### Scope

In a binding, there is always a value in scope.  It is the implicit
value for looking up properties and for applying operators, like
methods.  The value in scope can be called out explicitly as `this`.  On
the left side, the value in scope is called the target, on the right it
is called the source.

Each scope has a `this` value and may have a parent scope.  Inside a
map block, like the `number` in `numbers.map{number}`, the value in
scope is one of the numbers, and the value in the parent scope is an
object with a `numbers` property.  To access the value in a parent
scope, use the parent scope operator, `^`.

Suppose you have an object with `numbers` and `maxNumber` properties.
In this example, we bind a property, `smallNumbers` to an array of all
the `numbers` less than or equal to the `maxNumber`.

```javascript
var object = Bindings.defineBindings({
    numbers: [1, 2, 3, 4, 5],
    maxNumber: 3
}, {
    smallNumbers: {
        "<-": "numbers.filter{this <= ^maxNumber}"
    }
});
```

Keywords like `this` overlap with the notation normally used for
properties of `this`.  If an object has a `this` property, you may use
the notation `.this`, `this.this`, or `this['this']`.  `.this` is the
normal form.

```javascript
var object = Bindings.defineBindings({
    "this": 10
}, {
    that: {"<-": ".this"}
});
expect(object.that).toBe(object["this"]);
```

The only other FRB keywords that collide with propery names are `true`,
`false`, and `null`, and the same technique for disambiguation applies.

### Some and Every

A `some` block incrementally tracks whether some of the values in a
collection meet a criterion.

```javascript
var object = Bindings.defineBindings({
    options: [
        {checked: true},
        {checked: false},
        {checked: false}
    ]
}, {
    anyChecked: {
        "<-": "options.some{checked}"
    }
});
expect(object.anyChecked).toBe(true);
```

An `every` block incrementally tracks whether all of the values in a
collection meet a criterion.

```javascript
var object = Bindings.defineBindings({
    options: [
        {checked: true},
        {checked: false},
        {checked: false}
    ]
}, {
    allChecked: {
        "<-": "options.every{checked}"
    }
});
expect(object.allChecked).toBe(false);
```

You can use a two-way binding on `some` and `every` blocks.

```javascript
var object = Bindings.defineBindings({
    options: [
        {checked: true},
        {checked: false},
        {checked: false}
    ]
}, {
    allChecked: {
        "<->": "options.every{checked}"
    },
    noneChecked: {
        "<->": "!options.some{checked}"
    }
});

object.noneChecked = true;
expect(object.options.every(function (option) {
    return !option.checked
}));

object.allChecked = true;
expect(object.noneChecked).toBe(false);
```

The caveat of an `equals` binding applies.  If the condition for every
element of the collection is set to true, the condition will be bound
incrementally to true on each element.  When the condition is set to
false, the binding will simply be canceled.

```javascript
object.allChecked = false;
expect(object.options.every(function (option) {
    return option.checked; // still checked
}));
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

### Unique and Sorted

FRB can create a sorted index of unique values using `sortedSet` blocks.

```javascript
var object = Bindings.defineBindings({
    folks: [
        {id: 4, name: "Bob"},
        {id: 2, name: "Alice"},
        {id: 3, name: "Bob"},
        {id: 1, name: "Alice"},
        {id: 1, name: "Alice"} // redundant
    ]
}, {
    inOrder: {"<-": "folks.sortedSet{id}"},
    byId: {"<-": "folks.map{[id, this]}.toMap()"},
    byName: {"<-": "inOrder.toArray().group{name}.toMap()"}
});

expect(object.inOrder.toArray()).toEqual([
    object.byId.get(1),
    object.byId.get(2),
    object.byId.get(3),
    object.byId.get(4)
]);

expect(object.byName.get("Alice")).toEqual([
    object.byId.get(1),
    object.byId.get(2)
]);
```

The outcome is a `SortedSet` data structure, not an `Array`.  The sorted
set is useful for fast lookups, inserts, and deletes on sorted, unique
data.  If you would prefer a sorted array of unique values, you can
combine other operators to the same effect.

```javascript
var object = Bindings.defineBindings({
    folks: [
        {id: 4, name: "Bob"},
        {id: 2, name: "Alice"},
        {id: 3, name: "Bob"},
        {id: 1, name: "Alice"},
        {id: 1, name: "Alice"} // redundant
    ]
}, {
    index: {"<-": "folks.group{id}.sorted{.0}.map{.1.last()}"}
});

expect(object.index).toEqual([
    {id: 1, name: "Alice"},
    {id: 2, name: "Alice"},
    {id: 3, name: "Bob"},
    {id: 4, name: "Bob"}
]);
```


### Min and Max

A binding can observe the minimum or maximum of a collection.  FRB uses
a binary heap internally to incrementally track the minimum or maximum
value of the collection.

```javascript
var object = Bindings.defineBindings({}, {
    min: {"<-": "values.min()"},
    max: {"<-": "values.max()"}
});

expect(object.min).toBe(undefined);
expect(object.max).toBe(undefined);

object.values = [2, 3, 2, 1, 2];
expect(object.min).toBe(1);
expect(object.max).toBe(3);

object.values.push(4);
expect(object.max).toBe(4);
```

Min and max blocks accept an expression on which to compare values from
the collection.

```javascript
var object = Bindings.defineBindings({}, {
    loser: {"<-": "rounds.min{score}.player"},
    winner: {"<-": "rounds.max{score}.player"}
});

object.rounds = [
    {score: 0, player: "Luke"},
    {score: 100, player: "Obi Wan"},
    {score: 250, player: "Vader"}
];
expect(object.loser).toEqual("Luke");
expect(object.winner).toEqual("Vader");

object.rounds[1].score = 300;
expect(object.winner).toEqual("Obi Wan");
```

### Group

FRB can incrementally track equivalence classes within in a collection.
The group block accepts an expression that determines the equivalence
class for each object in a collection.  The result is a nested data
structure: an array of [key, class] pairs, where each class is itself an
array of all members of the collection that have the corresponding key.

```javascript
var store = Bindings.defineBindings({}, {
    "clothingByColor": {"<-": "clothing.group{color}"}
});
store.clothing = [
    {type: 'shirt', color: 'blue'},
    {type: 'pants', color: 'red'},
    {type: 'blazer', color: 'blue'},
    {type: 'hat', color: 'red'}
];
expect(store.clothingByColor).toEqual([
    ['blue', [
        {type: 'shirt', color: 'blue'},
        {type: 'blazer', color: 'blue'}
    ]],
    ['red', [
        {type: 'pants', color: 'red'},
        {type: 'hat', color: 'red'}
    ]]
]);
```

Tracking the positions of every key and every value in its equivalence
class can be expensive.  Internally, `group` blocks are implemented with
a `groupMap` block followed by an `entries()` observer.  The `groupMap`
produces a `Map` data structure and does not waste any time, but does
not produce range change events.  The `entries()` observer projects the
map of classes into the nested array data structure.

You can use the `groupMap` block directly.

```javascript
Bindings.cancelBinding(store, "clothingByColor");
Bindings.defineBindings(store, {
    "clothingByColor": {"<-": "clothing.groupMap{color}"}
});
var blueClothes = store.clothingByColor.get('blue');
expect(blueClothes).toEqual([
    {type: 'shirt', color: 'blue'},
    {type: 'blazer', color: 'blue'}
]);

store.clothing.push({type: 'gloves', color: 'blue'});
expect(blueClothes).toEqual([
    {type: 'shirt', color: 'blue'},
    {type: 'blazer', color: 'blue'},
    {type: 'gloves', color: 'blue'}
]);
```

The `group` and `groupMap` blocks both respect the type of the source
collection.  If instead of an array you were to use a `SortedSet`, the
equivalence classes would each be sorted sets.  This is useful because
replacing values in a sorted set can be performed with much less waste
than with a large array.

### View

Suppose that your source is a large data store, like a `SortedSet` from
the [Collections][] package.  You might need to view a sliding window
from that collection as an array.  The `view` binding reacts to changes
to the collection and the position and length of the window.

```javascript
var SortedSet = require("montage/core/collections/sorted-set");
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

An enumeration observer produces `[index, value]` pairs.  You can bind
to the index or the value in subsequent stages.  The prefix dot
distinguishes the zeroeth property from the literal zero.

```javascript
var object = {letters: ['a', 'b', 'c', 'd']};
bind(object, "lettersAtEvenIndexes", {
    "<-": "letters.enumerate().filter{!(.0 % 2)}.map{.1}"
});
expect(object.lettersAtEvenIndexes).toEqual(['a', 'c']);
object.letters.shift();
expect(object.lettersAtEvenIndexes).toEqual(['b', 'd']);
```

### Range

A range observes a given length and produces and incrementally updates
an array of consecutive integers starting with zero with that given
length.

```javascript
var object = Bindings.defineBinding({}, "stack", {
    "<-": "&range(length)"
});
expect(object.stack).toEqual([]);

object.length = 3;
expect(object.stack).toEqual([0, 1, 2]);

object.length = 1;
expect(object.stack).toEqual([0]);
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

### Concat

You can observe the concatenation of collection of dynamic arrays.

```javascript
var object = Bindings.defineBinding({
    head: 10,
    tail: [20, 30]
}, "flat", {
    "<-": "[head].concat(tail)"
});
expect(object.flat).toEqual([10, 20, 30]);
```

The underlying mechanism is equivalent to `[[head], tail].flatten()`.

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
and OrderedSets that all can send ranged content change notifications and thus
can be bound.

```javascript
// Continued from above...
var Set = require("core/collections/set");
object.haystack = new Set([1, 2, 3]);
expect(object.hasNeedle).toBe(true);
```

Likewise, Maps implement `addMapChangeListener`, so you can use a `has` binding
to observe whether an entry exists with the given key.

```javascript
// Continued from above...
var Map = require("core/collections/map");
object.haystack = new Map([[1, "a"], [2, "b"]]);
object.needle = 2;
expect(object.hasNeedle).toBe(true);
object.needle = 3;
expect(object.hasNeedle).toBe(false);
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
`addRangeChangeListener` or `removeRangeChangeListener`, so it
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
    "<->": "array.get(1)"
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
var Map = require("core/collections/map");
var a = {id: 0}, b = {id: 1};
var object = {
    source: new Map([[a, 10], [b, 20]]),
    key: null,
    selected: null
};

var cancel = bind(object, "selected", {
    "<-": "source.get(key)"
});
expect(object.selected).toBe(undefined);

object.key = a;
expect(object.selected).toBe(10);

object.key = b;
expect(object.selected).toBe(20);

object.source.set(b, 30);
expect(object.selected).toBe(30);

var SortedMap = require("core/collections/sorted-map");
object.source = SortedMap();
expect(object.selected).toBe(undefined);

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
var Map = require("core/collections/map");
var object = {
    a: new Map({a: 10}),
    b: new Map()
};
var cancel = bind(object, "a.mapContent()", {"<->": "b.mapContent()"});
expect(object.a.toObject()).toEqual({});
expect(object.b.toObject()).toEqual({});

object.a.set('a', 10);
expect(object.a.toObject()).toEqual({a: 10});
expect(object.b.toObject()).toEqual({a: 10});

object.b.set('b', 20);
expect(object.a.toObject()).toEqual({a: 10, b: 20});
expect(object.b.toObject()).toEqual({a: 10, b: 20});
```

In this case, the source of the binding is a different object than the
target, so the binding descriptor specifies the alternate source.

### Keys, Values, Entries

If the source of a binding is a map, FRB can also translate changes to
the map into changes on an array.  The `keys`, `values`, and `entries`
observers produce incrementally updated projections of the
key-value-mappings onto an array.

```javascript
var Map = require("core/collections/map");
var object = Bindings.defineBindings({}, {
    keys: {"<-": "map.keysArray()"},
    values: {"<-": "map.valuesArray()"},
    entries: {"<-": "map.entriesArray()"}
});
object.map = new Map({a: 10, b: 20, c: 30});
expect(object.keys).toEqual(['a', 'b', 'c']);
expect(object.values).toEqual([10, 20, 30]);
expect(object.entries).toEqual([['a', 10], ['b', 20], ['c', 30]]);

object.map.set('d', 40);
object.map.delete('a');
expect(object.keys).toEqual(['b', 'c', 'd']);
expect(object.values).toEqual([20, 30, 40]);
expect(object.entries).toEqual([['b', 20], ['c', 30], ['d', 40]]);
```

### Coerce to Map

Records (Objects with a fixed shape), arrays of entries, and Maps
themselves can be coerced to an incrementally updated `Map` with the
`toMap` operator.

```javascript
var object = Bindings.defineBindings({}, {
    map: {"<-": "entries.toMap()"}
});

// map property will persist across changes to entries
var map = object.map;
expect(map).not.toBe(null);

object.entries = {a: 10};
expect(map.keysArray()).toEqual(['a']);
expect(map.has('a')).toBe(true);
expect(map.get('a')).toBe(10);
```

The `toMap` observer maintains the insertion order of the keys.

```javascript
// Continued...
object.entries = [['b', 20], ['c', 30]];
expect(map.keysArray()).toEqual(['b', 'c']);

object.entries.push(object.entries.shift());
expect(map.keysArray()).toEqual(['c', 'b']);
```

If the entries do not have unique keys, the last entry wins.  This is
managed internally by observing, `entries.group{.0}.map{.1.last()}`.

```javascript
// Continued...
object.entries = [['a', 10], ['a', 20]];
expect(map.get('a')).toEqual(20);
object.entries.pop();
expect(map.get('a')).toEqual(10);
```

`toMap` binds the content of the output map to the content of the input
map and will clear and repopulate the output map if the input map is
replaced.

```
// Continued...
object.entries = new Map({a: 10});
expect(map.keysArray()).toEqual(['a']);
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
    "orangeElement.checked": {"<->": "fruit == 'orange'"},
    "appleElement.checked": {"<->": "fruit == 'apple'"},
});

component.orangeElement.checked = true;
expect(component.fruit).toEqual("orange");

component.appleElement.checked = true;
expect(component.fruit).toEqual("apple");
```

Because equality and assignment are interchanged in this language, you
can use either `=` or `==`.

FRB also supports a comparison operator, `<=>`, which uses
`Object.compare` to determines how two operands should be sorted in
relation to each other.

### Array and Map Content

In JavaScript, arrays behave both like objects (in the sense that every
index is a property, but also like a map collection of index-to-value
pairs.  The [Collections][] package goes so far as to patch up the
`Array` prototype so arrays can masquerade as maps, with the caveat that
`delete(value)` behaves like a Set instead of a Map.

This duplicity is reflected in FRB.  You can access the values in an
array using the object property notation or the mapped key notation.

```javascript
var object = {
    array: [1, 2, 3]
};
Bindings.defineBindings(object, {
    first: {"<-": "array.0"},
    second: {"<-": "array.get(1)"}
});
expect(object.first).toBe(1);
expect(object.second).toBe(2);
```

To distinguish a numeric property of the source from a number literal,
use a dot.  To distingish a mapped index from an array literal, use an
empty expression.

```javascript
var array = [1, 2, 3];
var object = {};
Bindings.defineBindings(object, {
    first: {
        "<-": ".0",
        source: array
    },
    second: {
        "<-": "get(1)",
        source: array
    }
});
expect(object.first).toBe(1);
expect(object.second).toBe(2);
```

Unlike property notation, map notation can observe a variable index.

```javascript
var object = {
    array: [1, 2, 3],
    index: 0
};
Bindings.defineBinding(object, "last", {
    "<-": "array.get(array.length - 1)"
});
expect(object.last).toBe(3);

object.array.pop();
expect(object.last).toBe(2);
```

You can also bind *all* of the content of an array by range or by
mapping.  The notation for binding ranged content is `rangeContent()`.
Every change to an Array or SortedSet dispatches range changes and any
collection that implements `splice` and `swap` can be a target for such
changes.

```javascript
var SortedSet = require("core/collections/sorted-set");
var object = {
    set: SortedSet(),
    array: []
};
Bindings.defineBindings(object, {
    "array.rangeContent()": {"<-": "set"}
});
object.set.addEach([5, 2, 6, 1, 4, 3]);
expect(object.array).toEqual([1, 2, 3, 4, 5, 6]);
```

The notation for binding the content of any mapping collection using map
changes is `mapContent()`.  On the target of a binding, this will note
when values are added or removed on each key of the source collection
and apply the same change to the target.  The target and source can be
arrays or map collections.

```javascript
var Map = require("core/collections/map");
var object = {
    map: new Map(),
    array: []
};
Bindings.defineBinding(object, "map.mapContent()", {
    "<-": "array"
});
object.array.push(1, 2, 3);
expect(object.map.toObject()).toEqual({
    0: 1,
    1: 2,
    2: 3
});
```

### Value

A note about the source value: an empty path implies the source value.
Using empty paths and empty expressions is useful in some situations.

If a value is ommitted on either side of an operator, it implies the
source value.  The expression `sorted{}` indicates a sorted array, where
each value is sorted by its own numeric value.  The expression
`filter{!!}` would filter falsy values.  The operand is implied.
Similarly, `filter{!(%2)}` produces only even values.

This is why you can use `.0` to get the zeroth property of an array, to
distingiush the form from `0` which would be a numeric literal, and why
you can use `()[0]` to map the zeroeth key of a map or array, to
distinguish the form from `[0]` which would be an array literal.

### With Context Value

Expressions can be evaluated in the context of another value using a
variant of property notation.  A parenthesized expression can follow a
path.

```javascript
var object = {
    context: {a: 10, b: 20}
};
Bindings.defineBinding(object, "sum", {
    "<-": "context.(a + b)"
});
expect(object.sum).toBe(30);

Bindings.cancelBinding(object, "sum");
object.context.a = 20;
expect(object.sum).toBe(30); // unchanged
```

To observe a constructed array or object literal, the expression does
not need parentheses.

```javascript
var object = {
    context: {a: 10, b: 20}
};
Bindings.defineBindings(object, {
    "duple": {"<-": "context.[a, b]"},
    "pair": {"<-": "context.{key: a, value: b}"}
});
expect(object.duple).toEqual([10, 20]);
expect(object.pair).toEqual({key: 10, value: 20});

Bindings.cancelBindings(object);
```

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

The unary `+` operator coerces a value to a number. It is handy for
binding a string to a number.

```javascript
var object = {
    number: null,
    string: null,
};
Bindings.defineBinding(object, "+number", {
    "<-": "string"
});
object.string = '10';
expect(object.number).toBe(10);
```

### Functions

FRB supports some common functions.  `startsWith`, `endsWith`, and
`contains` all operate on strings.  `join` concatenates an array of
strings with a given delimiter (or empty string).  `split` breaks a
string between every delimiter (or just between every character).
`join` and `split` are algebraic and can be bound as well as observed.

### Conditional

FRB supports the ternary conditional operator, if `?` then `:` else.

```javascript
var object = Bindings.defineBindings({
    condition: null,
    consequent: 10,
    alternate: 20
}, {
    choice: {"<->": "condition ? consequent : alternate"}
});

expect(object.choice).toBe(undefined); // no choice made

object.condition = true;
expect(object.choice).toBe(10);

object.condition = false;
expect(object.choice).toBe(20);
```

The ternary operator can bind in both directions.

```javascript
object.choice = 30;
expect(object.alternate).toBe(30);

object.condition = true;
object.choice = 40;
expect(object.consequent).toBe(40);
```

### And

The logical **and** operator, `&&`, observes either the left or right
argument depending on whether the first argument is both defined and
true.  If the first argument is null, undefined, or false, it will stand
for the whole expression.  Otherwise, the second argument will stand for
the whole expression.

If we assume that the first and second argument are always defined and
either true or false, the **and** operator serves strictly as a logical
combinator.  However, with bindings, it is common for a value to at
least initially be null or undefined.  Logical operators are the
exception to the rule that an expression will necessarily terminate if
any operand is null or undefined.

In this example, the left and right sides are initially undefined.  We
set the right operand to `10` and the bound value remains undefined.

```javascript
var object = Bindings.defineBindings({
    left: undefined,
    right: undefined
}, {
    and: {"<-": "left && right"}
});

object.right = 10;
expect(object.and).toBe(undefined);
```

We set the left operand to `20`.  The bound value becomes the value of
the right operand, `10`.

```javascript
// Continued...
object.left = 20;
expect(object.and).toBe(10);
```

---

Interestingly, logical **and** is bindable.  The objective of the
binding is to do whatever is necessary, if possible, to make the logical
expression equal the bound value.

Supposing that both the left and right operands are false, and the
result is or becomes true, to satisfy the equality `left && right ==
true`, both left and right must be set and bound to `true`.

```javascript
var object = Bindings.defineBindings({}, {
    "left && right": {
        "<-": "leftAndRight"
    }
});

object.leftAndRight = true;
expect(object.left).toBe(true);
expect(object.right).toBe(true);
```

As with the equals binder, logic bindings will prefer to alter the left
operand if altering either operand would suffice to validate the
expression.  So, if the expression then becomes false, it is sufficient
to set the left side to false to satisfy the equality.

```javascript
// Continued...
object.leftAndRight = false;
expect(object.left).toBe(false);
expect(object.right).toBe(true);
```

This can facilitate some interesting, tri-state logic.  For example, if
you have a checkbox that can be checked, unchecked, or disabled, and you
want it to be unchecked if it is disabled, you can use logic bindings to
ensure this.

```javascript
var controller = Bindings.defineBindings({
    checkbox: {
        checked: false,
        disabled: false
    },
    model: {
        expanded: false,
        children: [1, 2, 3]
    }
}, {
    "checkbox.checked": {"<->": "model.expanded && expandable"},
    "checkbox.disabled": {"<-": "!expandable"},
    "expandable": {"<-": "model.children.length > 0"}
});

expect(controller.checkbox.checked).toBe(false);
expect(controller.checkbox.disabled).toBe(false);

// check the checkbox
controller.checkbox.checked = true;
expect(controller.model.expanded).toBe(true);

// alter the model such that the checkbox is unchecked and disabled
controller.model.children.clear();
expect(controller.checkbox.checked).toBe(false);
expect(controller.checkbox.disabled).toBe(true);
```

### Or

As with the **and** operator, the logical **or** is an exception to the
rule that an expression is null, undefined, or empty if any of the
operands are null or undefined.  If both operands are defined and
boolean, **or** expressions behave strictly within the realm of logic.
However, if the values are non-boolean or even non-values, they serve to
select either the left or right side based on whether the left side is
defined and true.

If the first argument is undefined or false, the aggregate expression
will evaluate to the second argument, even if that argument is null or
undefined.

Suppose we bind `or` to `left || right` on some object.  `or` will be
`undefined` initially, but if we set the `right` to `10`, `or` will
become `10`, bypassing the still undefined left side.

```javascript
var object = Bindings.defineBindings({
    left: undefined,
    right: undefined
}, {
    or: {"<-": "left || right"}
});

object.right = 10;
expect(object.or).toBe(10);
```

However, the left hand side takes precedence over the right if it is
defined and true.

```javascript
// Continued...
object.left = 20;
expect(object.or).toBe(20);
```

And it will remain bound, even if the right hand side becomes undefined.

```javascript
object.right = undefined;
expect(object.or).toBe(20);
```

> Aside: JavaScript’s `delete` operator performs a configuration change,
> and desugars to `Object.defineProperty`, and is not interceptable with
> an ES5 setter.  So, don't use it on any property that is involved in a
> binding.  Setting to null or undefined should suffice.

---

Logical **or** is bindable.  As with logical **and**, the binding
performs the minimum operation necessary to ensure that the expression
is equal.  If the expression becomes true, and either of the operands
are true, the nothing needs to change.  If the expression becomes false,
however, both operands must be bound to false.  If the expression
becomes true again, it is sufficient to bind the left operand to true to
ensure that the expression as a whole is true.  Rather than belabor the
point, I leave as an exercise to the reader to apply DeMorgan’s Theorem
to the documentation for logical **and** bindings.


### Default

The **default** operator, `??`, is similar to the **or**, `||` operator,
except that it decides whether to use the left or right solely based on
whether the left is defined.  If the left is null or undefined, the
aggregate expression will evaluate to the right expression.  If the left
is defined, even if it is false, the result will be the left expression.

```javascript
var object = Bindings.defineBindings({
    left: undefined,
    right: undefined
}, {
    or: {"<-": "left ?? right"}
});

object.right = 10;
expect(object.or).toBe(10);

object.left = false;
expect(object.or).toBe(false);
```

The default operator is not bindable, but weirder things have happened.

### Defined

The `defined()` operator serves a similar role to the default operator.
If the value in scope is null or undefined, it the result will be false,
and otherwise it will be true.  This will allow a term that may be
undefined to propagate.

```javascript
var object = Bindings.defineBindings({}, {
    ready: {
        "<-": "value.defined()"
    }
});
expect(object.ready).toBe(false);

object.value = 10;
expect(object.ready).toBe(true);
```

The defined operator is also bindable.  If the source is or becomes
false, the target will be bound to `null`.  If the source is null or
false, the binding has no effect.

```javascript
var object = Bindings.defineBindings({
    value: 10,
    operational: true
}, {
    "value.defined()": {"<-": "operational"}
});
expect(object.value).toBe(10);

object.operational = false;
expect(object.value).toBe(undefined);
```

If the source becomes null or undefined, it will cancel the previous
binding but does not set or restore the bound value.  Vaguely becoming
“defined” is not enough information to settle on a particular value.

```javascript
object.operational = true;
expect(object.value).toBe(undefined);
```

However, another binding might settle the issue.

```javascript
Bindings.defineBindings(object, {
    "value == 10": {
        "<-": "operational"
    }
});
expect(object.value).toBe(10);
```

### Algebra

FRB can automatically invert algebraic operators as long as they operate
strictly on the left-most expressions on both the source and target are
bindable properties.

In this example, the primary binding is ```notToBe <- !toBe```, and the
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
comma-delimited, colon-separated entries, enclosed by curly-braces.

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

The left hand side of an entry in a record is any combination of letters
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

### Elements and Components

FRB provides a `#` notation for reaching into the DOM for an element.
This is handy for binding views and models on a controller object.

The `defineBindings` method accepts an optional final argument,
`parameters`, which is shared by all bindings (unless shadowed by a more
specific parameters object on an individual descriptor).

The `parameters` can include a `document`.  The `document` may be any
object that implements `getElementById`.

Additionally, the `frb/dom` is an experiment that monkey-patches the DOM
to make some properties of DOM elements observable, like the `value` or
`checked` attribute of an `input` or `textarea element`.

```javascript
var Bindings = require("core/frb/bindings");
require("core/frb/dom");

var controller = Bindings.defineBindings({}, {

    "fahrenheit": {"<->": "celsius * 1.8 + 32"},
    "celsius": {"<->": "kelvin - 272.15"},

    "#fahrenheit.value": {"<->": "+fahrenheit"},
    "#celsius.value": {"<->": "+celsius"},
    "#kelvin.value": {"<->": "+kelvin"}

}, {
    document: document
});

controller.celsius = 0;
```

One caveat of this approach is that it can cause a lot of DOM repaint
and reflow events.  The [Montage][] framework uses a synchronized draw
cycle and a component object model to minimize the cost of computing CSS
properties on the DOM and performing repaints and reflows, deferring
such operations to individual animation frames.

For a future release of Montage, FRB provides an alternate notation for
reaching into the component object model, using its deserializer.  The
`@` prefix refers to another component by its label.  Instead of
providing a `document`, Montage provides a `serialization`, which in
turn implements `getObjectForLabel`.

```javascript
var Bindings = require("core/frb/bindings");

var controller = Bindings.defineBindings({}, {

    "fahrenheit": {"<->": "celsius * 1.8 + 32"},
    "celsius": {"<->": "kelvin - 272.15"},

    "@fahrenheit.value": {"<->": "+fahrenheit"},
    "@celsius.value": {"<->": "+celsius"},
    "@kelvin.value": {"<->": "+kelvin"}

}, {
    serializer: serializer
});

controller.celsius = 0;
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
callback.  For example, to observe a property’s value *before it
changes*, you can use the `beforeChange` flag.

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
    array.addRangeChangeListener(contentChange);
    return function cancelRangeChange() {
        array.removeRangeChangeListener(contentChange);
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
var Bindings = require("core/frb/bindings");
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
function Multiplier(factor) {
    this.factor = factor;
}
Multiplier.prototype.convert = function (value) {
    return value * this.factor;
};
Multiplier.prototype.revert = function (value) {
    return value / this.factor;
};

var doubler = new Multiplier(2);

var object = Bindings.defineBindings({
    a: 10
}, {
    b: {
        "<->": "a",
        converter: doubler
    }
});
expect(object.b).toEqual(20);

object.b = 10;
expect(object.a).toEqual(5);
```

Reusable converters have an implied direction, from some source type to
a particular target type.  Sometimes the types on your binding are the
other way around.  For that case, you can use the converter as a
reverter.  This merely swaps the `convert` and `revert` methods.

```javascript
var uriConverter = {
    convert: encodeURI,
    revert: decodeURI
};
var model = Bindings.defineBindings({}, {
    "title": {
        "<->": "location",
        reverter: uriConverter
    }
});

model.title = "Hello, World!";
expect(model.location).toEqual("Hello,%20World!");

model.location = "Hello,%20Dave.";
expect(model.title).toEqual("Hello, Dave.");
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
the "q" or "charset" values of the form change.

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

### Polymorphic Extensibility

Bindings support three levels of polymorphic extensibility depending on
the needs of a method that FRB does not anticipate.

If an operator is pure, meaning that all of its operands are value types
that will necessarily need to be replaced outright if they every change,
meaning that they are all effectively stateless, and if all of the
operands must be defined in order for the output to be defined, it is
sufficient to just use a plain JavaScript method.  For example,
`string.toUpperCase()` will work fine.

If an operator responds to state changes of its one and only operand, an
object may implement an observer method.  If the operator is `foo` in
FRB, the JavaScript method is `observeFoo(emit)`.  The observer must
return a cancel function if it will emit new values after it returns, or
if it uses observers itself.  It must stop emitting new values if FRB
calls its canceler.  The emitter may return a canceler itself, and the
observer must call that canceler before it emits a new value.

This is an example of a clock.  The `clock.time()` is an observable
operator of the clock in FRB, implemented by `observeTime`.  It will
emit a new value once a second.

```javascript
function Clock() {
}

Clock.prototype.observeTime = function (emit) {
    var cancel, timeoutHandle;
    function tick() {
        if (cancel) {
            cancel();
        }
        cancel = emit(Date.now());
        timeoutHandle = setTimeout(tick, 1000);
    }
    tick();
    return function cancelTimeObserver() {
        clearTimeout(timeoutHandle);
        if (cancel) {
            cancel();
        }
    };
};

var object = Bindings.defineBindings({
    clock: new Clock()
}, {
    "time": {"<-": "clock.time()"}
});

expect(object.time).not.toBe(undefined);

Bindings.cancelBindings(object);
```

If an operator responds to state changes of its operands, you will need
to implement an observer maker.  An observer maker is a function that
returns an observer function, and accepts observer functions for all of
the arguments you are expected to observe.  The observer must also
handle a scope argument, usually just passing it on at run-time,
`observe(emit, scope)`.  Otherwise it is much the same.

FRB would delegate to `makeTimeObserver(observeResolution)` for a
`clock.time(ms)` FRB expression.

This is an updated rendition of the clock example except that it will
observe changes to a resolution operand and adjust its tick frequency
accordingly.

```javascript
function Clock() {
}

Clock.prototype.observeTime = function (emit, resolution) {
    var cancel, timeoutHandle;
    function tick() {
        if (cancel) {
            cancel();
        }
        cancel = emit(Date.now());
        timeoutHandle = setTimeout(tick, resolution);
    }
    tick();
    return function cancelTimeObserver() {
        clearTimeout(timeoutHandle);
        if (cancel) {
            cancel();
        }
    };
};

Clock.prototype.makeTimeObserver = function (observeResolution) {
    var self = this;
    return function observeTime(emit, scope) {
        return observeResolution(function replaceResolution(resolution) {
            return self.observeTime(emit, resolution);
        }, scope);
    };
};

var object = Bindings.defineBindings({
    clock: new Clock()
}, {
    "time": {"<-": "clock.time(1000)"}
});

expect(object.time).not.toBe(undefined);

Bindings.cancelBindings(object);
```

Polymorphic binders are not strictly impossible, but you would be mad to
try them.


## Reference

Functional Reactive Bindings is an implementation of synchronous,
incremental object-property and collection-content bindings for
JavaScript.  It was ripped from the heart of the [Montage][] web
application framework and beaten into this new, slightly magical form.
It must prove itself worthy before it can return.

-   **functional**: The implementation uses functional building blocks
    to compose observers and binders.
-   **generic**: The implementation uses generic methods on collections,
    like `addRangeChangeListener`, so any object can implement the
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
var Bindings = require("core/frb/bindings");

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
-   `convert`: a function that converts the source value to the target
    value, useful for coercing strings to dates, for example.
-   `revert`: a function that converts the target value to the source
    value, useful for two-way bindings.
-   `converter`: an object with `convert` and optionally also a `revert`
    method.  The implementation binds these methods to their converter
    and stores them in `covert` and `revert`.
-   `serializable`: a note from the Montage Deserializer, to the [Montage
    Serializer][], indicating that the binding came from a
    serialization, and to a serialization it must return.
-   `cancel`: a function to cancel the binding

[Montage Serializer]: https://github.com/montagejs/mousse

### Bind

The `bind` module provides direct access to the `bind` function.

```javascript
var bind = require("core/frb/bind");

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
var compute = require("core/frb/compute");

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
var observe = require("core/frb/observe");

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

### Evaluate

The `compile-evaluator` module returns a function that accepts a syntax
tree and returns an evaluator function.  The evaluator accepts a scope
(which may include a value, parent scope, parameters, a document, and
components) and returns the corresponding value without all the cost or
benefit of setting up incremental observers.

```javascript
var parse = require("core/frb/parse");
var compile = require("core/frb/compile-evaluator");
var Scope = require("core/frb/scope");

var syntax = parse("a.b");
var evaluate = compile(syntax);
var c = evaluate(new Scope({a: {b: 10}}))
expect(c).toBe(10);
```

The `evaluate` module returns a function that accepts a path or syntax
tree, a source value, and parameters and returns the corresponding
value.

```javascript
var evaluate = require("core/frb/evaluate");
var c = evaluate("a.b", {a: {b: 10}})
expect(c).toBe(10);
```


### Stringify

The `stringify` module returns a function that accepts a syntax tree and
returns the corresponding path in normal form.

```javascript
var stringify = require("core/frb/stringify");

var syntax = {type: "and", args: [
    {type: "property", args: [
        {type: "value"},
        {type: "literal", value: "a"}
    ]},
    {type: "property", args: [
        {type: "value"},
        {type: "literal", value: "b"}
    ]}
]};

var path = stringify(syntax);
expect(path).toBe("a && b");
```


### Grammar

The grammar is expressed succinctly in `grammar.pegjs` and is subject to
ammendment.

### Semantics

An expression is observed with a source value and emits a target
one or more times.  All expressions emit an initial value.  Array
targets are always updated incrementally.  Numbers and boolean are
emited anew each time their value changes.

If any operand is `null` or `undefine`, a binding will not emit an
update.  Thus, if a binding’s source becomes invalid, it does not
corrupt its target but waits until a valid replacement becomes
available.

-   Literals are interpreted as their corresponding value.
-   Value terms provide the source.
-   Parameters terms provide the parameters.
-   In a path-expression, the first term is evaluated with the source
    value.
-   Each subsequent term of a path expression uses the target of the
    previous as its source.
-   A property-expression or variable-property-expression observes the
    key of the source object using `Object.addPropertyChangeListener`.
-   An element identifier (with the `#` prefix) uses the `document`
    property of the `parameters` object and emits
    `document.getElementById(id)`, or dies trying.  Changes to the
    document are not observed.
-   A component label (with the `@` prefix) uses the `serialization`
    property of `parameters` object and emits
    `serialization.getObjectForLable(label)`, or dies trying.  Changes
    to the serialization are not observed.  This syntax exists to
    support [Montage][] serializations.
-   A "parent" scope operator, `^` observes the given expression in the
    context of the current scope's parent.
-   A "with" scope operator, e.g., `context.(expression)`, observes the
    given expression in a new scope that uses the `context` as its value
    and the current scope as its parent.
-   A "map" block observes the source array and emits a target array.
    The target array is emitted once and all subsequent updates are
    reflected as content changes that can be independently observed with
    `addRangeChangeListener`.  Each element of the target array
    corresponds to the observed value of the block expression using the
    respective element in the source array as the source value.
-   A "map" function call receives a function as its argument rather
    than a block.
-   A "filter" block observes the source array and emits a target array
    containing only those values from the source array that actively
    pass the predicate described in the block expression useing the
    respective element in the source array as the source value.  As with
    "map", filters update the target array incrementally.
-   A "some" block observes whether any of the values in the source
    collection meet the given criterion.
-   A "every" block observes whether all of the values in the source
    collection meet the given criterion.
-   A "sorted" block observes the sorted version of an array, by a
    property of each value described in the block, or itself if empty.
    Sorted arrays are incrementally updating as values are added and
    deleted from the source.
-   A "sortedSet" block observes a collection that emits range change
    events, by way of a property of each value described in the block,
    or itself if empty, emitting a `SortedSet` value exactly once.  If
    the input is or becomes invalid, the sorted set is cleared, not
    replaced.  The sorted set will always contain the last of each group
    of equivalant values from the input.
-   A "min" block observes the which of the values in a given collection
    produces the smallest value through the given relation.
-   A "max" block observes the which of the values in a given collection
    produces the largest value through the given relation.
-   A "group" block observes which values belong to corresponding
    equivalence classes as determined by the result of a given
    expression on each value.  The observer is responsible for adding
    and removing classes as they are populated and depopulated.  Each
    class tracks the key (result of the block expression for every
    member of a class), and an the values of the corresponding class as
    an array.  Values are added to the end of each array as they are
    discovered.
-   Any function call with a "block" implies calling the function on the
    result of a "map" block.
-   A "flatten" function call observes a source array and produces a
    target array.  The source array must only contain inner arrays.  The
    target array is emitted once and all subsequent updates can be
    independently observed with `addRangeChangeListener`.  The target
    array will always contain the concatenation of all of the source
    arrays.  Changes to the inner and outer source arrays are reflected
    with incremental splices to the target array in their corresponding
    positions.
-   A "concat" function call observes a source array and all of its
    argument arrays and effectively flattens all of these arrays.
-   A "reversed" function call observes the source array and produces a
    target array that contains the elements of the source array in
    reverse order.  The target is incrementally updated.
-   An "enumerate" expression observes [key, value] pairs from an array.
    The output array of arrays is incrementally updated with range
    changes from the source.
-   A "view" function call observes a sliding window from the source,
    from a start index (first argument) of a certain length (second
    argument).  The source can be any collection that dispatches range
    changes and the output will be an array of the given length.
-   A "sum" function call observes the numeric sum of the source array.
    Each alteration to the source array causes a new sum to be emitted,
    but the sum is computed incrementally by observing the smaller sums
    of the spliced values, added and removed.
-   An "average" function call observes the average of the input values,
    much like "sum".
-   A "last" function call observes the last of the input values, if
    there is one.  It does this by watching range changes that overlap
    the last entry of the collection and emitting the new last value
    when necessary, or undefined if the collection becomes empty.
-   An "only" function call observes the only value of the input values,
    if there is only one such value.  If there are none or more than
    one, the only function emits undefined.
-   A "one" function call observes one of the values from a collection,
    if there is one.  Otherwise it is undefined.  The collection is at
    liberty to determine whatever value it can most quickly and sensibly
    provide.
-   A "round" function call observes the nearest integer to the input
    value, rounding `0.5` toward infinity.
-   A "floor" function call observes the nearest integer to the input
    value toward -infinity;
-   A "ceil" function call observes the nearest integer to the input
    value toward infinity;
-   A "has" function call observes the source collection for whether it
    contains an observed value.
-   A "tuple" expression observes a source value and emits a single
    target array with elements corresponding to the respective
    expression in the tuple.  Each inner expression is evaluated with
    the same source value as the outer expression.
-   A "startsWith" function call observes whether the left string
    starts with the right string.
-   An "endsWith" function call observes whether the right string
    ends with the right string.
-   A "contains" function call observes whether the left string contains
    the right string.
-   A "join" function observes the left array joined by the right
    delimiter, or an empty string.   This is not an incremental
    operation.
-   A "split" function observes the left string broken into an array
    between the right delimiter, or an empty string.  This is not an
    incremental operation.
-   A "range" function call observes an array with the given length
    containing sequential numbers starting with zero.  The output array
    is updated incrementally and will dispatch one range change each
    time the size changes by any difference.
-   A "keys" function call observes an incrementally updated array of
    the keys that a given map contains.  The keys are maintained in
    insertion order.
-   A "values" function call observes an incrementally updated array of
    the values that a given map contains.  The values are maintained in
    insertion order.
-   An "entries" function call observes an incrementally updated array
    of [key, value] pairs from a given mapping.  The entries are
    retained in insertion order.

Unary operators:

-   "number" coerces the value to a number.
-   "neg" converts a number to its negative.
-   "not" converts a boolean  to its logical opposite, treating null or
    undefined as false.

Binary operators:

-   "add" adds the left to the right
-   "sub" subtracts the right from the left
-   "mul" multiples the left to the right
-   "div" divides the left by the right
-   "mod" produces the left modula the right.  This is proper modula,
    meaning a negative number that does not divide evenly into a
    positive number will produce the difference between that number and
    the next evenly divisible number in direction of negative infinity.
-   "rem" produces the remainder of dividing the left by the right.  If
    the left does not divide evenly into the right it will produce the
    difference between that number and the next evenly divisible number
    in the direction of zero.  That is to say, `rem` can produce
    negative numbers.
-   "pow" raises the left to the power of the right.
-   "root" produces the "righth" root of the left.
-   "log" produces the logarithm of the left on the right base.
-   "lt" less than, as determined with `Object.compare(left, right) <
    0`.
-   "le" less than or equal, as determined with `Object.compare(left,
    right) <= 0`.
-   "gt" greater than, as determined with `Object.compare(left, right) >
    0`.
-   "ge" greater than or equal, as determined with `Object.compare(left,
    right) >= 0`.
-   "compare" as determined by `Object.compare(left, right)`.
-   "equals" whether the left is equal to the right as determined by
    `Object.equals(left, right)`.
-   *Note: there is no "not equals" syntax node. The `!=` operator gets
    converted into a "not" node around an "equals" node.
-   "and" logical union, or short circuit on false
-   "or" logical intersection, or short circuit on true

Ternary operator:

-   "if" observes the condition (first argument, expression before the
    `?`).  If the expression is true, the result observes the consequent
    expression (second argument, between the question mark and the
    colon), and if it is false, the result observes the alternate (the
    third argument, after the colon).  If the condition is null or
    undefined, the result is null or undefined.

On the left hand side of a binding, the last term has alternate
semantics.  Binders receive a target as well as a source.

-   A "with" binding takes a "context" and "expression" argument from
    the target, and a "value" expression from the source.  If and when
    the context is or becomes defined, the binder creates a child scope
    with the context as its value and binds the expression in that scope
    to the source in its own.
-   A "parent" binding takes an "expression" argument from the target,
    and a "value" expression from the source.  If and when there is a
    parent scope, and if and when there is or becomes a value in that
    scope, the binder establishes a binding from the source expression
    to the target expression in the parent scope.
-   A "property" observes an object and a property name from the target,
    and a value from the source.  When any of these change, the binder
    upates the value for the property name of the object.
-   A "get" observes a collection and a key from the target, and a value
    from the source.  When any of these change, the binder updates the
    value for the key on the collection using `collection.set(key,
    value)`.  This is suitable for arrays and custom map
    [Collections][].
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
-   An "only" function call binder observes a boolean value from the
    source.  If the source value and target collection are both defined,
    the binder ensures that the source is the only value in the target
    collection.  The target collection may have the ranged collection
    interface (`has` and `swap`) or it may have the set collection
    interface (`has`, `clear`, and `add`), and the binder prefers the
    former if both are supported because it results in a single range
    change dispatch on the target collection.
-   An "if" binding observes the condition and binds the target either
    to the consequent or alternate.  If the condition is null or
    undefined, the target is not bound.
-   For an "everyBlock" binding, the first argument of the target
    expression is the "collection", the second argument is the "block"
    expression, and the source is the "guard".  If and when the guard is
    or becomes true, the binder maintains a child scope for every value
    in the collection and binds the "block" in that scope to be true.
    If the guard is or becomes false, all of these bindings are
    canceled.  When the "guard" is false, the every block produces no
    bindings, and when the "guard" becomes false, no state is modified.
-   For a "someBlock" binding, the first argument of the target
    expression is the "collection", the second argument is the "block"
    expression, and the source is the "guard".  If and when the guard is
    or becomes false, the binder maintains a child scope for every value
    in the collection and binds the "block" in that scope to be false.
    If the guard is or becomes true, all of these bindings are canceled.
    When the "guard" is true, the every block produces no bindings, and
    when the "guard" becomes true, no state is modified.
-   The "and" operator validates the logical expression by binding the
    operands.  If the source expression is true, both the left and right
    argument expressions are bound to true.  If the source expression is
    false, and the right operand is false, the binding does nothing.  If
    the source expression is false and the right operand is true, the
    left operand is bound to false.
    If the left value in the expression implements an and() method, it will
    be called with the right value as argument. Tested with criteria
    who have an or() and an and() method.
-   The "or" operator validates the logical expression by binding the
    operands.  If the source expression is false, both the left and
    right argument expressions are bout to false.  If the source
    expression is true, and the right operand is true, the binding does
    nothing.  If the source expression is true and the right operand is
    false, the left operand is bound to false.
    If the left value in the expression implements an or() method, it will
    be called with the right value as argument. Tested with criteria
    who have an or() and an and() method.
-   The "rangeContent" binding guarantees that the ranged content (as in
    subarrays) of the target will be bound to the content of the source,
    if both are defined, but will not replace the target collection.
    This is useful for ensuring that a property collection with
    important event listeners is never replaced if the bound source is
    replaced.  The source collection must implement range change
    dispatch, like Array, Set, List, and SortedSet.
-   The "mapContent" binding guarantees that the map content of the
    target will be bound to the content of the source, if both are
    defined, but will not replace the target map.  This is useful for
    ensuring that a map property with important event listeners is never
    replaced if the bound source is replaced.   The source collection
    must implement map change dispatch, like Map, Dict, and SortedMap.

### Language Interface

```javascript
var parse = require("core/frb/parse");
var compileObserver = require("core/frb/compile-observer");
var compileBinder = require("core/frb/compile-binder");
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

### Syntax Tree

The syntax tree is JSON serializable and has a "type" property.  Nodes
have the following types:

-   `value` corresponds to observing the source value
-   `parameters` corresponds to observing the parameters object
-   `literal` has a `value` property and observes that value
-   `element` has an `id` property and observes an element from the
    `parameters.document`, by way of `getElementById`.
-   `component` has a `label` property and observes a component from the
    `parameters.serialization`, by way of `getObjectForLabel`.  This
    feature support's [Montage][]’s serialization format.

All other node types have an "args" property that is an array of syntax
nodes (or an "args" object for `record`).

-   `property`: corresponds to observing a property named by the right
    argument of the left argument.
-   `get`: corresponds to observing the value for a key (second
    argument) in a collection (first argument).
-   `with`: corresponds to observing the right expression using the left
    expression as the source.
-   `parent`: corresponds to observing the given expression (only
    argument) in the parent scope.
-   `has`: corresponds to whether the key (second argument) exists
    within a collection (first argument)
-   `mapBlock`: the left is the input, the right is an expression to
    observe on each element of the input.
-   `filterBlock`: the left is the input, the right is an expression to
    determine whether the result is included in the output.
-   `someBlock`: the left is the input, the right is a criterion.
-   `everyBlock`: the left is the input, the right is a criterion.
-   `sortedBlock`: the left is the input, the right is a relation on
    each value of the input on which to compare to determine the order.
-   `sortedSetBlock`: differs only in semantics from `sortedBlock`.
-   `minBlock`: the left is the input, the right is a relation on each
    value of the input by which to compare the value to others.
-   `maxBlock`: the left is the input, the right is a relation on each
    value of the input by which to compare the value to others.
-   `groupBlock`: the left is the input, the right is an expression that
    provides the key for an equivalence class for each value in the
    input.  The output is an array of entries, `[key, class]`, with the
    shared key of every value in the equivalence class.
-   `groupMapBlock`: has the same input semantics as `groupBlock`, but
    the output is a `Map` instance instead of an array of entries.
-   `tuple`: has any number of arguments, each an expression to observe
    in terms of the source value.
-   `record`: as an args object. The keys are property names for the
    resulting object, and the values are the corresponding syntax nodes
    for the values.
-   `view`: the arguments are the input, the start position, and the
    length of the sliding window to view from the input.  The input may
    correspond to any ranged content collection, like an array or sorted
    set.
-   `rangeContent`: corresponds to the content of an ordered collection
    that can dispatch indexed range changes like an array or sorted set.
    This indicates to a binder that it should replace the content of the
    target instead of replacing the target property with the observed
    content of the source.  A range content node has no effect on the
    source.
-   `mapContent`: corresponds to the content of a map-like collection
    including arrays and all map [Collections][].  These collections
    dispatch map changes, which create, read, update, or delete
    key-to-value pairs.  This indicates to a binder to replace the
    content of the target map-like collection with the observed content
    of the source, instead of replacing the target collection.  A map
    change node on the source side just passes the collection forward
    without alteration.

For all operators, the "args" property are operands.  The node types for
unary operators are:

-   ```+```: `number`, arithmetic coercion
-   ```-```: `neg`, arithmetic negation
-   ```!```: `not`, logical negation

For all binary operators, the node types are:

-   ```**```: `pow`, exponential power
-   ```//```: `root`, of 2 square root, of 3 cube root, etc
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
-   ```<=>```: `compare`
-   ```==```: ``equals``, equality comparison and assignment
-   ```!=``` produces unary negation and equality comparison or
    assignment so does not have a corresponding node type.  The
    simplification makes it easier to rotate the syntax tree
    algebraically.
-   ```&&```, `and`, logical and
-   ```||```, `or`, logical or
-   ```??```, `default`

For the ternary operator:

-   ```?``` and ```:```: `if`, ternary conditional

For all function calls, the right hand side is a tuple of arguments.

-   `reversed()`
-   `enumerate()`
-   `flatten()`
-   `sum()`
-   `average()`
-   `last()`
-   `only()`
-   `one()`
-   `startsWith(other)`
-   `endsWith(other)`
-   `contains(other)`
-   `join(delimiter)`
-   `split(delimiter)`
-   `concat(...arrays)`
-   `range()`
-   `keysArray()`
-   `valuesArray()`
-   `entriesArray()`
-   `defined()`
-   `round()`
-   `floor()`
-   `ceil()`

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
-   `makeParentObserver(observeExpression)`
-   *etc*

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

This documentation of the internal observer and binder functions is not
exhaustive.

[Collections]: https://github.com/montagejs/collections
[Define Property]: http://kangax.github.com/es5-compat-table/#define-property-webkit-note
[Montage]: https://github.com/montagejs/montage
[Mr]: https://github.com/montagejs/mr
[Mutation Observers]: https://developer.mozilla.org/en-US/docs/DOM/DOM_Mutation_Observers
[Node.js]: http://nodejs.org/
