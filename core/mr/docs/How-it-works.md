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
