var request = require("montage/core/request");

describe("core/request-spec", function () {
    var object, xhr;
    beforeEach(function () {
        xhr = {};
        xhr.open = jasmine.createSpy("open");
        xhr.setRequestHeader = jasmine.createSpy("setRequestHeader");
        xhr.overrideMimeType = jasmine.createSpy("overrideMimeType");
        xhr.send = jasmine.createSpy("send");
        xhr.getAllResponseHeaders = jasmine.createSpy("getAllResponseHeaders");

        object = {
            url: "http://example.com",
            xhr: xhr
        };
    });

    describe("normalizeRequest", function () {
        it("converts a string into an object with a url property", function () {
            var req = request.normalizeRequest("pass");
            expect(typeof req).toEqual("object");
            expect(req.url).toEqual("pass");
        });

        it("defaults method to GET", function () {
            var req = request.normalizeRequest("pass");
            expect(req.method).toEqual("GET");
        });

        it("uses the given method property", function () {
            var req = request.normalizeRequest({
                method: "POST"
            });
            expect(req.method).toEqual("POST");
        });

        it("defaults headers to an empty object", function () {
            var req = request.normalizeRequest("pass");
            expect(req.headers).toEqual({});
        });

        it("uses the given headers", function () {
            var headers = {};
            var req = request.normalizeRequest({
                headers: headers
            });
            expect(req.headers).toBe(headers);
        });

        it("defaults options to an empty object", function () {
            var req = request.normalizeRequest("pass");
            expect(req.options).toEqual({});
        });

        it("uses the given options", function () {
            var options = {};
            var req = request.normalizeRequest({
                options: options
            });
            expect(req.options).toBe(options);
        });
    });

    describe("parseResponseHeaders", function () {
        it("returns an empty object when given no header string", function () {
            var headers = request.parseResponseHeaders();
            expect(headers).toEqual({});
        });

        it("lower-cases the header name, but not value", function () {
            var headers = request.parseResponseHeaders("NAME: VALUE");
            expect(headers).toEqual({name: "VALUE"});
        });

        it("trims name and value", function () {
            var headers = request.parseResponseHeaders("   name   :    value   ");
            expect(headers).toEqual({name: "value"});
        });

        it("parses multiple lines", function () {
            var headers = request.parseResponseHeaders("one: value 1\ntwo: value 2");
            expect(headers).toEqual({one: "value 1", two: "value 2"});
        });

        it("puts multiple headers with the same name into an array", function () {
            var headers = request.parseResponseHeaders("one: value 1\none: value 2\none: value 3\nother: value 4");
            expect(headers).toEqual({one: ["value 1", "value 2", "value 3"], "other": "value 4"});
        });

        it("allows a colon in the value", function () {
            var headers = request.parseResponseHeaders("one: before : after");
            expect(headers).toEqual({one: "before : after"});
        });

        it("handles no value", function () {
            var headers = request.parseResponseHeaders("pass:");
            expect(headers).toEqual({pass: ""});
        });
    });

    describe("request", function () {
        describe("request.url", function () {
            it("calls open with the method and url, and async true", function () {
                object.method = "get";
                object.url = "pass";
                var promise = request(object);
                expect(xhr.open).toHaveBeenCalledWith("get", "pass", true);
            });
        });

        it("calls open with the method and url, and async true", function () {
            object.method = "get";
            object.url = "pass";
            var promise = request(object);
            expect(xhr.open).toHaveBeenCalledWith("get", "pass", true);
        });

        it("calls setRequestHeader with the headers", function () {
            object.headers = {
                one: "value 1",
                two: "value 2"
            };
            var promise = request(object);
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("one", "value 1");
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("two", "value 2");
        });

        it("calls setRequestHeader with the headers", function () {
            object.headers = {
                one: "value 1",
                two: "value 2"
            };
            var promise = request(object);
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("one", "value 1");
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("two", "value 2");
        });

        it("calls setRequestHeader for each element in an array", function () {
            object.headers = {
                one: ["value 1", "value 2"]
            };
            var promise = request(object);
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("one", "value 1");
            expect(xhr.setRequestHeader).toHaveBeenCalledWith("one", "value 2");
        });

        it("sets a properties on the XHR object for each property in options", function () {
            object.options = {
                one: "value 1",
                two: "value 2"
            };
            var promise = request(object);
            expect(xhr.one).toEqual("value 1");
            expect(xhr.two).toEqual("value 2");
        });

        it("calls overrideMimeType if overrideMimeType property is set", function () {
            object.overrideMimeType = "text/html";
            var promise = request(object);
            expect(xhr.overrideMimeType).toHaveBeenCalledWith("text/html");
        });
    });

    describe("makeOk", function () {
        var ok, response;
        beforeEach(function () {
            ok = request.makeOk(function (request) {
                return response;
            });
        });

        it("resolves the response for 200 status", function () {
            response = {
                status: 200,
                headers: {},
                body: "pass"
            };

            return ok("http://example.com")
            .then(function (response) {
                expect(response.body).toEqual("pass");
            });
        });

        it("resolves the response for 204 status", function () {
            response = {
                status: 204,
                headers: {},
                body: "pass"
            };

            return ok("http://example.com")
            .then(function (response) {
                expect(response.body).toEqual("pass");
            });
        });

        it("rejects for 404 status", function () {
            response = {
                status: 404,
                headers: {},
                xhr: {statusText: "not found"}
            };

            var spec = this;
            return ok("http://example.com")
            .then(function (response) {
                spec.fail("should be rejected");
            }, function (error) {
                expect(error.message).toEqual('Could not load "http://example.com": 404 not found');
            });
        });
    });

    describe("makeJson", function () {
        var json, requestObject, response;
        beforeEach(function () {
            response = {
                status: 200,
                headers: {},
                body: '{"pass":true}'
            };
            json = request.makeJson(function (_request) {
                requestObject = _request;
                return response;
            });
        });

        describe("request", function () {
            it("sets Accept header to application/json", function () {
                return json("http://example.com")
                .then(function () {
                    expect(requestObject.headers.accept).toEqual("application/json");
                });
            });

            it("sets Content-Type header to application/json", function () {
                return json("http://example.com")
                .then(function () {
                    expect(requestObject.headers["content-type"]).toEqual("application/json");
                });
            });

            it("stringifies a given object", function () {
                return json({
                    url: "http://example.com",
                    body: {pass: "yes"}
                })
                .then(function () {
                    expect(requestObject.body).toEqual('{"pass":"yes"}');
                });
            });

            // Question: should it JSON.stringify a given string? I could already
            // be stringified JSON, or it could just be a string.

            it("sets overrideMimeType to application/json", function () {
                return json("http://example.com")
                .then(function () {
                    expect(requestObject.overrideMimeType).toEqual("application/json");
                });
            });

            it("sets responseType to json", function () {
                return json("http://example.com")
                .then(function () {
                    expect(requestObject.options.responseType).toEqual("json");
                });
            });
        });

        describe("response", function () {
            it("parses the response", function () {
                return json("http://example.com")
                .then(function (response) {
                    expect(response.body).toEqual({pass: true});
                });
            });

            it("gives an informative error when JSON parsing fails", function () {
                response.body = "x";

                var spec = this;
                return json("http://example.com")
                .then(function () {
                    spec.fail("should be rejected");
                }, function (error) {
                    try {
                        JSON.parse(response.body);
                    } catch (errorBrowser) {
                        // This end of the message error is dependent to browsers.
                        expect(error.message).toEqual('Could not parse JSON from "http://example.com": ' + errorBrowser.message);
                    }
                });
            });

            it("has no body if there was no response body", function () {
                response.body = void 0;

                var spec = this;
                return json("http://example.com")
                .then(function (response) {
                    expect(response.body).toBeUndefined();
                });
            });
        });
    });

    it("calls setRequestHeader with the headers", function () {
        object.headers = {
            one: "value 1",
            two: "value 2"
        };
        var promise = request(object);

        xhr.status = 200;
        xhr.response = "";
        xhr.onload();

        return promise.then(function (response) {
            expect(response.status).toEqual(200);
            expect(response.headers).toEqual({});
            expect(response.body).toEqual("");
        });
    });

});
