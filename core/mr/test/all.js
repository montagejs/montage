/* global it, fail, expect, jasmine, Promise */
console.log('mr-testing', 'Start');

function run(suiteRequire, modules) {

    // Filter node:false
    modules = modules.filter(function (module) {
        if (typeof module === "object") {
            if (module.node === false && typeof process !== "undefined") {
                return false;
            } else if (module.browser === false && typeof window !== "undefined") {
                return false;
            }
        }
        return true;
    }).map(function (module) {
        if (typeof module === "object") {
            return module.name;
        } else {
            return module;
        }
    });

    var promises = modules.map(function (module) {

        var spec = this,
            packagePath = module + '/';

        return suiteRequire.loadPackage(packagePath, {
            location: require.location
        }).then(function (pkg) {

            pkg.inject("test", {
                print: function (msg, level) {},
                assert: function (guard, msg) {
                    expect(!!guard).toBe(true);
                }
            });

            it(module, function (done) {
                pkg.async("program").then(function () {
                    expect("DONE").toBe("DONE");
                }).catch(function (err) {
                    fail(err);
                }).finally(function  () {
                    done();
                });
            });
        });
    });

    return Promise.all(promises).then(function(results) {
        return new Promise(function (resolve, reject) {
            var jasmineEnv = jasmine.getEnv();
            jasmineEnv.addReporter({
                jasmineDone: function(result) {
                    resolve();
                }
            });

            if (global.__karma__) {
                global.__karma__.start();
            } else {
                jasmine.getEnv().execute();
            }
        });
    });
}

module.exports = run(require, [
    "spec/cyclic",
    "spec/determinism",
    "spec/exactExports",
    "spec/hasOwnProperty",
    "spec/method",
    "spec/missing",
    "spec/monkeys",
    "spec/nested",
    "spec/relative",
    "spec/top-level",
    "spec/transitive",
    "spec/module-exports",
    "spec/return",
    {name: "spec/named-packages", node: false},
    {name: "spec/named-mappings", node: false},
    "spec/named-parent-package",
    "spec/load-package",
    "spec/load-package-name",
    "spec/load-package-digit",
    {name: "spec/not-found", node: false},
    "spec/redirects",
    "spec/redirects-package",
    "spec/comments",
    "spec/identify",
    "spec/dev-dependencies",
    "spec/production",
    "spec/case-sensitive",
    "spec/inject",
    "spec/inject-dependency",
    "spec/inject-into-mapping",
    "spec/inject-mapping",
    {name: "spec/script-injection-dep", node: false},
    {name: "spec/script-injection", node: false},
    "spec/read",
    "spec/main-name",
    "spec/main",
    "spec/sandbox",
    "spec/browser-alternative",
    "spec/browser-alternatives",
    "spec/extension-loader",
    "spec/overlay",
    "spec/moduleTypes",
    "spec/module-html",
    "spec/module-main-default",
    "spec/module-reel",
    "spec/module-error",
    "spec/module-metadata",
    "spec/legacy-bundling",
    "spec/flat-module-tree",
    "spec/package-lock",
    "spec/serialization-compiler",
    "spec/directory-index",
    {name: "spec/dot-js-module", node: false}
]).then(function () {
    console.log('mr-testing', 'End');
}, function (err) {
    console.log('mr-testing', 'Fail', err, err.stack);
});
