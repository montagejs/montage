
// dependency cycle including longer requires this module to be primed:
require("montage");
var logger = require("montage/core/logger").logger("require-spec");

describe("require-spec", function () {
    [
        "cyclic",
        "determinism",
        "exactExports",
        "hasOwnProperty",
        "method",
        "missing",
        "monkeys",
        "nested",
        "relative",
        "top-level",
        "transitive",
        "module-exports",
        "return",
        "named-packages",
        "named-mappings",
        "named-parent-package",
        "load-package",
        "load-package-name"
    ].forEach(function (test) {
        it(test, function () {
            var promise;

            runs(function () {
                var spec = this;
                var done;

                logger.debug(test + ":", "START");

                promise = require.loadPackage(
                    module.directory + test + "/",
                    {}
                )
                .then(function (pkg) {
                    pkg.inject("test", {
                        print: function (message, level) {
                            logger.debug(test + ":", message);
                            if (message === "DONE") {
                                done = message;
                            }
                        },
                        assert: function (guard, message) {
                            logger.debug(test + ":", guard ? "PASS" : "FAIL", message);
                            expect(!!guard).toBe(true);
                        }
                    });

                    return pkg.deepLoad("program")
                    .then(function () {
                        return pkg("program");
                    }, function () {
                        return pkg("program");
                    })

                })
                .fail(function (reason, error) {
                    spec.fail(error || reason);
                })
                .fin(function () {
                    expect(done).toBe("DONE");
                })

            });

            waitsFor(function () {
                return promise.isResolved();
            });

        })
    });
});

