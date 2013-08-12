
These CommonJS modules are used to construct the Montage bootstrapping
script, `../montage.js`.  `npm run build` to use the Mr stand-alone
build utility (`mrs`) to create `../montage.js`.

Some of these bootstrapping modules are used directly by Node.js to
bootstrap Montage in a Node.js environment. See `../node.js`.

Some of these are also used by Mop to create bundles with a
bootstrapping boilerplate, `./preload-boilerplate.js`.  That script is
also created using `npm run build` and uses `preload.js` as the CommonJS
entry point.  Mop uses this payload as a prefix to its bundles.  The
prefix evaluates to a `boot(preloadProgram)` function.  Mop adds code
that calls that function with a preloading plan, an array of arrays of
bundle file names.  It then suffixes the transitive static dependencies
of the entry module.

