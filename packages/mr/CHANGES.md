## 0.12.10

 - Update Q from v0.9.0 to v0.9.2

 ## 0.12.9

 - Update Q from v0.8.12 to v0.9.0

## 0.12.8

 - Defer throwing load errors to execution (Fixes #14)
 - Update bootstrapping for latest Q

## 0.12.7

 - Support returned exports in bootstrapping
 - Export more Node utilities (when used on Node)
    - Require.urlToPath -> Require.locationToPath(location)
    - Add Require.filePathToLocation(path)
    - Add Require.directoryPathToLocation(path)
    - Add Require.findPackagePath(directory)
    - Add Require.findPackageLocationAndModuleId(path)

## 0.12.6

 - Add support for `production` mode. Currently causes Mr to ignore
   `devDependencies`

## 0.12.5

 - Update Q to 0.8.12
