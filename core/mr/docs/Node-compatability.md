Node and npm compatibility
==========================

Montage fully supports CommonJS Modules and Packages.  It also supports
some of the extensions from NodeJS and npm:

- **module.exports**: Modules that do not have cyclic dependencies
  (modules with dependencies that in turn ultimately depend their own
  exports) can redefine their exports object by assigning to
  `module.exports`.
- **dependencies**: If a package declares a package dependency using
  NPM’s `dependencies` property, Montage looks for that package in
  the package’s `node_modules` subdirectory.  Mr also
  supports the case where a package with the same name is already
  loaded by a parent package.  Unlike NPM, with Montage packages, you
  can use mappings to find individual packages in alternate locations or
  give them different local names.
- **devDependencies**: Development dependencies are treated the same as
  `dependencies`, except in production mode where they are ignored.
- **JSON**: Resources with the `.json` extension can be loaded as JSON
  formatted modules.


## Differences

There are some differences with the Node.js module system you should be aware
of:

- `dependencies` version predicates are ignored.

//1/21/2020 the following is fixed, `__filename` and `__dirname` are now injected
    - `__filename` and `__dirname` are not injected into module scope. Consider
    using `module.location` and `module.directory` instead.


- Because Mr cannot know if a URL points to a file or a directory, when you
  require a directory `index.js` is not sought. To make a package using an
  `index.js` compatible with Montage Require, add a `redirects` block to
  `package.json`. See the [package API](./Package-API.md)

In addition to these differences Mr adds some additional properties to
[package.json](./Package-API.md), [module](./Module-API.md) and
[require](./Require-API.md).
