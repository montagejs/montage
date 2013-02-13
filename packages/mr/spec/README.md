
# CommonJS Modules

## top-level

Verifies that top-level identifiers refer to modules at the top level
of a package, even when used from a child level.

## relative

Verifies that relative module identifiers find neighboring modules in
the module identifier space.

## cyclic

Verifies that modules can have cyclic references.

## determinism

Verifies that the module loader does not fall back to using relative
module identifiers when a top-level module identifier doesn't exist.

## exactExports

Verifies that the exports object within a module matches the exports
object returned by require.  Alternate designs were proposed where the
exports as returned by require would be a "defensive" snapshot,
preventing lazy definition.

## hasOwnProperty

Verifies that "hasOwnProperty" is a valid module identifier,
indicating that the implementation considers this special case if
using objects as maps.

## method

Verifies that the functions exported by a module are not implicitly
bound to an object, albeit the exports or the module object.

## nested

Verifies that a module burried in a directory tree can be required.

## transitive

Verifies that an exported object can be imported and exported from
module to module.


# CommonJS Modules Amendments

## monkeys

Verifies that modules can be modified by other modules.

## return

Verifies that a module can replace its exports by returning a defined
value.

## module-exports

Verifies that a module can replace its exports by assigning directly to
`module.exports`.

## missing

Verifies that a module will be executed even if it fails to load.  The
execution will throw an error.

## not-found

Verifies that a module will be executed even if it fails to load.  The
execution will throw an error with a specific message.  This test
overlaps with `missing` and might be consolidated.

## comments

Verifies that a module will be executed even if it has a spurious
dependency mentioned in a comment.  The commented dependency may fail to
load but will not prevent the dependee from executing.

## case-sensitive

Verifies that this system does case consistency checks.  A module may
only be loaded with one case convention, as a slight integrity check to
verify that it can be hosted on a case-insensitive file system.  It
would be better to do integrity checks verifying that module identifiers
are always lower-case (per the specification), but this is too strict in
practice.

## reexecute

This test is not included in the suite because it is a non-normative
behavior.  Illustrates that the current implementation has an edge case
whereby a module can cause itself to be reexecuted for every user.


# CommonJS Packages

## named-packages

Verifies that named dependencies can be shared if they have a common
ancestor.

## named-mappings

Verifies that named mappings can be shared if they have a common
ancestor.

## load-package

Verifies that packages can be loaded asynchronously based on their
location relative to the requesting package.

As a byproduct, verifies that require.loadPackage and require.async
return functioning promises.

As a byproduct, also verifies that module exports reassignment works
properly.

## load-package-name

Verifies that packages can be loaded asynchronously based on their
name, in the context of the requesting package.

## named-parent-package

Verifies that a dependee package can use the dependent package by its
name.

## dev-dependencies

Verifies that modules linked in `devDependencies` of `package.json` can
be loaded.

## production

Verifies that when `package.json` has `production` set, modules linked in
`devDependencies` are not loaded.

## identify

Verifies that `require.identify(id, require2)` can reverse-lookup the
identifier for a module in another package, by its id as known in the
other package.

## redirects

Verifies that a package can describe redirects from one module
identifier to an alternative.

## redirects-package

Verifies that a package can describe redirects from one module
identifier to an alternative in a dependency package.

