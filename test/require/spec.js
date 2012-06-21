
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
        "load-package-name",
        "not-found",
        "comments",
        "conditional-redirects"
    ].forEach(function (test) {
        it(test, function () {
            var spec = this;
            var done;

            logger.debug(test + ":", "START");

            return require.loadPackage(
                module.directory + test + "/",
                {
                    condition: "on"
                }
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

                return pkg.async("program");
            })
            .then(function () {
            }, function (reason, error) {
                spec.fail(error || reason);
            })
            .fin(function () {
                expect(done).toBe("DONE");
            })
        })
    });
});

