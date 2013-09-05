### 0.13.4

 - Update Q from v0.9.6 to v0.9.7
 - Fix loading of bundles
 - Wait for preload to finish before issuing requests for modules that might
   be included in one of the bundles

### 0.13.3

 - Use `config.read` when running on Node

### 0.13.2

 - Use `config.read` to load `package.json` if given to `loadPackage`

### 0.13.1

 - Fix `require.identify` to work with cyclic package dependencies

## 0.13.0

 - Fix bootstrap stopping if document had finished loading.
 - Update to Q v0.9.6
 - Add more complete demo and split the readme into multiple documentation
   files.

### 0.12.14

 - Fix bug when loading dependencies that use script-injection which are not
   included in a preloading bundle. Before Mr would hang when waiting for them
   to load.

### 0.12.13

 - Fix bug in preloading, where isResolved was replaced with isPending in Q 0.9

### 0.12.12

 - Fix preloading. Fixes some logic in figuring out whether to issue a script
   request for a package.json in production
 - Test runner updates

### 0.12.11

 - Add injectDependency and injectMapping
 - Update case sensitivity test to capture errors on first require, for case
   sensitive file systems
 - Add support for running tests under PhantomJS and Travis

### 0.12.10

 - Update Q from v0.9.0 to v0.9.2

### 0.12.9

 - Update Q from v0.8.12 to v0.9.0

### 0.12.8

 - Defer throwing load errors to execution (Fixes #14)
 - Update bootstrapping for latest Q

### 0.12.7

 - Support returned exports in bootstrapping
 - Export more Node utilities (when used on Node)
    - Require.urlToPath -> Require.locationToPath(location)
    - Add Require.filePathToLocation(path)
    - Add Require.directoryPathToLocation(path)
    - Add Require.findPackagePath(directory)
    - Add Require.findPackageLocationAndModuleId(path)

### 0.12.6

 - Add support for `production` mode. Currently causes Mr to ignore
   `devDependencies`

## 0.12.5

 - Update Q to 0.8.12
