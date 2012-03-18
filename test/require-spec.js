
// dependency cycle including longer requires this module to be primed:
require("montage");
var logger = require("montage/core/logger").logger("require-spec");

describe("require-spec", function () {
    var loadErrorsExpected = {
        "determinism": true,
        "missing": true
    };
    [
        "cyclic",
        "determinism",
        "exactExports",
        "hasOwnProperty",
        "method",
        "method",
        "missing",
        "monkeys",
        "nested",
        "relative",
        "top-level",
        "transitive",
        "named-packages",
        "named-mappings",
        "comment"
    ].forEach(function (test) {
        it(test, function () {

            runs(function () {
                var spec = this;

                promise = require.loadPackage(module.directory + "require/" + test + "/")
                .then(function (pkg) {

                    pkg.inject("test", {
                        print: function (message, level) {
                            logger.debug(test + ":", message);
                        },
                        assert: function (guard, message) {
                            logger.debug(test + ":", guard ? "PASS" : "FAIL", message);
                            expect(!!guard).toBe(true);
                        }
                    });

                    return pkg.deepLoad("program")
                    .then(function () {
                        pkg("program");
                    }, function (reason, error, rejection) {
                        if (loadErrorsExpected.hasOwnProperty(test)) {
                            pkg("program");
                        } else {
                            return rejection;
                        }
                    });

                })
                .fail(function (reason, error) {
                    spec.fail(error || reason);
                })

            });

            waitsFor(function () {
                return promise.isResolved();
            });

        })
    });
});

