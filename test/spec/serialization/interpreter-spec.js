var Interpreter = require("montage/core/serialization/deserializer/montage-interpreter").MontageInterpreter;


describe("interpreter", function() {
    var interpreter;

    beforeEach(function() {
        interpreter = new Interpreter().init(require);
    });

    describe("native values with labels", function() {

        describe("string", function() {
            it("should deserialize a labled string", function(done) {
                var instantiation,
                    serialization = {
                        "string": {
                            "value": "a string"
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.string).toBe("a string");
                }).finally(function () {
                    done();
                });
            });
        });

        describe("number", function() {
            it("should deserialize a labled positive number", function(done) {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": 42
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.number).toBe(42);
                }).finally(function () {
                    done();
                });
            });

            it("should deserialize a labled negative number", function(done) {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": -42
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.number).toBe(-42);
                }).finally(function () {
                    done();
                });
            });

            it("should deserialize a labled rational number", function(done) {
                var instantiation,
                    serialization = {
                        "number": {
                            "value": 3.1415
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.number).toBe(3.1415);
                }).finally(function () {
                    done();
                });
            });
        });

        describe("boolean", function() {
            it("should deserialize a labled true", function(done) {
                var instantiation,
                    serialization = {
                        "bool": {
                            "value": true
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.bool).toBe(true);
                }).finally(function () {
                    done();
                });
            });

            it("should deserialize a labled false", function(done) {
                var instantiation,
                    serialization = {
                        "bool": {
                            "value": false
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.bool).toBe(false);
                }).finally(function () {
                    done();
                });
            });
        });

        describe("null", function() {
            it("should deserialize a labled null", function(done) {
                var instantiation,
                    serialization = {
                        "nil": {
                            "value": null
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.nil).toBe(null);
                }).finally(function () {
                    done();
                });
            });
        });

    });

    describe("objects with labels", function() {

        describe("array", function() {
            it("should deserialize a labled empty array", function(done) {
                var instantiation,
                    serialization = {
                        "array": {
                            "value": []
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.array).toEqual([]);
                }).finally(function () {
                    done();
                });
            });

            it("should deserialize a labled array", function(done) {
                var deserializer,
                    serialization = {
                        "array": {
                            "value": [42, "string", true]
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.array).toEqual([42, "string", true]);
                }).finally(function () {
                    done();
                });
            });
        });

        describe("regular expression", function() {
            it("should deserialize a labled regexp", function(done) {
                var deserializer,
                    serialization = {
                        "regexp": {
                            "value": {"/": {
                                source: 'regexp',
                                flags: "gm"}
                            }
                        }
                    };

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.regexp).toEqual(/regexp/gm);
                }).finally(function () {
                    done();
                });
            });
        });

        describe("object literal", function() {
            it("should deserialize a labled object literal", function(done) {
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

                interpreter.instantiate(serialization).then(function(objects) {
                    expect(objects.literal).toEqual({
                        "number": 42,
                        "string": "a string",
                        "bool": true
                    });
                }).finally(function () {
                    done();
                });
            });
        });

        it("should deserialize an object labeled clear", function(done) {
            var deserializer,
                serialization = {
                    "clear": {
                        "value": "string"
                    }
                };

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.clear).toBe("string");
            }).finally(function () {
                done();
            });
        });
    });

    describe("object references", function() {
        it("should deserialize an object reference in a property", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main.object).toBe(objects.object);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object reference in an array", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main[0]).toBe(objects.object);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object with a self reference", function(done) {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "self": {"@": "main"}
                        }
                    }
                };

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main).toBe(objects.main.self);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize objects with mutual references", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main).toBe(objects.object.main);
                expect(objects.object).toBe(objects.main.object);
            }).finally(function () {
                done();
            });
        });
    });

    describe("object references", function() {
        it("should deserialize an object reference in a property", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main.object).toBe(objects.object);
            }).finally(function () {
                done();
            }); 
        });

        it("should deserialize an object reference in an array", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main[0]).toBe(objects.object);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object reference as a value", function(done) {
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

            interpreter.instantiate(serialization).then(function(objects) {
                expect(objects.main).toBe(objects.object);
            }).finally(function () {
                done();
            });
        });
    });

    describe("instances", function() {
        it("should use instances to deserialize", function(done) {
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

            interpreter.instantiate(serialization, instances).then(function(objects) {
                expect(objects.object).toBe(instances.object);
            }).finally(function () {
                done();
            });
        });

        it("should use instances to deserialize a reference", function(done) {
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

            interpreter.instantiate(serialization, instances).then(function(objects) {
                expect(objects.main).toBe(instances.object);
            }).finally(function () {
                done();
            });
        });

        it("should use instances to deserialize an external object", function(done) {
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

            interpreter.instantiate(serialization, instances).then(function(objects) {
                expect(objects.root.external).toBe(instances.external);
            }).finally(function () {
                done();
            });
        });

    });

    describe("errors", function() {
        it("should warn about broken references", function(done) {
            var instantiation,
                serialization = {
                    "main": {
                        "value": {
                            "object": {"@": "object"}
                        }
                    }
                };

            interpreter.instantiate(serialization).then(function(objects) {
                // never executed
            }, function(reason) {
                expect(reason).toBeDefined();
            }).finally(function () {
                done();
            });
        });
    });
});
