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

var HTTP = require("q-http");
var JOEY = require("../joey");
var Q = require("q");

exports['test methods'] = function (assert, done) {

    var tests = [
        {method: "GET", content: "gotten"},
        {method: "POST", content: "posted"},
        {method: "PUT", content: "put"}
    ];

    JOEY
    .create()
    .blah({log: function () {}})
    .host("127.0.0.1:*", "localhost:*")
    .tap(function (request) {
        assert.deepEqual(request.terms, {
            "host": "localhost:*"
        }, 'host negotiation terms')
    })
    .methods(function (method) {
        method("GET").content("gotten");
        method("POST").content("posted");
        method("PUT").content("put");
    })
    .listen(8080)
    .then(function (server) {
        return tests.reduce(function (ready, test) {
            return Q.when(ready, function () {
                return HTTP.read({
                    "url": "http://localhost:8080/",
                    "method": test.method
                })
                .then(function (content) {
                    assert.equal(content, test.content, test.method + " content");
                }, function (response) {
                    assert.equal(response.status, 200, test.method + " status");
                    return Q.when(response.body, function (body) {
                        return body.read().then(function (content) {
                            console.log(content.toString("utf-8"));
                        });
                    });
                })
            });
        }, Q.ref())
        .fin(server.stop)
    })
    .fin(done)
    .end()

};

if (require.main == module)
    require("test").run(exports);

