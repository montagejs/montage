`module` API
============

The `module` object is available within each module and passed to loader and
compiler middleware for decoration. The `module` from other
modules can be obtained by calling `require.getModuleDescriptor(id)`.

The module object has the following properties:

-   **id**: the identifier of the module within its containing package
-   **exports**: the interface of the module, if it has been instantiated
-   **location**: the URL from which the module is or will be loaded. Equivalent to `__filename` in Node.
-   **directory**: the directory URL, including trailing slash, containing
    the module. Equivalent to `__dirname` in Node.
-   **display**: the location and id of a module separated by an
    hash (#), for display purposes
-   **require**: the package containing the module
-   **text**: the text of the module, only available in development.  After
    optimization, a module is declared with its `factory` as a
    JavaScript function and has no corresponding `text`.  The `text` is
    useful for compiler middleware.
-   **factory**: a function that, when called with the arguments
    `require`, `exports`, and `module`, either populates `exports`,
    reassigns `module.exports`, or returns `exports` to instantiate the
    module.
-   **dependencies**: an array of module identifiers of modules that
    must be loaded before calling the factory, produced by
    `parseDependencies`.
-   **extraDependencies**: an array of additional module identifiers for
    modules that must be loaded before calling the factory that may be
    specified through other means than `parseDependencies`.
-   **dependees**: an object with a key for every module that declares
    this module as a dependency, populated automatically by `deepLoad`.
-   **redirect**: the identifier of a module that stands in for this
    module, so `require` returns its exports instead.  A redirect is an
    implied dependency.  Redirect cycles should be avoided.
-   **mappingRedirect**: the identifier of a module in another package
    that provides this module, so `require` returns its exports instead.
-   **mappingRequire**: the `require` function of the package that
    provides this module.
-   **injected**: whether this module's exports were injected by
    `require.inject(id, exports)`.


## returnable exports

A module can return an exports object.

**add.js**

```javascript

return function (a, b) {
    return a + b;
}
```

**the-answer.js**

```javascript
// the exports of add is the returned function
var add = require("add");

module.exports = add(29, 13);
```

Note: This would make the module incompatible with NodeJS, where the idiom
`module.exports =` prevails.
