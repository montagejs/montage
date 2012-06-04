/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,beforeEach,it,expect,waitsFor,runs */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Deserializer = require("montage/core/deserializer").Deserializer;

describe("core/localizer-spec", function() {

    function testDeserializer(object, callback) {
        var deserializer = Deserializer.create(),
            objects, latch;

        deserializer._require = require;
        deserializer.initWithObject(object).deserialize(function(objs) {
            latch = true;
            objects = objs;
        });

        waitsFor(function() { return latch; });
        runs(function() {
            callback(objects);
        });
    }

    describe("Localizer", function(){
        var l;
        beforeEach(function() {
            l = Localizer.Localizer.create().init("en");
        });

        describe("locale", function() {
            it("can't be set to an invalid tag", function() {
                var threw = false;
                try {
                    l.locale = "123-en-US";
                } catch (e) {
                    threw = true;
                }
                expect(l.locale).not.toBe("123-en-US");
                expect(threw).toBe(true);
            });
        });

        describe("messages", function() {
            it("can't be set to a non-object", function() {
                var threw = false;
                try {
                    l.messages = "hello";
                } catch (e) { threw = true; }
                expect(l.messages).not.toBe("hello");
                expect(threw).toBe(true);
            });
            it("can be set to an object", function() {
                var input = {"hello": "ahoy!"};
                l.messages = input;

                expect(l.messages).toBe(input);
            });
        });

        describe("localize", function() {
            beforeEach(function() {
                l.messages = {
                    "hello_name": "Hei {name}!",
                    "hello_name_function": function(d){
                        var r = "";
                        r += "Hei ";
                        if(!d){
                        throw new Error("MessageFormat: No data passed to function.");
                        }
                        r += d["name"];
                        r += "!";
                        return r;
                    },
                    "love you": {"message": "Jeg elsker deg"},
                    "wrong object": {"string": "nope"}
                };
            });

            it("returns a function with toString for simple messages", function() {
                var x = l.localize("love you");
                expect(x()).toBe("Jeg elsker deg");
                expect("" + x).toBe("Jeg elsker deg");
            });
            it("returns a function if it takes variables", function() {
                var fn = l.localize("hello_name");
                expect(typeof fn).toBe("function");
                expect(fn({name: "Ingrid"})).toBe("Hei Ingrid!");
            });
            it("caches the compiled functions", function() {
                var fn = l.localize("hello_name");
                var fn2 = l.localize("hello_name");
                expect(fn).toBe(fn2);
            });
            it("returns precompiled functions", function() {
                var fn = l.localize("hello_name_function");
                expect(typeof fn).toBe("function");
                expect(fn({name: "Ingrid"})).toBe("Hei Ingrid!");
            });
            it("uses the default if the key does not exist", function() {
                expect(l.localize("missing", "Missing key")()).toBe("Missing key");
            });
            it("returns null if the key does not exist and no fallback is given", function() {
                expect(l.localize("missing")).toBe(null);
            });
            it("throws if the message object does not contain a 'message' property", function() {
                var threw = false;
                try {
                    l.localize("wrong object");
                } catch (e) {
                    threw = true;
                }
                expect(threw).toBe(true);
            });
        });
    });

    describe("defaultLocalizer", function() {
        beforeEach(function() {
            Localizer.defaultLocalizer.reset();
        });

        describe("locale", function() {
            it("defaults to navigator.language", function() {
                expect(Localizer.defaultLocalizer.locale).toBe(window.navigator.language);
            });
            it("saves the value to local storage", function() {
                Localizer.defaultLocalizer.locale = "en-x-test";
                expect(Localizer.defaultLocalizer.locale).toBe("en-x-test");
                expect(window.localStorage.getItem("montage_locale")).toBe("en-x-test");
            });
        });
    });

    describe("serialization", function() {
        describe("localization unit", function() {
            it("requires a key", function() {
                testDeserializer({
                    test: {
                        prototype: "montage/ui/dynamic-text.reel",
                        properties: {
                            defaultValue: "fail"
                        },
                        localizations: {
                            value: {
                                "_default": "Hello"
                            }
                        }
                    }
                }, function(objects) {
                    var test = objects.test;
                    expect(test.value).not.toBe("Hello");
                });
            });

            it("localizes a string", function() {
                testDeserializer({
                    test: {
                        prototype: "montage/ui/dynamic-text.reel",
                        localizations: {
                            value: {
                                "_": "hello",
                                "_default": "Hello"
                            }
                        }
                    }
                }, function(objects) {
                    var test = objects.test;
                    expect(test.value).toBe("Hello");
                });
            });

            it("creates a binding from the localizer to the object", function() {
                testDeserializer({
                    input: {
                        prototype: "montage",
                        properties: {
                            "thing": "World"
                        }
                    },

                    test: {
                        prototype: "montage/ui/dynamic-text.reel",
                        properties: {
                            defaultValue: "fail"
                        },
                        localizations: {
                            value: {
                                "_": "hello_thing",
                                "_default": "Hello {thing}",
                                "thing": "@input.thing"
                            }
                        }
                    }
                }, function(objects) {
                    var test = objects.test;
                    expect(test.value).toBe("Hello World");
                    expect(test._bindingDescriptors.value).toBeDefined();
                });
            });

            it("accepts variables for the localization", function() {
                testDeserializer({
                    input: {
                        prototype: "montage",
                        properties: {
                            "thing": "World"
                        }
                    },

                    test: {
                        prototype: "montage/ui/dynamic-text.reel",
                        properties: {
                            defaultValue: "fail"
                        },
                        localizations: {
                            value: {
                                "_": "hello_thing",
                                "_default": "Hello {thing}",
                                "thing": "@input.thing"
                            }
                        }
                    }
                }, function(objects) {
                    var test = objects.test;
                    expect(test.value).toBe("Hello World");
                    objects.input.thing = "Earth";
                    expect(test.value).toBe("Hello Earth");
                });
            });
        });

        describe("localizer localizeObjects", function() {
            it("only works on the localizer", function() {
                testDeserializer({
                    other: {
                        value: {x: "pass"}
                    },
                    localizer: {
                        prototype: "montage/core/converter/converter",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: "fail"
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    expect(objects.other.x).toBe("pass");
                });
            });

            it("can set properties on any object", function() {
                testDeserializer({
                    other: {
                        value: {x: "fail"}
                    },
                    localizer: {
                        object: "montage/core/localizer",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: "pass"
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    expect(objects.other.x).toBe("pass");
                });
            });
            it("uses the existing property value as a key", function() {
                testDeserializer({
                    other: {
                        value: {x: "pass"}
                    },
                    localizer: {
                        object: "montage/core/localizer",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: true
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    expect(objects.other.x).toBe("pass");
                });
            });
        });
    });
});
