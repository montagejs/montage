
Montage Require
===============

This is a CommonJS module system, highly compatible with NodeJS,
intended for front-end development of web applications using NPM style
packages.  It is designed to be automatically replaced by the Montage
Optimizer with a smaller, faster, and bundled production module system.

To use, install the module system in your application package with NPM.

```
npm install mr
```

Then, incorporate the Montage Require bootstrapping script in an HTML
document.

```html
<script
    src="node_modules/mr/bootstrap.js"
    data-module="index"
></script>
```

```html
<script
    src="node_modules/mr/bootstrap.js"
    data-auto-package
    data-module="index"
></script>
```

```html
<script
    src="node_modules/mr/bootstrap.js"
    data-package="."
    data-module="index"
></script>
```

-   `data-auto-package` indicates that there is no `package.json` for
    this application, and instructs Montage Require to pretend that an
    empty one exists in the same directory as the HTML document.
-   `data-package` alternately, indicates that there is a `package.json`
    and that it can be found at the given location.  The default
    location is the same directory as the HTML file.
-   `data-module` instructs Montage Require to `require` the given
    module after it has finished bootstrapping and the DOM content
    has loaded.


Node and NPM Compatibility
==========================

Montage fully supports CommonJS Modules and Packages.  It also supports
some of the extensions from NodeJS and NPM.

-   **module.exports**: Modules that do not have cyclic dependencies
    (modules with dependencies that in turn ultimately depend their own
    exports) can redefine their exports object by assigning to
    ``module.exports``.
-   **dependencies**: If a package declares a package dependency using
    NPM’s ``dependencies`` property, Montage looks for that package in
    the package’s ``node_modules`` subdirectory.  Montage Require also
    supports the case where a package with the same name is already
    loaded by a parent package.  Unlike NPM, with Montage packages, you
    can override the location of the ``node_modules`` directory with the
    ``directories.packages`` property, or use mappings to find
    individual packages in alternate locations or give them different
    local names.
-   **devDependencies**: Development dependencies are treated the same as
    `dependencies`, except in production mode where they are ignored.
-   **JSON**: Resources with the `.json` extension can be loaded as JSON
    formatted modules.

Extensions:

-   **redirects**: a `redirects` block in `package.json` a module
    identifier to redirect to an alternate module identifier.
-   **returnable exports**:  A module can return an exports object.  This
    would make that module incompatible with NodeJS, where the idiom
    `module.exports =` prevails.
-   **mappings**: Packages can declare some or all of their package
    dependencies with the URL ``location`` of the package, particularly
    a URL relative to the depending package.  Mappings override
    dependencies if there are conflicts.
-   **production**: when set to `true` in the `package.json` it puts the
    system into production mode. Currently this only ignores any
    `devDependencies`.
-   **require.packageDescription**: Packages expose the parsed
    contents of the ``package.json`` file.
-   **module.location**: Packages expose the URL of the corresponding
    source.
-   **module.directory**: Packages expose the URL of the directory
    containing the corresponding source.

Not supported:

-   `dependencies` version predicates are ignored.
-   `__filename` and `__dirname` are not injected into module scope.
    Consider using `module.location` and `module.directory` URLs
    instead.
-   `index.js` is not sought if you require a directory.  To make a
    package using an `index.js` compatible with Montage Require, add a
    `redirects` block to `package.json` like `{"redirects": {"foo":
    "foo/index"}}`.

The Montage modules debug-mode run-time loads modules asynchronously and
calculates their transitive dependencies heuristically&mdash;by
statically scanning for ``require`` calls using a simple regular
expression.  Montage can load cross-origin scripts in debug-mode if the
CORS headers are set on the remote server.

Take a look at the Montage Optimizer to optimize applications for
production.  The optimizer can bundle packages with all of the dependent
modules, can preload bundles of progressive enhancements in phases, and
can generate HTML5 application cache manifests.


Optimizer Script Attributes
===========================

The Montage Optimizer, `mop`, does not yet handle stand-alone Montage
Require.  However, when it does, the optimizer can convert entire
packages to production ready versions without manual alteration.  The
optimizer rewrites HTML, particularly replacing the bootstrapping script
with a bundle.  As such, the run-time supports some additional options.

-   `data-bootstrap` indicates that this script element is the
    `bootstrap.js` script and denotes the location of that script.
    This is normally inferred from being a script with a `bootstrap.js`
    file name, but an optimizer might replace the `<script>` tag with a
    bundle with a different name.

The optimizer can convert all resources into script-injection form, by
changing `.js` modules to `.load.js` scripts with `define(hash, id,
descriptor)` boilerplate.  This permits packages to be loaded
cross-origin and with content security policies that forbid `eval`.  The
hash is a consistent hash for each package.  The bootstrapper needs to
know these hashes so it can recognize incoming `package.json.load.js`
definitions.

-   `data-bootstrap-hash`
-   `data-application-hash`
-   `data-q-hash`

Among other things, the optimizer is also responsible for processing
`package.json` files to include the `hash` of each `dependency`.


Cross-browser Compatibility
===========================

At present, Montage Require depends on `document.querySelector` and
probably several other recent EcmaScript methods that might not be
available in legacy browsers.  With your help, I intend to isolate and
fix these bugs.

At time of writing, tests pass in Chrome 21, Safari 5.1.5, and Firefox
13 on Mac OS 10.6.


How It Works
============

In broad strokes, Montage Require uses so-called "XML" HTTP requests to
fetch modules, then uses a regular expression to scan for `require`
calls within each JavaScript module, then executes the module with some
variation of `eval`.  Then, with the Montage Optimizer, `mop`, Montage
Require can also serve as the runtime for loading modules with bundled
script-injection with no alteration to the source code of an
application.  With script-injection, XHR and `eval` are not necessary,
so applications are suitable for production, cross-domain, and with
content security policies (CSP) that forbid `eval`.

In slightly thinner strokes, Montage Require has an asynchronous phase
and a synchronous phase.  In the asynchronous "loading" phase, Montage
Require fetches every module that it will need in the synchronous phase.
It then passes into the synchronous "execution" phase, where `require`
calls actually occur.  The asynchronous portion includes
`require.async`, `require.load`, and `require.deepLoad`, which return
[Q][] promises.  The synchronous phase employs `require` calls directly
to transitively instantiate modules on demand.  The system must be
kicked off with `require.async` since no modules are loaded initially.

[Q]: http://github.com/kriskowal/q

Some alternatives to Montage Require use a full JavaScript parser to
cull the false positives you will occasionally see when using regular
expressions to scan for static `require` calls.  This is a trade-off
between weight and accuracy.  Montage Require does not block execution
when it is unable to load these false-positive modules, but instead
continues to the execution to "wait and see" whether the module can run
to completion without the module that failed to load.  Also, Montage
Require can be configured to use an alternate dependency parser.

Around this system, Montage Require supports packages.  This entails
asynchronously loading and parsing `package.json` files, then
configuring and connecting the module systems of each package in the
"load" phase.  Package dependencies are loaded on demand.

Each package has an isolated module identifier name space.  The
`package.json` dictates how that name space forwards to other packages
through the `dependencies` property, as well as internal aliases from
the package's `name`, `main`, and `redirects` properties.

Additionally, Montage Require is very configurable and pluggable.
Montage itself vastly extends the capabilities of Montage Require so
that it can load HTML templates.  Montage's internal configuration
includes middleware stacks for loading and compiling.  The loader
middleware stack can be overridden with `config.makeLoader` or
`config.load`.  The compiler middleware can be overridden with
`config.makeCompiler` or `config.compile`.  The makers are called to
create loaders or compilers *per package*, each receiving the
configuration for their particular package.

The signature of loader middleware is `makeLoader(config, nextLoader)`
which must return a function of the form `load(id, module)`.  The
signature of compiler middleware if `makeCompiler(config, nextCompiler)`
which must return a function of the form `compile(module)`.

As part of the bootstrapping process, configuration begins with a call
to `Require.loadPackage(dependency, config)` that returns a promise for
the `require` function of the package.

`config` is an optional base configuration that can contain alternate
`makeLoader`, `makeCompiler`, and `parseDependencies` functions.
Montage Require then takes ownership of the `config` object and uses it
to store information shared by all packages like the registries of known
packages by name and location, and memoized promises for each package
while they load.

`dependency` declares the location of the package, and can also inform
the module system of the consistent `hash` of the package.  Dependency
can be a `location` string for short, but gets internally normalized to
an object with a `location` property.  The `hash` is only necessary for
optimized packages since they use script-injection.  The injected
scripts call `define` for each module, identifying the module by the
containing package `hash` and module `id`.

The `require` function for any package has a similar `loadPackage`
function that can take a dependency argument.  That dependency may have
a `name` instead of `location`.  In that case, Montage Require infers
the location based on the known locations of packages with that name, or
assumes the package exists within the `node_modules` directory of the
dependent package.  This is a relatively safe assumption if the
application was installed with NPM.

Montage Require also supports a form of dependency injection.  These
features were implemented because `bootstrap.js` (and in Montage proper,
`montage.js`) would need to load and instantiate certain resources
before being able to instantiate a module system.  To avoid reloading
these already-instantiated resources, the bootstrapper would inject them
into the packages before handing control over to the application.

`require.inject(id, exports)` adds the exports for a given module to a
package.

`require.injectPackageDescription(location, description)` allows the
module system to read the content of a `package.json` for the package at
`location` without fetching the corresponding file.

`require.injectPackageDescriptionLocation(location,
descriptionLocation)` instructs the module system to look in an
alternate location for the `package.json` for a particular package.


Interface
=========

## require

A `require` function stands for a package. Specialized `require`
functions exist within each module.  Calling `require` from outside a
module will return the exports of the module with the given top-level
identifier.  Calling `require` within a module will resolve the given
identifier relative to the current module and return the exports of the
corresponding module.  `require` will throw an exception if a needed
module has not yet been loaded.

-   **async(id)**: returns a promise for the exports of the module with
    the given identifier.
-   **location**: the URL of the package, including the trailing slash
    for the directory.
-   **resolve(id)**: returns the top-level identifier for a module,
    relative to the current module.
-   **load(id)**: returns a memoized promise for the loading of the
    corresponding module.
-   **deepLoad(id)**: returns a memoized promise that the module and its
    transitive dependencies have all loaded.
-   **identify(id, require)**: a module may have a different identifier
    in another package.  This returns the identifier for a module in a
    subpackage.
-   **getModuleDescriptor(id)**: returns a memoized `module` object
    describing the module in this package for the given identifier.  If
    one does not exist, it creates one with `id`, `display`, and
    `require` properties to get things started.
-   **loadPackage(dependency)**: returns a promise for a `require`
    function representing the given package.  The `dependency` may be by
    `name`, `location`, or both.  If by `name` without `location`, the
    `location` is inferred from the registry of known packages, or from
    the `node_modules` directory within this package.  If by `name` and
    `location`, the location is added to the registry of known package
    names.
-   **getPackage(dependency)**: returns the `require` function for an
    already loaded package, or throws an error.
-   **inject(id, exports)**: adds a module for a given identifier with
    the given exports, and sets its `module.injected` to true.  This
    prevents the module system from attempting to load the module.
-   **injectMapping(mapping, prefix)**: Adds a mapping-style dependency
    to a package.  The mapping object describes the dependent package in
    the same fashion as the value from the `mappings` property of a
    package.json.  If the mapping does not provide a module name-space
    prefix, you can provide one as the second argument.
-   **injectDependency(name, version)**: Adds an NPM-style dependency to
    a package.  The name and version should be as in an NPM `dependency`
    property in a `package.json`.  The version is presently ignored but
    may in the future detect incompatibilities with another package
    installed with the same name.  Mr will not support multiple versions
    of the same package.
-   **injectPackageDescription(location, description)**: informs the
    module system of the parsed contents of the `package.json` for the
    package at the given location.  This may be a lie.  This prevents
    the module system from attempting to load the `package.json`.  The
    corresponding `package.json` need not actually exist.
-   **injectPackageDescriptionLocation(location, descriptionLocation)**:
    informs the module system of an alternate URL from which to download
    the `package.json` for this package.
-   **read(location)**: an exposed internal utility for reading the
    contents of a resource at a given URL.  Returns a promise for the
    corresponding text.
-   **config**: the configuration object for this package.  The `config`
    provided by the module system to each package prototypically
    inherits from the `config` given to the initial
    `Require.loadPackage` and contains additional properties obtained by
    analyzing `package.json`.  Many but not all of these properties have
    the same name and shape as those in `package.json`.
-   **packageDescription**: the original parsed contents of the
    `package.json`, or that object delegated by
    `injectPackageDescription`.

## module

The `module` object is available within a module, returned by
`require.getModuleDescriptor(id)`, and passed to loader and compiler
middleware for decoration.

-   **id**: the identifier of the module within its containing package
-   **exports**: the interface of the module, if it has been instantiated
-   **location**: the URL from which the module is or will be loaded
-   **directory**: the directory URL, including trailing slash, containing
    the module
-   **display**: the location and id of a module separated by an
    octothorpe, for display purposes
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

## config

`Require.loadPackage` accepts the following configuration options for
all packages in a fresh module system.

-   **makeLoader**: the module loader maker, which by default depends on
    whether the loader is running on a browser or on Node.  On the
    browser, it is a stack of `Require.MappingsLoader`,
    `Require.ExtensionsLoader`, `Require.PathsLoader`,
    `Require.MemoizedLoader`, then either `Require.ScriptLoader` or
    `Require.XhrLoader` depending on `config.define` for the config of
    the particular package.
-   **makeCompiler**: the compiler maker for each package, which by
    default is a stack of the `Require.JsonCompiler`,
    `Require.ShebangCompiler`, `Require.DependenciesCompiler`, and
    `LintCompiler` middleware.
-   **lint**: an optional event handler that accepts a `module` if its
    `text` is invalid JavaScript.  There is no default value.  `lint` is
    used by `Require.LintCompiler` middleware.
-   **read**: an optional resource reader, a function that must accept a
    fully qualified URL and return a promise for the content of that
    resource as a string.  The default reader depends on whether Montage
    Require is running in a browser or on Node.

Montage Require then adds shared state for all packages to the `config`.

-   **registry**: the location of each known package by name, for those
    packages that have either designated their own name, or been named
    by a dependent package in the `dependencies` or `mappings`
    properties of their package description.
-   **getPackage**: returns the `require` function for a package that
    has already been loaded, or throws an error.
-   **loadPackage**: returns a memoized promise for the description of a
    package at a given location.
-   **descriptions**: promises for each package description that is
    loading or has been loaded, by location.
-   **descriptionLocations**: an object mapping package locations to the
    locations of their package descriptions if an alternate is injected
    with `require.injectPackageDescriptionLocation`.

Then, for each package, Montage Require creates a `config` that
prototypically inherits from the master `config` and expands on that
configuration with details synthesized from the content of the package
description, `package.json`.  This is the config that gets passed to
`Require.makeRequire(config)`.

-   **location**: the package's location directory, including a trailing
    slash.
-   **name**: the name of this package, if it has one.
-   **packageDescription**: the original package description, either
    parsed from a `package.json` or injected by
    `require.injectPackageDescription`.
-   **define**: true if this package uses script injection to load
    resources.
-   **modules**: object mapping module descriptions by identifier
-   **lib**: the root directory location where modules can be found, by
    default the same as `location`.
-   **paths**: a prioritized array of directories in which to search for
    modules for this package, by default just the `lib` directory.  It
    is inadvisable to give this array multiple entries on the
    client-side, and thus inadvisable for packages that might be used
    both client and server side.  Really, just don't use this.  It is
    used only by `PathsLoaders` middleware to convert module identifiers
    to locations.
-   **mappings**: object mapping module identifier prefixes to
    dependencies.  These dependencies are suitable for passing to
    `require.loadPackage`.
-   **packagesDirectory**: the location in which to look for unknown
    packages by name, by default `node_modules` within this package.
-   **exposedConfigs**: an array of `config` properties instructing
    `makeRequire` to copy those properties from `config` to each
    `require` function, by default `paths`, `mappings`, `location`,
    `packageDescription`, `packages`, and `modules`.

Within `Require.makeRequire(config)`, Montage Require uses `makeLoader`
and `makeConfig` with its own `config` to produce `config.load` and
`config.compile` properties.  The `config.load` in particular is
distinct and used internally by `require.load`, which memoizes and
compiles modules.

## package.json (package description)

Montage Require configures each package based on the contents of
`package.json`, the package description, and the shared configuration.
These properties are meaningful to Montage Require.

-   **name**: the name of the package, which may be used to connect
    common dependencies of the same name in subpackages.
-   **dependencies**: an object mapping a string that represents both a
    module identifier prefix and a package name, to an ignored version
    predicate.
-   **mappings**: an object that maps a module identifier prefix to a
    dependency.  The dependency may be a location string, or an object
    with `location`, `name`, or `hash` properties.  The location may be
    inferred from dependencies of already discovered packages, or from
    the location of the dependent package and the name.  The `hash` is
    generated by an optimizer and only used for loading modules with
    script injection.
-   **overlay**: an object defining alternate configurations depending
    on the platform.  Keys correspond to engines and values are
    alternate properties to overwrite on the package description.  For
    the browser, the `window`, `browser`, and `montage` engines are
    applied.  This property is likely to be deprecated and replaced by
    an `if` block or other content-negotiation blocks in the future.
-   **directories**: an object containing optional `lib` and `packages`
    directory overrides.  The `lib` directory is a location relative to
    this package at which to find modules.  The `packages` directory is
    a location relative to this package in which to find unknown
    packages by name.
-   **main**: the module identifier of the module that represents this
    package when required in other packages by the mapping module
    identier, or in this package by its own name.


Maintenance
===========

Tests are in the `spec` directory.  All of the CommonJS module tests
exist in there as well as tests for packaging and extensions.

Open `spec/run.html` in a browser to verify the specs.

This implementation is a part from Motorola Mobility’s [Montage][] web
application framework.  The module system was  written by Tom Robinson
and Kris Kowal.  Motorola holds the copyright on much of the original
content, and provided it as open source under the permissive BSD
3-Clause license.  This project is maintained by Kris Kowal, continuing
with that license.

[Montage]: http://github.com/montage.js/montage

