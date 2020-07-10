
require("../lib/jasmine-promise");
var Q = require("../../../q");
var HTTP = require("../../http");

describe("http server and client", function () {

    it("should work as both server and client", function () {
        var response = {
            "status": 200,
            "headers": {
                "content-type": "text/plain"
            },
            "body": [
                "Hello, World!"
            ]
        };

        var server = HTTP.Server(function () {
            return response;
        });

        return server.listen(0)
        .then(function (server) {
            var port = server.address().port;

            var request = {
                "host": "localhost",
                "port": port,
                "headers": {
                    "host": "localhost"
                }
            };

            return HTTP.request(request)
            .then(function (response) {
                expect(Q.isPromise(response.body)).toBe(false);
                var acc = [];
                return response.body.read()
                .then(function (body) {
                    expect(body.toString("utf-8")).toBe("Hello, World!");
                });
            })
        })
        .finally(server.stop)
    });

    it("should defer a response", function () {
        var response = {
            "status": 200,
            "headers": {
                "content-type": "text/plain; charset=utf-8"
            },
            "body": {
                "forEach": function (write) {
                    var deferred = Q.defer();
                    write("Hello, World!");
                    setTimeout(function () {
                        deferred.resolve();
                    }, 100);
                    return deferred.promise;
                }
            }
        };

        var server = HTTP.Server(function () {
            return response;
        });

        return server.listen(0).then(function (server) {
            var port = server.node.address().port;

            var request = {
                "host": "localhost",
                "port": port,
                "headers": {
                    "host": "localhost"
                },
                "charset": "utf-8"
            };

            return HTTP.request(request)
            .then(function (response) {
                var acc = [];
                return response.body.read()
                .then(function (body) {
                    expect(body).toBe("Hello, World!");
                });
            })
        })
        .finally(server.stop)
    });

    it('should successfully access resources that require HTTP Basic authentication when using the username:password@host.com URL syntax', function(){
        // This tries to access a public resource, see http://test.webdav.org/
        //
        // The resource is password protected, but there's no content behind it
        // so we will actually receive a 404; that's ok though as at least it's
        // a well-defined and expected status.
        return HTTP.request('http://user1:user1@test.webdav.org/auth-basic/')
        .then(function(response){
            expect(response.status).not.toBe(401);
            expect(response.status).toBe(404);
        });
    });
});

