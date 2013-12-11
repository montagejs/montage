[![Build Status](https://travis-ci.org/montagejs/mr.png?branch=master)](http://travis-ci.org/montagejs/mr)

Montage Require
===============

This is a CommonJS module system, highly compatible with NodeJS,
intended for front-end development of web applications using npme style
packages. It is designed to be automatically replaced by the Montage
Optimizer with a smaller, faster and bundled production module system.

Mr is installed as a package in your application using npm:

```bash
$ npm init                  # if you don't already have a package.json
$ npm install --save mr
```

In an HTML file next to your `package.json` add the Mr script and provide a
module to load:

```html
<script src="node_modules/mr/bootstrap.js" data-module="index"></script>
```

Start writing your code in `index.js`, using the `require` function as you
would in Node. Have a look at the [demo](https://github.com/montagejs/mr/tree/master/demo)
for working example.

You can place your `package.json` in a different location, or avoid having one
at all, with other [script tag attributes](https://github.com/montagejs/mr/tree/master/docs/Script-attribute.md).

## Optimization

Take a look at [Mop, the Montage Optimizer](https://github.com/montagejs/mop)
to optimize applications for production. The optimizer can bundle packages with
all of the dependent modules, can preload bundles of progressive enhancements
in phases, and can generate HTML5 application cache manifests.

## Documentation

Mr is [compatible with Node and npm](https://github.com/montagejs/mr/tree/master/docs/Node-compatability.md), although
there are some differences.

There is documentation for:

 - [`package.json` properties](https://github.com/montagejs/mr/tree/master/docs/Package-API.md)
 - [`require` function](https://github.com/montagejs/mr/tree/master/docs/Require-API.md)
 - [`module` object](https://github.com/montagejs/mr/tree/master/docs/Module-API.md)
 - [The package `config` object](https://github.com/montagejs/mr/tree/master/docs/Config-API.md)

And you may be interested in an in-depth look at [how Mr works](https://github.com/montagejs/mr/tree/master/docs/How-it-works.md).

## Compatibility

At present, Mr depends on `document.querySelector` and
probably several other recent EcmaScript methods that might not be
available in legacy browsers.  With your help, I intend to isolate and
fix these bugs.

At time of writing, tests pass in Chrome 21, Safari 5.1.5, and Firefox
13 on Mac OS 10.6.


## Maintenance

Tests are in the `spec` directory. Use `npm test` to run the tests in
PhantomJS or open `spec/run.html` in a browser.

This implementation is a part from Motorola Mobility’s [Montage][] web
application framework.  The module system was  written by Tom Robinson
and Kris Kowal.  Motorola holds the copyright on much of the original
content, and provided it as open source under the permissive BSD
3-Clause license.  This project is maintained by Kris Kowal and Stuart
Knightley, continuing with that license.

[Montage]: http://github.com/montage.js/montage

