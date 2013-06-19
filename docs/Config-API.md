Package `config` API
====================

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

Mr then adds shared state for all packages to the `config`.

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

Then, for each package, Mr creates a `config` that
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

Within `Require.makeRequire(config)`, Mr uses `makeLoader`
and `makeConfig` with its own `config` to produce `config.load` and
`config.compile` properties.  The `config.load` in particular is
distinct and used internally by `require.load`, which memoizes and
compiles modules.
