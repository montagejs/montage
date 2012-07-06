/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
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

// TODO end

exports['test content'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("text").content("Hello, World!");
            ANY("html").ok("<h1>Hello</h1>", "text/html", 201);
        });
    },
    {
        "text": "Hello, World!",
        "html": 201
    }
);

exports['test cap'] = scaffold(
    function (J) {
        return J.cap().content("Hello, World!")
    },
    {
        "hi": 404
    }
);

exports['test tap'] = scaffold(
    function (J, assert) {
        return J.tap(function (request) {
            assert.ok(true, 'tapped'); // bad case (failure unobservable)
        })
        .file((module.directory || __dirname) + "/fixture.txt");
    },
    {
        "": "Hello, World!\n"
    }
);

exports['test trap'] = scaffold(
    function (J, assert) {
        return J.trap(function (response) {
            assert.equal(response.status, 200);
            return response;
        })
        .file((module.directory || __dirname) + "/fixture.txt");
    },
    {
        "": "Hello, World!\n"
    }
);

exports['test empty'] = scaffold(
    function (J) {
        return J.route(function (ANY) {});
    },
    {
        "": 404,
        "x": 404,
        "x/y": 404,
    }
);

exports['test optional'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY(":a?/:b?/:c?").app(template("$a $b $c"));
        });
    },
    {
        "a/b/c": "a b c",
        "a/b/": "a b ",
        "a/b": "a b ",
        "a/": "a  ",
        "a": "a  ",
        "": "  "
    }
);

exports['test rest'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("a/...").app(template("@pathInfo"));
            ANY("d/:e/...").app(template("$e @pathInfo"));
            ANY("g/:h?/...").app(template("$h @pathInfo"));
        });
    },
    {
        "a/b/c": "/b/c",
        "d": 404,
        "d/": 404,
        "d/e": "e ",
        "d/e/f": "e /f",
        "g": " ",
        "g/": " ",
        "g/h": "h ",
        "g/h/": "h /",
        "g/h/i": "h /i"
    }
);

exports['test rest alone'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("...").app(template("@pathInfo"));
        });
    },
    {
        "x/y/z": "/x/y/z"
    }
);

exports['test anonymous'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY(":/:/:").app(template("$0 $1 $2"));
        });
    },
    {
        "a/b/c": "a b c"
    }
);

exports['test star'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("*a").app(template("$a"));
        });
    },
    {
        "foo": "foo"
    }
);

exports['test star anonymous'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("*").app(template("$0"));
        });
    },
    {
        "foo": "foo"
    }
);

exports['test star interaction'] = scaffold(
    function (J) {
        return J.route(function (ANY) {
            ANY("a/*").app(template("$0"));
            ANY("b/*b").app(template("$b"));
            ANY("c/*c?").app(template("$c"));
        });
    },
    {
        "a/b/c": "b/c",
        "a/b": "b",
        "a/": "",
        "a": 404,
        "b/c/d": "c/d",
        "b/c/": "c/",
        "b/c": "c",
        "b/": "",
        "b": 404,
        "c/d/e": "d/e",
        "c/d/": "d/",
        "c/d": "d",
        "c/": "",
        "c": "",
    }
);

exports['test prefix'] = scaffold(
    function (J) {
        return J.route("/", function (ANY) {
            ANY("foo...").route("", function (ANY) {
                ANY("/").app(template("text"));
                ANY(".html").app(template("<html>"));
            });
        });
    },
    {
        "foo/": "text",
        "foo.html": "<html>"
    }
);

exports['test chain'] = scaffold(
    function (J) {
        return J.route("/", function (ANY) {
            ANY("foo...").route(function (ANY) {
                ANY("bar").app(template("foobar"));
            });
        });
    },
    {
        "foo/bar": "foobar",
    }
);

exports['test install object'] = scaffold(
    function (J) {
        return J.install({
            "template": template
        })
        .route(function (ANY) {
            ANY(":foo/:bar").template("$foo: $bar")
        })
    },
    {
        "a/b": "a: b"
    }
);

exports['test install function'] = scaffold(
    function (J) {
        return J.install(template)
        .route(function (ANY) {
            ANY(":foo/:bar").template("$foo: $bar")
        })
    },
    {
        "a/b": "a: b"
    }
);

exports['test route continuation'] = scaffold(
    function (J, assert) {
        return J
        .route(function ($) {
            $("foo").content("foo");
            $("bar").trap(function (response) {
                assert.deepEqual(response.body, ["fallback"], 'trapped');
                return response;
            })
        })
        .content("fallback");
    },
    {
        "foo": "foo",
        "bar": "fallback"
    }
);


function scaffold(setup, tests) {
    return function (assert, done) {
        return Object.keys(tests).reduce(function (done, path) {
            return done.then(function () {
                return setup(JOEY.blah({
                    log: function () {}
                }), assert)
                .listen(8080)
                .then(function (server) {
                    return HTTP.request("http://localhost:8080/" + path)
                    .then(function (response) {
                        if (response.status === 200) {
                            assert.equal(response.status, 200, JSON.stringify(path) + ' status');
                            if (typeof tests[path] === "string") {
                                return Q.when(response.body, function (body) {
                                    return body.read().then(function (content) {
                                        assert.equal(content.toString("utf-8"), tests[path], JSON.stringify(path) + " content");
                                    });
                                });
                            }
                        } else {
                            if (typeof tests[path] === "number") {
                                assert.equal(response.status, tests[path], JSON.stringify(path) + ' status');
                            } else {
                                assert.equal(response.status, 200, JSON.stringify(path) + ' status');
                                return Q.when(response.body, function (body) {
                                    return body.read().then(function (content) {
                                        console.log(content.toString("utf-8"));
                                    });
                                });
                            }
                        }
                    }, function (error) {
                        assert.ok(false, path + ' request');
                    })
                    .fin(server.stop);
                });
            });
        }, Q.ref())
        .fin(done)
        .end();
    };
}

function template(template) {
    return function (request) {
        return {
            "status": 200,
            "headers": {"content-type": "text/plain"},
            "body": [template.replace(/([$@%])([\w\d]+)/g, function (_, symbol, name) {
                if (symbol === "$") {
                    return request.params[name];
                } else if (symbol === "@") {
                    return request[name];
                } else if (symbol == "%") {
                    return request.headers[name];
                }
            })]
        }
    }
}

if (require.main == module)
    require("test").run(exports);

