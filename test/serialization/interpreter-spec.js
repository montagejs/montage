var Interpreter = require("montage/core/serialization/deserializer/montage-interpreter").MontageInterpreter;


describe("interpreter", function() {
    var interpreter;

    beforeEach(function() {
        interpreter = new Interpreter().init(require);
    });

    describe("native values with labels", function() {

        describe("string", function() {
            it("should deserialize a labled string", function() {
                var instantiation,
                    serialization = {
                        "string": {
                            "value": "a string"
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.string).toBe("a string");
                });
            });
        });

        describe("number", function() {
            it("should deserialize a labled positive number", function() {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": 42
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.number).toBe(42);
                });
            });

            it("should deserialize a labled negative number", function() {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": -42
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.number).toBe(-42);
                });
            });

            it("should deserialize a labled rational number", function() {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": 3.1415
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.number).toBe(3.1415);
                });
            });
        });

        describe("boolean", function() {
            it("should deserialize a labled true", function() {
                var instantiation,
                    serialization = {
                        "bool": {
                            "value": true
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.bool).toBe(true);
                });
            });

            it("should deserialize a labled false", function() {
                var instantiation,
                    serialization = {
                        "bool": {
                            "value": false
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.bool).toBe(false);
                });
            });
        });

        describe("null", function() {
            it("should deserialize a labled null", function() {
                var instantiation,
                    serialization = {
                        "nil": {
                            "value": null
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.nil).toBe(null);
                });
            });
        });

    });

    describe("objects with labels", function() {

        describe("array", function() {
            it("should deserialize a labled empty array", function() {
                var instantiation,
                    serialization = {
                        "array": {
                            "value": []
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.array).toEqual([]);
                });
            });

            it("should deserialize a labled array", function() {
                var deserializer,
                    serialization = {
                        "array": {
                            "value": [42, "string", true]
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.array).toEqual([42, "string", true]);
                });
            });
        });

        describe("regular expression", function() {
            it("should deserialize a labled regexp", function() {
                var deserializer,
                    serialization = {
                        "regexp": {
                            "value": {"/": {
                                source: 'regexp',
                                flags: "gm"}
                            }
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.regexp).toEqual(/regexp/gm);
                });
            });
        });

        describe("object literal", function() {
            it("should deserialize a labled object literal", function() {
                var deserializer,
                    serialization = {
                        "literal": {
                            "value": {
                                "number": 42,
                                "string": "a string",
                                "bool": true
                            }
                        }
                    };

                return interpreter.instantiate(serialization)
                .then(function(objects) {
                    expect(objects.literal).toEqual({
                        "number": 42,
                        "string": "a string",
                        "bool": true
                    });
                });
            });
        });

        it("should deserialize an object labeled clear", function() {
            var deserializer,
                serialization = {
                    "clear": {
                        "value": "string"
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.clear).toBe("string");
            });
        });
    });

    describe("object references", function() {
        it("should deserialize an object reference in a property", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "object": {"@": "object"}
                        }
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main.object).toBe(objects.object);
            });
        });

        it("should deserialize an object reference in an array", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": [
                            {"@": "object"}
                        ]
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main[0]).toBe(objects.object);
            });
        });

        it("should deserialize an object with a self reference", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "self": {"@": "main"}
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main).toBe(objects.main.self);
            });
        });

        it("should deserialize objects with mutual references", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "object": {"@": "object"}
                        }
                    },

                    "object": {
                        "value": {
                            "main": {"@": "main"}
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main).toBe(objects.object.main);
                expect(objects.object).toBe(objects.main.object);
            });
        });
    });

    describe("object references", function() {
        it("should deserialize an object reference in a property", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "object": {"@": "object"}
                        }
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main.object).toBe(objects.object);
            });
        });

        it("should deserialize an object reference in an array", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": [
                            {"@": "object"}
                        ]
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main[0]).toBe(objects.object);
            });
        });

        it("should deserialize an object reference as a value", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {"@": "object"}
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                expect(objects.main).toBe(objects.object);
            });
        });
    });

    describe("instances", function() {
        it("should use instances to deserialize", function() {
            var instantiation,
                serialization = {
                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                },
                instances = {
                    object: {
                        name: "another object"
                    }
                };

            return interpreter.instantiate(serialization, instances)
            .then(function(objects) {
                expect(objects.object).toBe(instances.object);
            });
        });

        it("should use instances to deserialize a reference", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {"@": "object"}
                    },

                    "object": {
                        "value": {
                            "name": "object"
                        }
                    }
                },
                instances = {
                    object: {
                        name: "another object"
                    }
                };

            return interpreter.instantiate(serialization, instances)
            .then(function(objects) {
                expect(objects.main).toBe(instances.object);
            });
        });

        it("should use instances to deserialize an external object", function() {
            var instantiation,
                serialization = {
                    "root": {
                        "value": {
                            "external": {"@": "external"}
                        }
                    },

                    "external": {}
                },
                instances = {
                    external: {
                        name: "external object"
                    }
                };

            return interpreter.instantiate(serialization, instances)
            .then(function(objects) {
                expect(objects.root.external).toBe(instances.external);
            });
        });

    });

    describe("errors", function() {
        it("should warn about broken references", function() {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "object": {"@": "object"}
                        }
                    }
                };

            return interpreter.instantiate(serialization)
            .then(function(objects) {
                // never executed
            }, function(reason) {
                expect(reason).toBeDefined();
            });
        });
    });
});
