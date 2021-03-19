
# v4.0.3 
- Update to collections ^5.1.3

# v4.0.2
- Update to collections ^5.1.2

# v4.0.1
-   Fixes a missing Map require needede for IE10/11

# v4.0.0
-   Performance improvements
-   backward incompatible update that makes getBindings return a Map instead of an object


# v3.0.1

-   Performance improvements reducing closure lookup and caching constants

# v3.0.0

-   Performance improvements from removing forEach, leveraging Collection 5 usr of native Map/Set when available
-   Updates to run with Collections 5.x

# v0.2.19

-   Small bug fix in cancelling non replacing array observers

# v0.2.18

-   Allow white space in more positions in FRB expressions, particularly within
    and around records.
-   Fixes the cases for null, undefined, and NaN on string operators,
    particularly startsWith and endsWith which would previously throw an
    exception.
-   Various speculative performance related changes, particularly unrolling
    swap loops, using undefined instead of noop for default cancelers,
    eliminating most uses of `autoCancelPrevious` and all uses of `once`.
-   Memoize parse results and require that they be treated as immutable.
    This is a break from previous versions because MontageJS previously
    modified the syntax tree for reserializing expressions with different
    component names.
-   Update Collections to v2.1.1, mostly for speculative performance related
    changes.
-   Fix the `has` operator for map collections.
-   Support for contenteditable in the DOM shim (@cesine)

# v0.2.17

-   Fix evaluator for ternary conditional operator to match the behavior of the
    observer. A null input should result in a null output, not be interpreted as
    false and result in the alternate.
-   Makes two way range content bindings propagate propertly in both directions.

# v0.2.16

-   Add support for `one()` bindings.
-   Add support for `min()` and `max()` observers (in addition to the
    already-supported `min{}` and `max{}` blocks).
-   Fixes `view(start, length)` observers.
-   Fixes range change listeners with beforeChange and handlerToken
    arguments.

# v0.2.15

-   Collections 0.2.1, fixes a bug that impacts FRB on Chrome 30 and
    all future browsers that implement ES6 methods on arrays.

# v0.2.14

-   Adds support for binding to the `only` operator with sets.
-   Implements binder for parent scope operator
-   Adds support for polymorphic scope nesting.
-   Fixes two bugs in `filter`.
-   Restricts the domain of property change observers to numbers and
    strings, ignoring all else.
-   Collections 0.2.0

# v0.2.13

-   Makes traced binding messages appear less like errors by stripping
    the first line.
-   Makes `sum` and `average` observers more resilient against
    transient, invalid input.

# v0.2.12

-   Adds `only` binder and observer.
-   Adds `sortedSet` observer.
-   Adds `join` observer.
-   Makes `join` and `split` algebraic inversions which qualifies these
    operators for binders in addition to observers.

# v0.2.11

-   Adds the ability to bind to conditionally bind to `null`, to disable
    a binding, e.g., `unstopableForce <-> never ? imovableObject :
    null`.
-   Adds support to bind to `defined()`, e.g., `value.defined() <-
    defined`, which will bind `value` to `undefined` when `defined`
    is `false`.  Takes no action when `defined` becomes `true`.
-   Short circuit `has(value)` observers if `value` is null.
-   Soort circuit `object.toMap()` if `object` is null or not an object.

# v0.2.10

-   Uprev `collections`
-   Increase fault-tolerance of map change observers

# v0.2.9

-   Tighten the precedence of the `^` (parent scope) operator.  This
    operator was on the same level as other unary operators, `+`, `-`,
    and `!`, but now couples even more tightly.  Thus `^foo.bar()` was
    equivalent to `^(foo.bar())` but is now equivalent to
    `(^foo).bar()`.
-   Adds the `last` operator, for observing the last value in a
    collection without jitter.
-   Finishes the `toMap` operator, which can now coerce and
    incrementally update maps, fixed-shape objects (known as records),
    and arrays (or other indexed collections) of entries (key value
    pairs in duple arrays).
-   Throw no errors.  It is now clear that FRB should not throw errors
    if it encounteres invalid input.  It must propagate null instead.
    This is because FRB inputs do not necessarily change atomically.
    The result is that state must be made consistent by the end of a
    turn (not enforced), but may pass through invalid states internally.
    As such, throwing an exception would interfere.
-   Deprecates `items` in favor of `entries` and makes the terminology
    consistent throughout interfaces and documentation.
-   Deprecates `asArray` in favor of `toArray`, in keeping with
    precedent established in v0.2.7.
-   Alters the `toString` operator such that only numbers and strings
    can be coerced.  All other types propagate `null`.  This is intended
    to simply the creation of `toString` operators for cross-language
    bindings by not entraining JavaScript's string coercion semantics.

# v0.2.8

-   In keeping with the new `&&` and `||` bindings, implement binder and
    assigner for the default operator, `??`.  The binding will apply the
    source to the left side of the operator.

# v0.2.7

-   Implement logic bindings and assignment.  `&&` and `||` can now
    meaningfully appear on the left side of a binding, or on either side
    of a two-way binding.  The binding preserves the expressed predicate
    by setting either the left side, right side, or both sides to `true`
    or `false`.  If setting the left side of the operator is sufficient
    to meet the predicate, only that side will be affected.  This makes
    it possible to contrive bindings that account for check boxes that
    should be unchecked when they are disabled.
-   Changed `asString` and `asNumber` to `toString` and `toNumber`.  The
    convention hereafter is to use method names consistent with
    precedent in JavaScript, even in the case of `to` methods which do
    not look right on the target side of a binding.  Since FRB delegates
    to JavaScript methods as a fallback, the ship has sailed.
-   Makes `flatten` fault-tolerant if any input array is null or
    undefined.

# v0.2.6

-   Fixes `filter` blocks.  The optimization applied in v0.2.4 was
    inccorrect.  The fix prevents the regression and produces the
    originally intended optimization.
-   Reintroduces the shortest-possible-transform algorithm and all
    charges of bugs have been dropped.

# v0.2.5

-   Adds a `concat` operator.
-   Removes the shortest-possible-transform algorithm on suspicion of
    bugs.

# v0.2.4

-   Adds support for `reverters`, which are the same interface as
    converters, but the `convert` and `revert` terminals are switched.
    This is useful for hooking up a converter against the direction of
    the binding arrow.
-   Fixes `stringify` when `this` is passed as an argument to a
    function.  Previously, the argument would be lost.
-   Reduces the jitter on the output `filter` blocks.  This change
    was later found to introduce bugs that were fixed in v0.2.6.
-   All observers that produce arrays will now apply the shortest
    possible sequence of splices to update the output array.  This
    feature was removed in v0.2.5, and reintroduced in v0.2.6.
-   Improves the debugging experience by providing meaningful names for
    all observer and binder functions.

# v0.2.3

-   Partially fixes two-way range content bindings.
    -   Content changes and right to left assignment propagate both
        ways.
    -   Propagation from left to right on assignment is still unsolved.
-   Guarantees that rangeContent() bindings will produce a non-replacing
    array both from observers and binders.
-   Produces better function names in traces.

# v0.2.2

`stringify` can now accept a scope argument, which it will use for the
sole purpose of expanding component labels.

# v0.2.1

Replace the FRB parser with a PEGJS implementation.  This extends the
grammar for numbers and string literals (double-quotes are allowed)
but removes support for certain hacks like using `.` for an empty
expression.

TODO commit 1a3a896464c501f851d1764d219c25bb2e989ab5

# v0.2.0

This release refactors most of the internals and some of the interface
to introduce a parent scope operator, `^`.  As such, bindings now have a
scope chain and the parameters, document object model, component object
model, and options are carried by the scope object.

The signature of assign has been extended:
assign(target, targetPath, value, parameters)
to
assign(target, targetPath, value, parameters, document, component)

## Backward-incompatible changes

### bindings

The document and component object models are no longer communicated to
bindings through the `document` and `serialization` parameters.

`Bindings.defineBinding(object, name, descriptor, parameters)` has
changed to `Bindings.defineBinding(object, name, descriptor,
commonDescriptor)` where commonDescriptor is `{parameters, document,
components}`

In a *future* release, the default parameters will be undefined.  The
default parameters are presently the source object which has allowed
us to work-around the lack of a parent scope operator.  Please migrate
your code from using `$` (parameters) to `^` (parent scope).  You can
verify that your bindings will continue to work in the future by passing
an empty object `{}` as the parameters explicitly.

### evaluate

The signature of evaluate functions as returned by compileEvaluator have
changed from `evaluate(value, parameters)` to `evaluate(scope)` such
that `evaluate(new Scope(value, null, parameters))` is equivalent to the
former rendition.

### assign

The signature of assign functions as returned from compileAssigner have
changed from `assign(value, target, parameters)` to `assign(value,
scope)` such that `assign(value, new Scope(target, null, parameters)` is
equivalent to the former rendition.

### expand

The signature of the `expand` function has changed to `expand(syntax,
scope)`, where `scope` is an object with optional `value`, `parameters`
and `components` properties.  The value and parameters must be syntax
nodes to replace value and parameters nodes in place.  The `components`
property must be an object with `getObjectLabel(component)` to get the
label for a component, in case the label differs from the one on the
syntax tree.

### observeGet

`Observers.observeGet` now delegates to `observeGet` method instead of
`observeKey`.
