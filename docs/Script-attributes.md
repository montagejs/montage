Script attributes
=================

### data-module

`data-module` instructs Mr to `require` the given module after it
has finished bootstrapping and the DOM content has loaded.

```html
<script src="node_modules/mr/bootstrap.js" data-module="index"></script>
```

will load `package.json` and then `index.js`.

### data-auto-package

`data-auto-package` indicates that there is no `package.json` for this
application, and instructs Mr to pretend that an empty one exists
in the same directory as the HTML document.

```html
<script src="node_modules/mr/bootstrap.js" data-auto-package data-module="index"></script>
```

will load just `index.js`.

### data-package

`data-package` indicates that there is a `package.json` and that it can be
found at the given location.  The default location is the same directory as
the HTML file.

```html
<script src="node_modules/mr/bootstrap.js" data-package=".." data-module="index"></script>
```

will load `../package.json` and then `../index.js`, because the module id is
relative to the root of the package.


Optimizer script attributes
===========================

The Montage Optimizer can convert entire packages to production ready versions
without manual alteration. The optimizer rewrites HTML, particularly replacing
the bootstrapping script with a bundle. As such, the run-time supports some
additional options.

These options are added automatically by Mop and should not be added or
modified manually.

### data-bootstrap

Indicates that this script element is the `bootstrap.js` script and denotes
the location of that script.

This is normally inferred from being a script with a `bootstrap.js` file name,
but thw optimizer replaces the `<script>` tag with a bundle with a different
name.

### data-bootstrap-hash, data-application-hash, data-q-hash

The optimizer converts all resources into script-injection form, by
changing `.js` modules to `.load.js` scripts with `define(hash, id,
descriptor)` boilerplate.  This permits packages to be loaded
cross-origin and with content security policies that forbid `eval`. The
bootstrapper needs to know these hashes for the packages used in bootstrapping
so that it can recognize them when defined.

Other dependency hashes are given in the processed `package.json`.

