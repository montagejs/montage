
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

