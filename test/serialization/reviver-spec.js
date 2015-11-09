var Reviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Interpreter = require("montage/core/serialization/deserializer/montage-interpreter").MontageInterpreter,
    Promise = require("montage/core/promise").Promise;


describe("reviver", function() {

    var reviver = new Reviver();

    describe("get type", function() {
        it("should detect a string", function() {
            var type = reviver.getTypeOf("a string");

            expect(type).toBe("string");
        });

        describe("external objects", function() {
            it("should revive an external object", function() {
                var externalObject = {},
                    context = {
                        hasUserObject: function() {
                            return true;
                        },
                        getUserObject: function() {
                            return externalObject;
                        },
                        setObjectLabel: function() {}
                    },
                    object = reviver.reviveRootObject({}, context, "external");

                expect(object).toBe(externalObject);
            });

            it("should fail when external object is missing", function() {
                var externalObject = {},
                    context = {
                        hasUserObject: function() {
                            return false;
                        },
                        getUserObject: function() {
                            return;
                        },
                        setObjectLabel: function() {}
                    },
                    object = reviver.reviveRootObject({}, context, "external");

                expect(Promise.is(object)).toBe(true);
                expect(object.isRejected()).toBeTruthy();
            });
        });

        describe("number", function() {
            it("should detect a positive number", function() {
                var type = reviver.getTypeOf(42);

                expect(type).toBe("number");
            });

            it("should detect a negative number", function() {
                var type = reviver.getTypeOf(-42);

                expect(type).toBe("number");
            });

            it("should detect a rational number", function() {
                var type = reviver.getTypeOf(3.1415);

                expect(type).toBe("number");
            });
        });

        describe("boolean", function() {
            it("should detect a true", function() {
                var type = reviver.getTypeOf(true);

                expect(type).toBe("boolean");
            });

            it("should detect a false", function() {
                var type = reviver.getTypeOf(false);

                expect(type).toBe("boolean");
            });
        });

        it("should detect a null", function() {
            var type = reviver.getTypeOf(null);

            expect(type).toBe("null");
        });

        describe("regular expression", function() {
            it("should detect a regular expression", function() {
                var type = reviver.getTypeOf({"/": {"source": "regexp"}});

                expect(type).toBe("regexp");
            });

            it("should detect a regular expression with flags", function() {
                var type = reviver.getTypeOf({"/": {"source": "regexp", "flags": "gm"}});

                expect(type).toBe("regexp");
            });
        });

        it("should detect an array", function() {
            var type = reviver.getTypeOf([1, 2, 3]);

            expect(type).toBe("array");
        });

        it("should detect an object literal", function() {
            var type = reviver.getTypeOf({
                "string": "a string",
                "number": 42
            });

            expect(type).toBe("object");
        });

        it("should detect a reference", function() {
            var type = reviver.getTypeOf({"@": "object"});

            expect(type).toBe("reference");
        });
    });

    describe("custom object revivers", function() {
        var interpreter;

        beforeEach(function() {
            interpreter = new Interpreter().init(require);
        });
        afterEach(function() {
            Reviver.resetCustomObjectRevivers();
        });

        it("should deserialize a type of custom Montage object", function() {
            Reviver.addCustomObjectReviver({
                getTypeOf: function(object) {
                    if ("custom1" in object) {
                        return "Custom1";
                    }
                },

                reviveCustom1: function(value, context, label) {
                    context.setObjectLabel(value.custom1.name, label);

                    return value.custom1.name;
                }
            });

            var serialization = {
                    "main": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "name": "a custom1 object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main.name).toBe("a custom1 object");
            });
        });

        it("should deserialize different types of custom objects in the same reviver", function() {
            Reviver.addCustomObjectReviver({
                getTypeOf: function(object) {
                    if ("custom1" in object) {
                        return "Custom1";
                    } else if ("custom2" in object) {
                        return "Custom2";
                    }
                },

                reviveCustom1: function(value, context, label) {
                    context.setObjectLabel(value.custom1.name, label);

                    return value.custom1.name;
                },

                reviveCustom2: function(value, context, label) {
                    context.setObjectLabel(value.custom2.name, label);

                    return value.custom2.name;
                }
            });

            var serialization = {
                    "object1": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "name": "a custom1 object"
                        }
                    },

                    "object2": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "name": "a custom2 object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.object1.name).toBe("a custom1 object");
                expect(objects.object2.name).toBe("a custom2 object");
            });
        });

        it("should deserialize a type of custom object that has an asynchronous revival only once", function() {
            Reviver.addCustomObjectReviver({
                getTypeOf: function(object) {
                    if ("custom1" in object) {
                        return "Custom1";
                    }
                },

                revivals: 0,

                reviveCustom1: function(value, context, label) {
                    var deferred = new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            context.setObjectLabel(value.custom1, label);
                            resolve(value.custom1);
                            return value.custom1;
                        }, 0);
                    });

                    this.revivals++;
                    expect(this.revivals).toBe(1);

                    return deferred;
                }
            });

            var serialization = {
                    "main": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "name": "a custom1 object"
                        }
                    },

                    "one": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "main": {"@": "main"}
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main.name).toBe(objects.one.main.name);
                expect(objects.main.name).toBe("a custom1 object");
            });
        });
    });

    describe("extending reviver with types", function() {
        // Revives serializations in the form of {"[b]": [1, 2, 3, 4]}
        var ExtendedReviver = function() {
            Reviver.call(this);
        };

        ExtendedReviver.prototype = Object.create(Reviver.prototype, {
            getTypeOf: {
                value: function(value) {
                    if (value !== null && typeof value === "object"
                        && Object.keys(value).length === 1 && "[b]" in value) {
                        return "Blob";
                    } else {
                        return Reviver.prototype.getTypeOf.call(this, value);
                    }
                }
            },

            reviveBlob: {
                writable: true, // so we can spy on it
                value: function(value, context, label) {
                    // revive the blob
                }
            }
        });

        it("should call new reviver methods based on the getTypeOf", function() {
            var extendedReviver = new ExtendedReviver(),
                value = {"[b]": [1, 2, 3, 4]};

            spyOn(extendedReviver, "reviveBlob");
            extendedReviver.reviveValue(value);

            expect(extendedReviver.reviveBlob).toHaveBeenCalled();
        })
    });
});
