### 0.15.6

 - Update Q to v1.0.1

### 0.15.5

 - Disable Firebug workaround that breaks modern Firefox

### 0.15.4

 - Fix display name for packages beginning with digits

### 0.15.3

 - Revert sourceMappingURL change, causes issues in Chrome and doesn't work great in Firefox.

### 0.15.2

 - Change `//@` for `//#` for SourceURL comment to match the spec
 - Use `sourceMappingURL` instead of `sourceURL`. This allows the evaled code
   to appear as source files in Firefox.
 - Friendlier display names for modules:
   `__FILE__http______localhost__8081__montagejs__mr__demo__data__` is now
   `mr_demo__data`

### 0.15.1

 - Fix requiring dependencies with ".js" in their name in script-injection mode
   (thanks @evax)
 - Fix requiring twice a module that throws an error

## 0.15.0

 - Added `moduleTypes` config parameter so that all loadable extensions are
   known. This fixes a bug where modules with a "." in them would not be loaded
   as JavaScript modules. When implementing a custom extension loader you must
   add the extension to the `config.moduleTypes` array when loading a package.

### 0.14.2

 - Use overlays in config given to `loadPackage`.

### 0.14.1

 - Correct extension detection

## 0.14.0

 - Remove support for `directories` `package.json` property. Node ignores the
   property, and continuing to support it breaks compatibility
 - Remove support for package reflexive module names
 - Fix main linkage for relative identifiers. Previously, a package with a
   `main` property that started with "./" would be linked incorrectly.
 - Fix loading of modules with a `.min.js` extension
 - Don't block XHR for the `file:` protocol. Firefox and Safari allow it as
   long as requests remain within the HTML page's directory.
 - Add support for the `browser` property in `package.json`, as pioneered by
   Browserify
 - Add "sandbox", to inject dependencies into a module. Require with
   `require("mr/sandbox")`

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
