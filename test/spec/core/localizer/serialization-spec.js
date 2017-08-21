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
/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Promise = require("montage/core/promise").Promise,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Map = require("montage/collections/map"),
    Bindings = require("montage/core/core").Bindings,
    FrbBindings = require("montage/frb/bindings");

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

TestPageLoader.queueTest("fallback/fallback", {directory: module.directory}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    function testDeserializer(object, callback) {
        var deserializer = new Deserializer(),
            objects, latch,
            serializationString = JSON.stringify(object);

        deserializer.init(
            serializationString, require);
        deserializer.deserialize().then(function (objs) {
            latch = true;
            objects = objs;
        });

        setTimeout(function () {
            callback(objects);
        });
    }

    function testSerializer(object, callback) {
        var serializer = new Serializer().initWithRequire(require),
            objects;

        testDeserializer(object, function (o) {
            objects = o;
            setTimeout(function () {
                var serialization = serializer.serializeObject(objects.target);
                callback(stripPP(serialization));
            });
        });
    }

    describe("core/localizer/serialization-spec", function () {
        describe("Message", function () {
            it("localizes the message", function () {
                return test.message.localized.then(function (localized) {
                    expect(localized).toBe("Welcome to the site, World");
                });
            });

            it("does not serialize the default localizer", function (done) {
                testSerializer({
                    target: {
                        prototype: "montage/core/localizer[Message]",
                        values: {
                            key: "hello"
                        }
                    }
                }, function (serialization) {
                    expect(serialization).not.toContain("localizer");
                    done();
                });
            });

            xit("serializes an non-default localizer", function (done) {
                var serialization = {
                        localizer: {
                            prototype: "montage/core/localizer",
                            values: {
                                locale: "en-x-test"
                            }
                        },
                        target: {
                            prototype: "montage/core/localizer[Message]",
                            values: {
                                key: "hello",
                                localizer: {"@": "localizer"}
                            }
                        }
                    },
                    expectedSerialization = {
                        "root": {
                            "value": {
                                "key": "hello",
                                "defaultMessage": null,
                                "localizer": {"@": "localizer"}
                            }
                        },

                        "localizer": {
                            "prototype": "montage/core/localizer",
                            "values": {
                                "messages": null,
                                "locale": "en-x-test",
                                "identifier": null
                            }
                        }
                    };

                testSerializer(serialization, function (serializationString) {
                    expect(JSON.parse(serializationString))
                    .toEqual(expectedSerialization);
                    done();
                });
            });
        });

        describe("localizations unit", function () {

            it("requires a key", function () {
                expect(test.missingKey.value).toBe("Pass");
            });

            it("localizes a string", function () {
                expect(test.basic.value).toBe("Pass.");
            });

            it("localizes a string and uses available resources", function () {
                expect(test.resources.value).toBe("Hello");
            });

            xit("creates a binding from the localizer to the object", function (done) {
                var iframeRequire = testPage.iframe.contentWindow.mr;

                iframeRequire.async("montage/core/core").then(function (exports) {
                    var iframeBindings = exports.Bindings,
                        bindings;

                    bindings = iframeBindings.getBindings(test.binding);
                    setTimeout(function () {
                        expect(test.binding.value).toBe("Hello World");
                        expect(bindings.value).toBeDefined();

                        setTimeout(function () {
                            expect(test.binding.value).toBe("Hello Earth");
                            done();
                        });
                    });
                });
            });

            it("can localize two properties", function () {
                expect(test.twoProperties.value).toBe("On");
                expect(test.twoProperties.secondValue).toBe("Off");
            });

            it("accepts a binding for the default message", function (done) {
                testDeserializer({
                    source: {
                        value: {value: "Hello, {name}"}
                    },
                    target: {
                        prototype: "montage",
                        localizations: {
                            "value": {
                                "key": "", // key is required
                                "default": {"<-": "@source.value"},
                                "data": {
                                    "name": "someone"
                                }
                            }
                        }
                    }
                }, function (objects) {
                    setTimeout(function () {
                        expect(objects.target.value).toBe("Hello, someone");
                        objects.source.value = "Goodbye, {name}";

                        setTimeout(function () {
                            expect(objects.target.value).toBe("Goodbye, someone");
                            done();
                        });
                    });
                });
            });

            describe("serializer", function () {
                var objects,
                    serializer;

                beforeEach(function (done) {
                    testDeserializer({
                        source: {
                            value: {x: "Hello, {name}"}
                        },
                        target: {
                            prototype: "montage",
                            localizations: {
                                "binding": {
                                    "key": "", // key is required
                                    "default": {"<-": "@source.value"},
                                    "data": {
                                        "name": "someone"
                                    }
                                },
                                "message": {
                                    "key": "", // key is required
                                    "default": "Hello",
                                }
                            }
                        }
                    }, function (o) {
                        objects = o;
                        done();
                    });

                    serializer = new Serializer().initWithRequire(require);
                });

                it("doesn't create a localizations block when there are none", function (done) {
                    testSerializer({
                        source: {
                            value: {value: "Hello", identifier: "source"}
                        },
                        target: {
                            prototype: "montage",
                            bindings: {
                                "test": {"<-": "@source.value"}
                            }
                        }
                    }, function (serialization) {
                        expect(serialization).not.toContain("localizations");
                        done();
                    });
                });

                xit("serializes simple localization strings", function (done) {
                    var serialization = {
                            target: {
                                prototype: "montage",
                                localizations: {
                                    "message": {
                                        "key": "hello", // key is required
                                        "default": "Hello"
                                    }
                                }
                            }
                        },
                        expectedSerialization = {
                            "root": {
                                "prototype": "montage/core/core[Montage]",
                                "values": {
                                    "identifier": null
                                },
                                "localizations": {
                                    "message": {
                                        "key": "hello", // key is required
                                        "default": "Hello"
                                    }
                                }
                            }
                        };

                    testSerializer(serialization, function (serializationString) {
                        expect(JSON.parse(serializationString))
                        .toEqual(expectedSerialization);
                        done();
                    });
                });

                xit("serializes default message binding", function (done) {
                    var serialization = {
                            source: {
                                value: {
                                    value: "Hello, {name}",
                                    identifier: "source"
                                }
                            },
                            target: {
                                prototype: "montage",
                                localizations: {
                                    "binding": {
                                        "key": "", // key is required
                                        "default": {"<-": "@source.value"},
                                        "data": {
                                            "name": "someone"
                                        }
                                    }
                                }
                            }
                        },
                        expectedSerialization = {
                            "root": {
                                "prototype": "montage/core/core[Montage]",
                                "values": {
                                    "identifier": null
                                },
                                "localizations": {
                                    "binding": {
                                        "key": "",
                                        "default": {
                                            "<-": "@source.value"
                                        },
                                        "data": {
                                            "name": "someone"
                                        }
                                    }
                                }
                            },
                            "source": {}
                        };

                    testSerializer(serialization, function (serializationString) {
                        expect(JSON.parse(serializationString))
                        .toEqual(expectedSerialization);
                        done();
                    });
                });

                xit("serializes data binding", function (done) {
                    var serialization = {
                            source: {
                                value: {
                                    value: "World",
                                    identifier: "source"
                                }
                            },
                            target: {
                                prototype: "montage",
                                localizations: {
                                    "binding": {
                                        "key": "", // key is required
                                        "default": "Hello, {name}",
                                        "data": {
                                            "name": {"<-": "@source.value"}
                                        }
                                    }
                                }
                            }
                        },
                        expectedSerialization = {
                            "root": {
                                "prototype": "montage/core/core[Montage]",
                                "values": {
                                    "identifier": null
                                },
                                "localizations": {
                                    "binding": {
                                        "key": "",
                                        "default": "Hello, {name}",
                                        "data": {
                                            "name": {
                                                "<-": "@source.value"
                                            }
                                        }
                                    }
                                }
                            },
                            "source": {}
                        };

                    testSerializer(serialization, function (serializationString) {
                        expect(JSON.parse(serializationString))
                        .toEqual(expectedSerialization);
                        done();
                    });
                });
            });

        });
    });
});
