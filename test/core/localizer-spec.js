/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Promise = require("montage/core/promise").Promise,
    Deserializer = require("montage/core/deserializer").Deserializer;

describe("core/localizer-spec", function() {

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

        describe("hasMessages", function() {
            it("is false after creation", function() {
                expect(l.hasMessages).toBe(false);
            });
            it("is true when messages is set", function() {
                l.messages = {hello: "Hello"};
                expect(l.hasMessages).toBe(true);
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
            it("returns the key if the key does not exist and no fallback is given", function() {
                expect(l.localize("missing")()).toBe("missing");
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

        describe("loadMessages", function() {
            it("fails when package.json has no manifest", function() {
                return require.loadPackage(module.directory + "localizer/no-package-manifest/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function() {
                    return Promise.reject("expected messages not to load");
                }, function(err) {
                    return void 0;
                });
            });
            it("fails when package has no manifest.json", function() {
                return require.loadPackage(module.directory + "localizer/no-manifest/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function() {
                    return Promise.reject("expected messages not to load");
                }, function(err) {
                    return void 0;
                });
            });
            it("fails when package has no manifest.json", function() {
                return require.loadPackage(module.directory + "localizer/no-manifest-files/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function() {
                    return Promise.reject("expected messages not to load");
                }, function(err) {
                    return void 0;
                });
            });

            it("can load a simple messages.json", function() {
                return require.loadPackage(module.directory + "localizer/simple/", {}).then(function(r){
                    l.require = r;
                    return l.loadMessages();
                }).then(function(messages) {
                    expect(messages.hello).toBe("Hello, World!");
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
                    var num_albums = l.localize("num_albums");
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

        describe("localize", function() {
            it("returns the message function when locale resources have loaded (callback)", function() {
                // return Localizer.defaultLocalizer.localizeAsync("hello", "fail", function(fn) {
                //     expect(fn()).toBe("Hello");
                // }).then(function(){});
                // empty then to work with Jasmine
            });
            it("returns the message function when locale resources have loaded (promise)", function() {
                // return Localizer.defaultLocalizer.localizeAsync("hello", "fail").then(function(fn) {
                //     expect(fn()).toBe("Hello");
                // });
            });
        });
    });
});
