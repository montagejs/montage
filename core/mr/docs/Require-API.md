`require` API
=============

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
