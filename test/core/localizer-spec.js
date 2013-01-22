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
/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs,spyOn */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Promise = require("montage/core/promise").Promise,
    Deserializer = require("montage/core/deserializer").Deserializer;

describe("core/localizer-spec", function() {

    describe("Message", function() {
        var message;
        beforeEach(function() {
            message = Localizer.Message.create();
        });

        it("has an init method that accepts key and default", function() {
            message = Localizer.Message.create().init("hello", "Hello");
            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello");
            });
        });

        it("has an init method that accepts a key, default and data", function() {
            var object = {
                name: "World"
            };
            message = Localizer.Message.create().init("hello", "Hello, {name}", object);
            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello, World");
            });

        });

        it("sets the localized property to the default message", function() {
            message.key = "Hello";
            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello");
            });
        });

        it("localizes the messages when message binding update", function() {
            var def = {
                key: "Hello, {name}"
            };

            message.data = {
                name: "World"
            };

            Object.defineBinding(message, "key", {
                boundObject: def,
                boundObjectPropertyPath: "key"
            });

            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello, World");
                def.key = "Goodbye, {name}";

                return message.localized;
            }).then(function (localized) {
                expect(localized).toBe("Goodbye, World");
            });
        });

        it("localizes the messages when data bindings update", function() {
            message.key = "Hello, {name}";

            var object = {
                name: "before"
            };

            Object.defineBinding(message, "data.name", {
                boundObject: object,
                boundObjectPropertyPath: "name"
            });

            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello, before");
                object.name = "after";

                return message.localized;
            }).then(function (localized) {
                expect(localized).toBe("Hello, after");
                message.data.name = "later";

                return message.localized;
            }).then(function (localized) {
                expect(localized).toBe("Hello, later");
                expect(object.name).toBe("later");
            });
        });

        it("localizes the messages when other data bindings update", function() {
            message.key = "Hello, {name}";

            var otherObject = {
                name: "before"
            };

            var object = {};

            Object.defineBinding(object, "name", {
                boundObject: otherObject,
                boundObjectPropertyPath: "name"
            });

            Object.defineBinding(message, "data.name", {
                boundObject: object,
                boundObjectPropertyPath: "name"
            });

            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello, before");
                otherObject.name = "after";

                return message.localized;
            }).then(function (localized) {
                expect(localized).toBe("Hello, after");
            });
        });

        it("automatically localizes the messages when data property updates", function() {
            message.key = "Hello, {name}";

            message.data = {
                name: "before"
            };

            return message.localized.then(function (localized) {
                expect(localized).toBe("Hello, before");
                message.data.name = "after";

                return message.localized;
            }).then(function (localized) {
                expect(localized).toBe("Hello, after");
            });
        });
    });

    describe("Localizer", function(){
        var l;
        beforeEach(function() {
            l = Localizer.Localizer.create().init("en");
        });

        it("can be created with a foreign language code", function() {
            var l = Localizer.Localizer.create().init("no");
            expect(l.messageFormat).not.toBe(null);
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
                var x = l.localizeSync("love you");
                expect(x()).toBe("Jeg elsker deg");
                expect("" + x).toBe("Jeg elsker deg");
            });
            it("returns a function if it takes variables", function() {
                var fn = l.localizeSync("hello_name");
                expect(typeof fn).toBe("function");
                expect(fn({name: "Ingrid"})).toBe("Hei Ingrid!");
            });
            it("caches the compiled functions", function() {
                var fn = l.localizeSync("hello_name");
                var fn2 = l.localizeSync("hello_name");
                expect(fn).toBe(fn2);
            });
            it("returns precompiled functions", function() {
                var fn = l.localizeSync("hello_name_function");
                expect(typeof fn).toBe("function");
                expect(fn({name: "Ingrid"})).toBe("Hei Ingrid!");
            });
            it("uses the default if the key does not exist", function() {
                expect(l.localizeSync("missing", "Missing key")()).toBe("Missing key");
            });
            it("returns the key if the key does not exist and no fallback is given", function() {
                expect(l.localizeSync("missing")()).toBe("missing");
            });
            it("throws if the message object does not contain a 'message' property", function() {
                var threw = false;
                try {
                    l.localizeSync("wrong object");
                } catch (e) {
                    threw = true;
                }
                expect(threw).toBe(true);
            });
        });

        describe("loadMessages", function() {
            it("fails when package.json has no manifest", function() {
                return require.loadPackage(module.directory + "localizer/no-package-manifest/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    return Promise.reject("expected messages not to load but got " + JSON.stringify(messages));
                }, function(err) {
                    return void 0;
                });
            });
            it("fails when package has no manifest.json", function() {
                return require.loadPackage(module.directory + "localizer/no-manifest/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    return Promise.reject("expected messages not to load but got " + JSON.stringify(messages));
                }, function(err) {
                    return void 0;
                });
            });
            it("fails when package has no manifest.json", function() {
                return require.loadPackage(module.directory + "localizer/no-manifest-files/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    return Promise.reject("expected messages not to load but got " + JSON.stringify(messages));
                }, function(err) {
                    return void 0;
                });
            });

            it("can load a simple messages.json (promise)", function() {
                return require.loadPackage(module.directory + "localizer/simple/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    expect(messages.hello).toBe("Hello, World!");
                });
            });

            it("can load a simple messages.json (callback)", function() {
                var deferred = Promise.defer();
                require.loadPackage(module.directory + "localizer/simple/", {}).then(function(r){
                    l.require = r;
                    l.loadMessages(null, function(messages) {
                        expect(messages.hello).toBe("Hello, World!");
                        deferred.resolve();
                    });
                });
                return deferred.promise;
            });

            it("has a timeout", function() {
                return require.loadPackage(module.directory + "localizer/simple/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages(1);
                }).then(function() {
                    return Promise.reject("expected a timeout");
                }, function(err) {
                    return void 0;
                });
            });

            it("loads non-English messages", function() {
                var l = Localizer.Localizer.create().init("no");
                return require.loadPackage(module.directory + "localizer/fallback/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    expect(messages.hello).toBe("Hei");
                });

            });

            it("loads the fallback messages", function() {
                var l = Localizer.Localizer.create().init("no-x-compiled");
                return require.loadPackage(module.directory + "localizer/fallback/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    expect(messages.hello).toBe("Hei");
                    expect(typeof messages.welcome).toBe("function");
                    var num_albums = l.localizeSync("num_albums");
                    expect(num_albums({albums: 1})).toBe("1 fotoalbum");
                    expect(num_albums({albums: 4})).toBe("4 fotoalbuma");
                });
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

        describe("delegate", function() {
            it("is called to determine the default locale to use", function() {
                var delegate = {
                    getDefaultLocale: function() {
                        return "en-x-delegate";
                    }
                };

                spyOn(delegate, 'getDefaultLocale').andCallThrough();

                Localizer.defaultLocalizer.delegate = delegate;

                expect(delegate.getDefaultLocale).toHaveBeenCalled();
                expect(Localizer.defaultLocalizer.locale).toBe("en-x-delegate");
            });
        });
    });
});
