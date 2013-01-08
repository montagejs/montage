/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

describe("Require", function () {
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
        "identify"
    ].forEach(function (test) {
        it(test, function () {
            var spec = this;
            var done;
            var message;

            console.log(test + ":", "START");

            return require.loadPackage(
                module.directory + test + "/",
                {}
            )
            .then(function (pkg) {
                pkg.inject("test", {
                    print: function (_message, level) {
                        console.log(test + ":", _message);
                        if (_message === "DONE") {
                            message = _message;
                        }
                    },
                    assert: function (guard, message) {
                        console.log(test + ":", guard ? "PASS" : "FAIL", message);
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
                expect(message).toBe("DONE");
            });

        });
    });
});

