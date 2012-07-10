
Joey
====

A [Sinatra][]-like and [jQuery][]-like web server (and client!)
configuration language in JavaScript for [NodeJS][] and [NPM][], based
on [JSGI][], [Q][], and [Jaque][].

[Joey Bishop][JB] was a member of the [Humphrey][HB] [Bogart][Bogart]'s
[Rat Pack][RP], which included [Frank][FS] [Sinatra][Sinatra],
[Dean][DM] [Martin][], [Peter Lawford][PL], and [Sammy][Sammy] [Davis
Jr.][SDJ].

[Sinatra]: http://www.sinatrarb.com/
[jQuery]: http://jquery.com/
[NodeJS]: http://nodejs.org/
[NPM]: http://npmjs.org/
[JSGI]: http://wiki.commonjs.org/wiki/JSGI
[Q]: https://github.com/kriskowal/q
[Jaque]: https://github.com/kriskowal/jaque
[Sammy]: http://sammyjs.org/
[Bogart]: https://github.com/nrstott/bogart
[Martin]: https://github.com/thegrubbsian/Martin
[RP]: http://en.wikipedia.org/wiki/Rat_Pack
[JB]: http://en.wikipedia.org/wiki/Joey_Bishop
[HB]: http://en.wikipedia.org/wiki/Humphrey_Bogart
[PL]: http://en.wikipedia.org/wiki/Peter_Lawford
[SDJ]: http://en.wikipedia.org/wiki/Sammy_Davis,_Jr.
[DM]: http://en.wikipedia.org/wiki/Dean_Martin
[FS]: http://en.wikipedia.org/wiki/Frank_Sinatra


Installation
============

You will need [NodeJS][] and [NPM][].

    $ npm install joey

Or add it to your package:

    {
        "dependencies": {
            "joey": "*"
        }
    }

And install your package.

    $ npm install

To run tests, you'll need a developer install.

    $ npm install -d
    $ node test/all.js


Hello, World!
=============

    require("joey").blah().content("Hello, World!").listen(8080)

    var request = require("joey").cookieJar().redirectTrap(20).client();

    request("http://localhost:8080")
    .then(function (response) {
        console.log(response.status, response.headers);
        response.body.read()
        .then(console.log)
    })

Hello, You!
===========

    require("joey")
    .route(function (ANY, GET) {

        GET("")
        .contentType("text/plain")
        .content("Hello, World!")

        GET(":name")
        .contentType("text/html")
        .contentApp(function (request) {
            return "Hello, " + request.params.name + "!";
        })

    })
    .favicon()
    .error()
    .log()
    .listen(8080)
    .then(function () {
        console.log("Listening on 8080")
    })
    .end()


Usage
=====

Routes start with Joey.

    require("joey")

Branches end with an application, like some static content.

    .content("Hello, World!")

Or some dynamic content.

    .contentApp(function (request) {
        return "Hello, " + request.pathInfo + "\n";
    })

Or a file, with its content type intuitied from the extension.

    .file(module.path || __filename)

Or a file with a specific content type, or status code.

    .file(module.path || __filename, "text/plain", 200)

Or some content in a directory tree.

    .fileTree(module.directory || __dirname)

Or proxy another server.

    .proxyTree("http://example.com/")

Or a temporary or permanent redirect.

    .redirect("../foo")
    .redirectPermanent("../bar")


Redirect paths are implicitly resolved relative to the request URL.
With no argument, a redirect implicitly loops back to the same path,
which is handy for redirecting to a ``GET`` after a ``PUT`` or ``POST``.

Or you can respond with an HTTP error.

    .badRequest()
    .notFound()
    .methodNotAllowed()
    .notAcceptable()

Or JSGI applications.  If you're using promises, the response can be a
promise. The body can be a promise. The body may be anything with a
``forEach(write)`` method.  ``forEach(write)`` may return a promise,
which upon resolution will end the response.  ``write(content)`` may
return a promise, particularly for throttling.

    .app(function (request) {
        return {
            status: 200,
            headers: {
                "content-type": "text/plain"
            },
            "body": [
                "Hello, " + request.pathInfo + "\n"
            ]
        }
    })

Or Node-style applications.

    .nap(function (request, response) {
        response.writeHead(200, {
            "content-type": "text/plain",
            "charset": "utf-8"
        });
        request.on("data", function (data) {
            response.write(data);
        });
        request.on("end", function () {
            response.end();
        })
    })

If you want to observe a request as it trickles down the chain, but do
not want to respond to it yourself, you can use a tap.

    .tap(function (request, response) {
        assert.equal(request.method, "PUT", "method is PUT");
    })
    .redirect("/")

You can use a trap to intercept a response.

    .trap(function (response) {
        response.headers["set-cookie"] = "id=1; HttpOnly";
    })

There is also a ``cap`` method in the ``app``, ``nap``, ``tap``,
``trap`` theme, at the end of routing.  ``cap`` limits subsequent
responders to the portion of the URL that has already been routed; all
other requests are "not found".

    .cap()
    .content("Hello, World");


Listening
---------

Which you can then serve as a web application.

    .listen(8080)
    .then(function (server) {
        console.log("Listening on 8080");
    })
    .end()


Routing
-------

And you can create branches.

    .route(function ($) {
        $("").content('<a href="/hello">Hello</a>', 'text/html');
        $("hello").content("Hello, World!");
    })

And the branches can be nested.

    .route(function ($) {
        $("hello").content("Hi!");
        $("hello/...").route(function ($) {
            $("world").content("Hello, World!");
            $("joey").content("Hello, Joey!");
            $("dave").content("Hello, Dave!");
        });
    })

The arguments to the ``$`` function (as named in these examples; you may
of course name it anything you like) are conditions for matching a
branch.  If a branch does not match the remaining routes are searched in
order.

The path expression can contain variables.

    .route(function ($) {
        $("hello/:name").contentApp(function (request) {
            return "Hello, " + request.params.name + "!";
        });
    })

Variables start with either ``:``, ``*``, or ``...``, have an optional
name, and may be followed by ``?``.  If there's a slash before a
variable, it receives special treatment when the variable is optional.

-   ``:name`` is a named variable, matching zero or more non-slash
    characters.  The matching characters are stored in
    ``request.params.name``.
-   ``*name`` is a named variable, matching all following characters
    including slashes.
-   ``:`` and ``*`` without a following letter character are anonymous
    variables.  They are accessible by their zero-index offset among the
    other parameters, like ``request.params[0]``.
-   ``/:name?`` is an optional variable. It, and even the slash that
    comes before it, can be omitted and the expression will still match.
    -   ``/:?`` optional variables can also be anonymous
    -   ``/*name?`` and match all following text including slashes
    -   ``:name?`` do not need to follow a slash
    -   or any combination thereof
-   ``/...`` matches the slash and everything that follows.  The entire
    match, including the slash, becomes the path for subsequent routing,
    stored in ``request.pathInfo``.

The path expressions have a default prefix of a slash, ``/``.  An
alternate prefix can be provided, for example, if you wish to match file
extension.

    .route(function ($) {
        $("foo").route(".", function ($) {

            // "/foo.html"
            $("html")
            .contentType("text/html")
            .content("<p>Hello, World</p>")

            // "/foo.txt"
            $("txt")
            .contentType("text/plain")
            .content("Hello, World")

        })
    })

You can limit a path to a particular HTTP method.  Any HTTP method may
be used, in addition to the special ``ANY`` method.

    .route(function (ANY, GET) {
        GET("hello").content("Hello, World!");
    })

The common methods are provided as positional arguments, of which you
can take as many as you need: ``ANY``, ``GET``, ``PUT``, ``POST``, and
``DELETE``, in that order.

    .route(function (ANY, GET, PUT, POST, DELETE) {
        GET("hello").content("Hello, World!");
    })

All other valid methods are provided as functions on ``this``.

    .route(function () {
        this.OPTIONS("hello").methodNotAllowed();
    })

But, you'll get proper HTTP responses for free if you use content
negotiation.

    .route(function ($) {
        $("foo").methods(function ($) {
            var value;

            $("GET")
            .json()
            .app(function () {
                return value;
            });

            $("PUT")
            .jsonRequest()
            .tap(function (object) {
                value = object;
            })
            .redirect();

        })
    })

Each route selector accepts any number of conditions (predicates).  If
the predicate is a function, the function gets called with ``request``
and ``response`` and it must return ``true`` for the route to be
selected.

    .route(function ($) {
        $("hello", function (request) {
            return request.headers.host === "localhost";
        }).content("Hello");
    })

So you can profane the HTTP specification if you must:

    .route(function ($) {
        $(function (request) {
            return request.method === "NYANCAT";
        }).redirect("http://nyan.cat/");
    })

If no route is selected, the route will continue searching for an app
down the chain.

    .route(function ($, GET) {
        GET("hello").content("Hello, World")
    })
    .redirectTemporary("hello")

You can put a cap on routing, which will end a route.  If a request
reaches a route cap with any part of the request URL unprocessed the
server will respond with a 404 "Not Found".

    .cap()


Negotiation
-----------

You can use chains to limit what HTTP Method and Host you are willing to
respond to.

    .host("localhost")
    .method("GET")

And you can and should use chains to perform content-negotiation.  With
the ``contentType``, ``language``, ``encoding``, ``charset``  functions,
routing will only proceed through the chain if the client is able to
accept the given parameter.  This is what Corbain Dallas would probably
call Content Negotiation.

    .charset("utf-8")
    .contentType("text/html")
    .language("en")
    .content("I wonder.")

Once negotiation is complete, the corresponding response headers are
automatically populated.  So, if you've negotiated to respond in
``text/html``, the ``Content-Type`` header of the response will be sent
with the headers automatically.  It is however up to you to ensure that
your response content satisfies the negotiated terms.  The negotiation
results are stored in ``request.terms``.

    .charset("utf-8", "ascii")
    .app(function (request) {
        assert.ok(["utf-8", "ascii"].indexOf(request.terms.charset) >= 0);
    })

Alternately, you can bring multiple options to the content negotiation.

    .route(function ($, GET) {
        GET("foo").route(function (".", function (ext) {
            ext("html").app(html);
            ext("text").app(text);
            ext("txt").app(text);
        })
        .contentTypes(function (type) {
            type("text/html").app(html);
            type("text/plain").app(text);
        })
    });

You can branch likewise on hosts:

    .host("localhost:*", "127.0.0.1:*")
    .hosts(function ($) {
        $("localhost:*", "127.0.0.1:*")
        .contentType("text/plain")
        .content("Hello, local client.")
        .cap()
    })

-   ``hosts``
-   ``methods``
-   ``contentTypes``
-   ``languages``
-   ``charsets``
-   ``encodings``


Middleware
----------

And you can wrap your route in middleware.

Logging middleware shows request and response times and statuses.

    .log()
    .log(console.log, stamp(message))

Error middleware transforms errors into 500 Server Error pages.

    .error()

Favicon middleware handles requests for ``/favicon.ico``.

    .favicon()
    .favicon(path)

And to avoid carpal tunnel, you can just use sensible defaults for
middleware.

    .blah()
    .blah({
        log: console.log,
        stamp: function (message) {return new Date() + " "},
        favicon: path,
        debug: true
    })

In fact, if you're in a real hurry, as in say, on a REPL, you can go
straight into blah from the `"joey"` module.

    require("joey").blah().content("hi").listen(8080)

Or, create your own JSGI Middleware and hook it up:

    .use(function (next) {
        return Middleware(next);
    })


Adapters
--------

And there are a couple adapters for formatting responses, as in JSON.

    .json()
    .app(function () {
        return {a: 10};
    })

Or Node's variable inspection format.

    .inspect()
    .app(function (request) {
        return request;
    });

Or create your own JSGI adapter and hook it up:

    .use(function (next) {
        return Adapter(...options, next);
    });

This adds a link to the chain, which will get connected to the
``next`` application, or ``undefined`` when the chain terminates.

    .terminate(function () {
        return function (request, response) {
            // end of the chain
            // returns its own response,
            // does not forward to next application
        };
    })

You can instantiate a JSGI application from the chain by terminating it.
The return value is an app, not a link in the chain.

    .end()


License
=======

Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

- Neither the name of Motorola Mobility LLC nor the names of its
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

