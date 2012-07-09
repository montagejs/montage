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
var Montage = require("montage").Montage,
    Serializer = require("montage/core/serializer").Serializer,
    Deserializer = require("montage/core/deserializer").Deserializer,
    ChangeNotification = require("montage/core/change-notification").ChangeNotification;

require("montage/core/change-notification");

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

describe("events/change-notification-spec", function() {
    beforeEach(function() {
        ChangeNotification.__reset__();
    });

    describe("calling the listener after the change", function() {
        describe("on a single property path", function() {
            it("should listen using a function", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x", listeners.listener);

                object.x = 4;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should listen to the same property twice using different functions", function() {
                var object = {x: 3},
                    listeners = {
                        listener1: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        },
                        listener2: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener1").andCallThrough();
                spyOn(listeners, "listener2").andCallThrough();

                object.addPropertyChangeListener("x", listeners.listener1);
                object.addPropertyChangeListener("x", listeners.listener2);

                object.x = 4;

                expect(listeners.listener1.callCount).toBe(1);
                expect(listeners.listener2.callCount).toBe(1);
            });

            it("should listen using a single function to two properties", function() {
                var object1 = {x: 3},
                    object2 = {x: 3},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(object1.x).toBe(4);
                                expect(notification.target).toBe(object1);
                                expect(notification.currentTarget).toBe(object1);
                                expect(notification.propertyPath).toBe("x");
                                expect(notification.minus).toBe(3);
                                expect(notification.plus).toBe(4);
                                break;

                                case 2:
                                expect(object2.x).toBe(4);
                                expect(notification.target).toBe(object2);
                                expect(notification.currentTarget).toBe(object2);
                                expect(notification.propertyPath).toBe("x");
                                expect(notification.minus).toBe(3);
                                expect(notification.plus).toBe(4);
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object1.addPropertyChangeListener("x", listeners.listener);
                object2.addPropertyChangeListener("x", listeners.listener);

                object1.x = 4;
                object2.x = 4;

                expect(listeners.listener.callCount).toBe(2);
            });

            it("should listen using handleChange", function() {
                var object = {x: 3},
                    listener = {
                        handleChange: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listener, "handleChange").andCallThrough();

                object.addPropertyChangeListener("x", listener);

                object.x = 4;

                expect(listener.handleChange.callCount).toBe(1);
            });

            it("should listen using handleIdentifierChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleIdentifierChange: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listener, "handleIdentifierChange").andCallThrough();

                object.addPropertyChangeListener("x", listener);

                object.x = 4;

                expect(listener.handleIdentifierChange.callCount).toBe(1);
            });

            it("should listen using handleChange when the object has an identifier but no handleIdentifierChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleChange: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listener, "handleChange").andCallThrough();

                object.addPropertyChangeListener("x", listener);

                object.x = 4;

                expect(listener.handleChange.callCount).toBe(1);
            });

            it("should listen using only handleIdentifierChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleChange: function() {
                        },
                        handleIdentifierChange: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listener, "handleChange").andCallThrough();
                spyOn(listener, "handleIdentifierChange").andCallThrough();

                object.addPropertyChangeListener("x", listener);

                object.x = 4;

                expect(listener.handleChange.callCount).toBe(0);
                expect(listener.handleIdentifierChange.callCount).toBe(1);
            });

            it("should listen on different properties using either handleChange or handleIdentifierChange", function() {
                var object1 = {x: 3, identifier: "identifier"},
                    object2 = {x: 3},
                    listener = {
                        handleChange: function(notification) {
                            expect(object2.x).toBe(4);
                            expect(notification.target).toBe(object2);
                            expect(notification.currentTarget).toBe(object2);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        },
                        handleIdentifierChange: function(notification) {
                            expect(object1.x).toBe(4);
                            expect(notification.target).toBe(object1);
                            expect(notification.currentTarget).toBe(object1);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listener, "handleChange").andCallThrough();
                spyOn(listener, "handleIdentifierChange").andCallThrough();

                object1.addPropertyChangeListener("x", listener);
                object2.addPropertyChangeListener("x", listener);

                object1.x = 4;
                expect(listener.handleChange.callCount).toBe(0);
                expect(listener.handleIdentifierChange.callCount).toBe(1);

                object2.x = 4;
                expect(listener.handleChange.callCount).toBe(1);
                expect(listener.handleIdentifierChange.callCount).toBe(1);
            });

            it("should not trigger function listener on same value changes", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x", listeners.listener);
                object.x = 3;
                expect(listeners.listener.callCount).toBe(0);
            });
        });

        describe("on multiple property path", function() {
            it("should listen using a function", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x.y.z).toBe(4);
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 4;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not trigger function listener on same value changes", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 3;
                expect(listeners.listener.callCount).toBe(0);
            });
        });

        describe("on overlapping paths", function() {
            it("should still listen using a function if the bigger path is removed", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener1: function(notification) {
                        },
                        listener2: function(notification) {
                            expect(object.x.y.z).toBe(4);
                            expect(notification.target).toBe(object.x);
                            expect(notification.currentTarget).toBe(object.x);
                            expect(notification.propertyPath).toBe("y");
                            expect(notification.minus.z).toBe(3);
                            expect(notification.plus.z).toBe(4);
                        }
                    };

                spyOn(listeners, "listener1").andCallThrough();
                spyOn(listeners, "listener2").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener1);
                object.x.addPropertyChangeListener("y", listeners.listener2)
                object.removePropertyChangeListener("x.y.z", listeners.listener1);
                object.x.y = {z: 4};
                expect(listeners.listener1.callCount).toBe(0);
                expect(listeners.listener2.callCount).toBe(1);
            });

            it("should still listen using a function if the smaller path is removed", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener1: function(notification) {
                            expect(object.x.y.z).toBe(4);
                            expect(notification.target).toBe(object.x);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("y");
                            expect(notification.minus.z).toBe(3);
                            expect(notification.plus.z).toBe(4);
                        },
                        listener2: function(notification) {
                        }
                    };

                spyOn(listeners, "listener1").andCallThrough();
                spyOn(listeners, "listener2").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener1);
                object.x.addPropertyChangeListener("y", listeners.listener2)
                object.x.removePropertyChangeListener("y", listeners.listener2);
                object.x.y = {z: 4};
                expect(listeners.listener1.callCount).toBe(1);
                expect(listeners.listener2.callCount).toBe(0);
            });
        });

    });

    describe("calling the listener before the change", function() {
        describe("on a single value property path", function() {
            it("should listen using a function", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x", listeners.listener, true);

                object.x = 4;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should listen to the same property twice using different functions", function() {
                var object = {x: 3},
                    listeners = {
                        listener1: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        },
                        listener2: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener1").andCallThrough();
                spyOn(listeners, "listener2").andCallThrough();

                object.addPropertyChangeListener("x", listeners.listener1, true);
                object.addPropertyChangeListener("x", listeners.listener2, true);

                object.x = 4;

                expect(listeners.listener1.callCount).toBe(1);
                expect(listeners.listener2.callCount).toBe(1);
            });

            it("should listen using a single function to two properties", function() {
                var object1 = {x: 3},
                    object2 = {x: 3},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(object1.x).toBe(3);
                                expect(notification.target).toBe(object1);
                                expect(notification.currentTarget).toBe(object1);
                                expect(notification.propertyPath).toBe("x");
                                expect(notification.minus).toBe(3);
                                break;

                                case 2:
                                expect(object2.x).toBe(3);
                                expect(notification.target).toBe(object2);
                                expect(notification.currentTarget).toBe(object2);
                                expect(notification.propertyPath).toBe("x");
                                expect(notification.minus).toBe(3);
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object1.addPropertyChangeListener("x", listeners.listener, true);
                object2.addPropertyChangeListener("x", listeners.listener, true);

                object1.x = 4;
                object2.x = 4;

                expect(listeners.listener.callCount).toBe(2);
            });

            it("should listen using handleWillChange", function() {
                var object = {x: 3},
                    listener = {
                        handleWillChange: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listener, "handleWillChange").andCallThrough();

                object.addPropertyChangeListener("x", listener, true);

                object.x = 4;

                expect(listener.handleWillChange.callCount).toBe(1);
            });

            it("should listen using handleIdentifierWillChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleIdentifierWillChange: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listener, "handleIdentifierWillChange").andCallThrough();

                object.addPropertyChangeListener("x", listener, true);

                object.x = 4;

                expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            });

            it("should listen using handleWillChange when the object has an identifier but no handleIdentifierWillChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleWillChange: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listener, "handleWillChange").andCallThrough();

                object.addPropertyChangeListener("x", listener, true);

                object.x = 4;

                expect(listener.handleWillChange.callCount).toBe(1);
            });

            it("should listen using only handleIdentifierWillChange", function() {
                var object = {x: 3, identifier: "identifier"},
                    listener = {
                        handleWillChange: function() {
                        },
                        handleIdentifierWillChange: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listener, "handleWillChange").andCallThrough();
                spyOn(listener, "handleIdentifierWillChange").andCallThrough();

                object.addPropertyChangeListener("x", listener, true);

                object.x = 4;

                expect(listener.handleWillChange.callCount).toBe(0);
                expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            });

            it("should listen on different properties using either handleWillChange or handleIdentifierWillChange", function() {
                var object1 = {x: 3, identifier: "identifier"},
                    object2 = {x: 3},
                    listener = {
                        handleWillChange: function(notification) {
                            expect(object2.x).toBe(3);
                            expect(notification.target).toBe(object2);
                            expect(notification.currentTarget).toBe(object2);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        },
                        handleIdentifierWillChange: function(notification) {
                            expect(object1.x).toBe(3);
                            expect(notification.target).toBe(object1);
                            expect(notification.currentTarget).toBe(object1);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listener, "handleWillChange").andCallThrough();
                spyOn(listener, "handleIdentifierWillChange").andCallThrough();

                object1.addPropertyChangeListener("x", listener, true);
                object2.addPropertyChangeListener("x", listener, true);

                object1.x = 4;
                expect(listener.handleWillChange.callCount).toBe(0);
                expect(listener.handleIdentifierWillChange.callCount).toBe(1);

                object2.x = 4;
                expect(listener.handleWillChange.callCount).toBe(1);
                expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            });

            it("should not trigger function listener on same value changes", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener, true);
                object.x = 3;
                expect(listeners.listener.callCount).toBe(0);
            });
        });

        describe("on multiple property path", function() {
            it("should listen on a value property", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x.y.z).toBe(3);
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener, true);

                object.x.y.z = 4;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not trigger function listener on same value changes", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener, true);
                object.x.y.z = 3;
                expect(listeners.listener.callCount).toBe(0);
            });
        });
    });

    describe("calling the listener before and after the change", function() {
        it("should listen using the same function", function() {
            var object = {x: 3},
                calledBefore = false,
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        callCount++;

                        if (calledBefore) {
                            expect(object.x).toBe(4);
                        } else {
                            expect(object.x).toBe(3);
                            calledBefore = true;
                        }
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        if (callCount == 2) {
                            expect(notification.plus).toBe(4);
                        }
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("x", listeners.listener, true);
            object.addPropertyChangeListener("x", listeners.listener);

            object.x = 4;

            expect(listeners.listener.callCount).toBe(2);
        });

        it("should listen to the same property twice using functions", function() {
            var object = {x: 3},
                listeners = {
                    listenerBefore: function(notification) {
                        expect(object.x).toBe(3);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    listener: function(notification) {
                        expect(object.x).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listeners, "listenerBefore").andCallThrough();
            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("x", listeners.listenerBefore, true);
            object.addPropertyChangeListener("x", listeners.listener);

            object.x = 4;

            expect(listeners.listenerBefore.callCount).toBe(1);
            expect(listeners.listener.callCount).toBe(1);
        });

        it("should listen using a single function to two properties", function() {
            var object1 = {x: 3},
                object2 = {x: 3},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            case 2:
                            expect(notification.target).toBe(object1);
                            expect(notification.currentTarget).toBe(object1);
                            break;

                            case 3:
                            case 4:
                            expect(notification.target).toBe(object2);
                            expect(notification.currentTarget).toBe(object2);
                            break;
                        }
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        if (callCount == 2 || callCount == 4) {
                            expect(notification.plus).toBe(4);
                        }
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            object1.addPropertyChangeListener("x", listeners.listener, true);
            object1.addPropertyChangeListener("x", listeners.listener);
            object2.addPropertyChangeListener("x", listeners.listener, true);
            object2.addPropertyChangeListener("x", listeners.listener);

            object1.x = 4;
            object2.x = 4;

            expect(listeners.listener.callCount).toBe(4);
        });

        it("should listen using handleWillChange and handleChange", function() {
            var object = {x: 3},
                listener = {
                    handleWillChange: function(notification) {
                        expect(object.x).toBe(3);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleChange: function(notification) {
                        expect(object.x).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listener, "handleWillChange").andCallThrough();
            spyOn(listener, "handleChange").andCallThrough();

            object.addPropertyChangeListener("x", listener, true);
            object.addPropertyChangeListener("x", listener);

            object.x = 4;

            expect(listener.handleWillChange.callCount).toBe(1);
            expect(listener.handleChange.callCount).toBe(1);
        });

        it("should listen using handleIdentifierWillChange and handleIdentifierChange", function() {
            var object = {x: 3, identifier: "identifier"},
                listener = {
                    handleIdentifierWillChange: function(notification) {
                        expect(object.x).toBe(3);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleIdentifierChange: function(notification) {
                        expect(object.x).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listener, "handleIdentifierWillChange").andCallThrough();
            spyOn(listener, "handleIdentifierChange").andCallThrough();

            object.addPropertyChangeListener("x", listener, true);
            object.addPropertyChangeListener("x", listener);

            object.x = 4;

            expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            expect(listener.handleIdentifierChange.callCount).toBe(1);
        });

        it("should listen using handle(Will)Change when the object has an identifier but no handleIdentifier(Will)Change", function() {
            var object = {x: 3, identifier: "identifier"},
                listener = {
                    handleWillChange: function(notification) {
                        expect(object.x).toBe(3);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleChange: function(notification) {
                        expect(object.x).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listener, "handleWillChange").andCallThrough();
            spyOn(listener, "handleChange").andCallThrough();

            object.addPropertyChangeListener("x", listener, true);
            object.addPropertyChangeListener("x", listener);

            object.x = 4;

            expect(listener.handleWillChange.callCount).toBe(1);
            expect(listener.handleChange.callCount).toBe(1);
        });

        it("should listen using only handleIdentifierWillChange and handleIdentifierChange", function() {
            var object = {x: 3, identifier: "identifier"},
                listener = {
                    handleWillChange: function() {
                    },
                    handleIdentifierWillChange: function(notification) {
                        expect(object.x).toBe(3);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleChange: function() {
                    },
                    handleIdentifierChange: function(notification) {
                        expect(object.x).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listener, "handleWillChange").andCallThrough();
            spyOn(listener, "handleIdentifierWillChange").andCallThrough();
            spyOn(listener, "handleChange").andCallThrough();
            spyOn(listener, "handleIdentifierChange").andCallThrough();

            object.addPropertyChangeListener("x", listener, true);
            object.addPropertyChangeListener("x", listener);

            object.x = 4;

            expect(listener.handleWillChange.callCount).toBe(0);
            expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            expect(listener.handleChange.callCount).toBe(0);
            expect(listener.handleIdentifierChange.callCount).toBe(1);
        });

        it("should listen on different properties using either handle(Will)Change or handleIdentifier(Will)Change", function() {
            var object1 = {x: 3, identifier: "identifier"},
                object2 = {x: 3},
                listener = {
                    handleWillChange: function(notification) {
                        expect(object2.x).toBe(3);
                        expect(notification.target).toBe(object2);
                        expect(notification.currentTarget).toBe(object2);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleIdentifierWillChange: function(notification) {
                        expect(object1.x).toBe(3);
                        expect(notification.target).toBe(object1);
                        expect(notification.currentTarget).toBe(object1);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                    },
                    handleChange: function(notification) {
                        expect(object2.x).toBe(4);
                        expect(notification.target).toBe(object2);
                        expect(notification.currentTarget).toBe(object2);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    },
                    handleIdentifierChange: function(notification) {
                        expect(object1.x).toBe(4);
                        expect(notification.target).toBe(object1);
                        expect(notification.currentTarget).toBe(object1);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listener, "handleWillChange").andCallThrough();
            spyOn(listener, "handleIdentifierWillChange").andCallThrough();
            spyOn(listener, "handleChange").andCallThrough();
            spyOn(listener, "handleIdentifierChange").andCallThrough();

            object1.addPropertyChangeListener("x", listener, true);
            object1.addPropertyChangeListener("x", listener);
            object2.addPropertyChangeListener("x", listener, true);
            object2.addPropertyChangeListener("x", listener);

            object1.x = 4;
            object2.x = 4;

            expect(listener.handleWillChange.callCount).toBe(1);
            expect(listener.handleIdentifierWillChange.callCount).toBe(1);
            expect(listener.handleChange.callCount).toBe(1);
            expect(listener.handleIdentifierChange.callCount).toBe(1);
        });

        describe("on multiple property path", function() {
            it("should listen on a value property", function() {
                var object = {x: {y: {z: 3}}},
                    calledBefore = false,
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            if (calledBefore) {
                                expect(object.x.y.z).toBe(4);

                            } else {
                                expect(object.x.y.z).toBe(3);
                                calledBefore = true;
                            }
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                            if (callCount == 2) {
                                expect(notification.plus).toBe(4);
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.z", listeners.listener, true);
                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 4;
                expect(listeners.listener.callCount).toBe(2);
            });
        });
    });

    describe("listening on mutations", function() {
        describe("after changes", function() {
            it("should listen to mutations of an array", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.target).toBe(array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener(null, listeners.listener);
                array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should stop listening to mutations of an array", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.target).toBe(array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener(null, listeners.listener);
                array.removePropertyChangeListener(null, listeners.listener);
                array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });

            it("should listen to mutations of a value at a direct property name", function() {
                var object1 = {done: false},
                    array = [object1, {done: false}, {done: false}],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.target).toBe(object1);
                            expect(notification.isMutation).toBe(false);
                            expect(notification.minus).toBe(false);
                            expect(notification.plus).toBe(true);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("done", listeners.listener, false, false);
                object1.done = true;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should listen to mutations of a value at a property path", function() {
                var object = {"array": [1, 2, 3]},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.target).toBe(object.array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener, false, false);
                object.array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not listen to mutation of a value at a property path if we use ignore mutations parameter", function() {
                var object = {"array": [1, 2, 3]},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array", listeners.listener, false, true);
                object.array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });

            it("should listen to mutations of a value at a multiple property path", function() {
                var object = {x: {y: {array: [1, 2, 3]}}},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.target).toBe(object.x.y.array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.array", listeners.listener, false, false);
                object.x.y.array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not listen to mutations of a value at a multiple property path", function() {
                var object = {x: {y: {array: [1, 2, 3]}}},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.array", listeners.listener, false, true);
                object.x.y.array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });

            it("should not trigger a mutation notification to listeners that don't listen to mutations", function() {
                var object = {array: [{foo: 1}]},
                    listeners = {
                        listener1: function(notification) {
                        },
                        listener2: function(notification) {
                        }
                    };

                spyOn(listeners, "listener1").andCallThrough();
                spyOn(listeners, "listener2").andCallThrough();
                object.addPropertyChangeListener("array.0.foo", listeners.listener1);
                object.addPropertyChangeListener("array", listeners.listener2);
                object.array.push({foo: 2});
                expect(listeners.listener1.callCount).toBe(0);
                expect(listeners.listener2.callCount).toBe(1);
            });
        });

        describe("before changes", function() {
            it("should listen to mutations of an array", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.target).toBe(array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener(null, listeners.listener, true);
                array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should stop listening to mutations of an array", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener(null, listeners.listener, true);
                array.removePropertyChangeListener(null, listeners.listener, true);
                array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });

            it("should listen to mutations of a value at a property path", function() {
                var object = {"array": [1, 2, 3]},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.target).toBe(object.array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener, true, false);
                object.array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not listen to mutation of a value at a property path", function() {
                var object = {"array": [1, 2, 3]},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array", listeners.listener, true, true);
                object.array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });

            it("should listen to mutations of a value at a multiple property path", function() {
                var object = {x: {y: {array: [1, 2, 3]}}},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.target).toBe(object.x.y.array);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("x.y.array", listeners.listener, true, false);
                object.x.y.array.push(4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not listen to mutations of a value at a multiple property path", function() {
                var object = {x: {y: {array: [1, 2, 3]}}},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.array", listeners.listener, true, true);
                object.x.y.array.push(4);
                expect(listeners.listener.callCount).toBe(0);
            });
        })
    });

    describe("removing listeners", function() {
        describe("on single property path", function() {
            it("should remove a function listener", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x", listeners.listener);
                object.removePropertyChangeListener("x", listeners.listener);
                object.x = 4;

                expect(listeners.listener.callCount).toBe(0);
            });

            it("should remove a function listener and continue setting the value after removal", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x", listeners.listener);
                object.removePropertyChangeListener("x", listeners.listener);
                object.x = 4;

                expect(object.x).toBe(4);
            });

            it("should remove a function listener after being triggered", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x", listeners.listener);
                object.x = 4;
                object.removePropertyChangeListener("x", listeners.listener);
                object.x = 5;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should remove a function listener only from beforeChanges", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x", listeners.listener);
                object.addPropertyChangeListener("x", listeners.listener, true);
                object.removePropertyChangeListener("x", listeners.listener, true);
                object.x = 4;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should remove a function listener only from afterChanges", function() {
                var object = {x: 3},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x).toBe(3);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x", listeners.listener);
                object.addPropertyChangeListener("x", listeners.listener, true);
                object.removePropertyChangeListener("x", listeners.listener);
                object.x = 4;

                expect(listeners.listener.callCount).toBe(1);
            });
        });

        describe("on multiple property path", function() {
            it("should remove a function listener", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function() {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.removePropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 4;

                expect(listeners.listener.callCount).toBe(0);
            });

            it("should remove a function listener after being triggered", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x.y.z).toBe(4);
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 4;
                object.removePropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 5;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should remove a function listener only from beforeChanges", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x.y.z).toBe(4);
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.addPropertyChangeListener("x.y.z", listeners.listener, true);
                object.removePropertyChangeListener("x.y.z", listeners.listener, true);
                object.x.y.z = 4;

                expect(listeners.listener.callCount).toBe(1);
            });

            it("should remove a function listener only from afterChanges", function() {
                var object = {x: {y: {z: 3}}},
                    listeners = {
                        listener: function(notification) {
                            expect(object.x.y.z).toBe(3);
                            expect(notification.target).toBe(object.x.y);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("z");
                            expect(notification.minus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("x.y.z", listeners.listener);
                object.addPropertyChangeListener("x.y.z", listeners.listener, true);
                object.removePropertyChangeListener("x.y.z", listeners.listener);
                object.x.y.z = 4;

                expect(listeners.listener.callCount).toBe(1);
            });
        });
    });

    describe("changing values in multiple property path", function() {
        it("should trigger when changing the new value", function() {
            var x = {y: 3},
                object = {x: x},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(object.x.y).toBe(4);
                            expect(notification.minus.y).toBe(3);
                            expect(notification.plus.y).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            break;

                            case 2:
                            expect(object.x.y).toBe(5);
                            expect(notification.minus).toBe(4);
                            expect(notification.plus).toBe(5);
                            break;
                        }

                        expect(notification.currentTarget).toBe(object);
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("x.y", listeners.listener);
            object.x = {y: 4};
            object.x.y = 5;

            expect(listeners.listener.callCount).toBe(2);
        });

        it("must not trigger when changing the old value", function() {
            var x = {y: 3},
                object = {x: x},
                listeners = {
                    listener: function(notification) {
                        expect(object.x.y).toBe(4);
                        expect(notification.target).toBe(object);
                        expect(notification.currentTarget).toBe(object);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus.y).toBe(3);
                        expect(notification.plus.y).toBe(4);
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("x.y", listeners.listener);
            object.x = {y: 4};
            x.y = 5;
            expect(listeners.listener.callCount).toBe(1);
        });

        it("should trigger listeners of the same object through different property paths", function() {
            var x = {y: {z: 3}},
                object1 = {a: x},
                object2 = {b: x},
                listeners = {
                    listener1: function(notification) {
                        expect(object1.a.y.z).toBe(4);
                        expect(notification.target).toBe(x.y);
                        expect(notification.currentTarget).toBe(object1);
                        expect(notification.propertyPath).toBe("z");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    },
                    listener2: function(notification) {
                        expect(object2.b.y.z).toBe(4);
                        expect(notification.target).toBe(x.y);
                        expect(notification.currentTarget).toBe(object2);
                        expect(notification.propertyPath).toBe("z");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    }
                };

            spyOn(listeners, "listener1").andCallThrough();
            spyOn(listeners, "listener2").andCallThrough();

            object1.addPropertyChangeListener("a.y.z", listeners.listener1);
            object2.addPropertyChangeListener("b.y.z", listeners.listener2);
            x.y.z = 4;
            expect(listeners.listener1.callCount).toBe(1);
            expect(listeners.listener2.callCount).toBe(1);
        });

        it("should still trigger a listener when two descriptors are installed and one is removed", function() {
            var a = {
                    b: {c: 3},
                    z: 3
                },
                object1 = {a: a},
                object2 = {x: {a: a}},
                listeners = {
                    listener1: function(notification) {
                        expect(object1.a.b.c).toBe(4);
                        expect(notification.target).toBe(a.b);
                        expect(notification.currentTarget).toBe(object1);
                        expect(notification.propertyPath).toBe("c");
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(4);
                    },
                    listener2: function(notification) {
                        expect(object2.x.a.z).toBe(4);
                        expect(notification.target).toBe(object2);
                        expect(notification.currentTarget).toBe(object2);
                        expect(notification.propertyPath).toBe("x");
                        expect(notification.minus.a.z).toBe(3);
                        expect(notification.plus.a.z).toBe(4);
                    }
                };

            spyOn(listeners, "listener1").andCallThrough();
            spyOn(listeners, "listener2").andCallThrough();

            object1.addPropertyChangeListener("a.b.c", listeners.listener1);
            object2.addPropertyChangeListener("x.a.z", listeners.listener2);

            object2.x = {a: {z: 4}};
            object1.a.b.c = 4;

            expect(listeners.listener1.callCount).toBe(1);
            expect(listeners.listener2.callCount).toBe(1);
        });

        it("should call a change listener observing a property that was null, but was eventually replaced with something not-null", function() {
            var object = {},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(notification.minus).toBe(null);
                            expect(notification.plus).toBe("bar");
                            break;

                            case 2:
                            expect(notification.minus).toBe("bar");
                            expect(notification.plus).toBe(null);
                            break;

                            case 3:
                            expect(notification.minus).toBe(null);
                            expect(notification.plus).toBe("baz");
                            break;
                        }
                        expect(notification.target).toBe(object);
                        expect(notification.propertyPath).toBe("foo");
                        expect(notification.currentTarget).toBe(object);
                    }
                };

            object.foo = null;

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("foo", listeners.listener);

            object.foo = "bar";
            object.foo = null;
            object.foo = "baz";

            expect(listeners.listener.callCount).toBe(3);
        });

        it("should call a change listener observing a deep propertyPath where some component along the path was null, but was eventually replaced with something not-null", function() {
            var object = {},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(notification.target).toBe(object);
                            expect(notification.propertyPath).toBe("foo");
                            expect(notification.minus).toBe(null);
                            expect(notification.plus).toBe(object.foo);
                            break;

                            case 2:
                            expect(notification.target).toBe(object.foo);
                            expect(notification.propertyPath).toBe("bar");
                            expect(notification.minus).toBeUndefined();
                            expect(notification.plus).toBe(object.foo.bar);
                            break;

                            case 3:
                            expect(notification.target).toBe(object.foo.bar);
                            expect(notification.propertyPath).toBe("baz");
                            expect(notification.minus).toBeUndefined();
                            expect(notification.plus).toBe("baz");
                            break;

                            case 4:
                            expect(notification.target).toBe(object.foo.bar);
                            expect(notification.propertyPath).toBe("baz");
                            expect(notification.minus).toBe("baz");
                            expect(notification.plus).toBe(42);
                            break;
                        }
                        expect(notification.currentTarget).toBe(object);
                    }
                };

            object.foo = null;

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("foo.bar.baz", listeners.listener);

            object.foo = {};
            object.foo.bar = {};
            object.foo.bar.baz = "baz";
            object.foo.bar.baz = 42;

            expect(listeners.listener.callCount).toBe(4);
        });

        it("should trigger when changing the new value", function() {
            var x = {y: 3},
                object = {x: x},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(object.x.y).toBe(4);
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus.y).toBe(3);
                            expect(notification.plus.y).toBe(4);
                            break;

                            case 2:
                            expect(object.x.y).toBe(5);
                            expect(notification.target).toBe(object.x);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("y");
                            expect(notification.minus).toBe(4);
                            expect(notification.plus).toBe(5);
                            break;
                        }
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("x.y", listeners.listener);
            object.x = {y: 4};
            object.x.y = 5;

            expect(listeners.listener.callCount).toBe(2);
        });

    });

    describe("setter/getter properties", function() {
        it("should use any custom setter when setting the value of an observed property", function() {
            var MeaningfulObject = Montage.create(Montage, {
                _foo: {
                    enumerable: false,
                    value: null
                },

                foo: {
                    enumerable: false,
                    set: function(value) {
                        this._foo = Math.min(42, value);
                    },
                    get: function() {
                        return this._foo;
                    }
                }
            });

            var object = MeaningfulObject.create();

            var listeners = {
                listener: function(notification) {
                    expect(notification.target).toBe(object);
                    expect(notification.currentTarget).toBe(object);
                    expect(notification.propertyPath).toBe("foo");
                    expect(notification.minus).toBe(null);
                    expect(notification.plus).toBe(42);
                }
            };
            spyOn(listeners, "listener").andCallThrough();

            object.addPropertyChangeListener("foo", listeners.listener);
            object.foo = 1000;

            expect(object.foo).toBe(42);
            expect(listeners.listener).toHaveBeenCalled();
        });

        it("should preserve the enumerable attribute of properties it listens to", function() {
            var object = {
                enumerable: 2
            };
            Montage.defineProperty(object, "notEnumerable", {enumerable: false, value: 2});

            object.addPropertyChangeListener("enumerable", function(){});
            object.addPropertyChangeListener("notEnumerable", function(){});

            expect(Object.getOwnPropertyDescriptor(object, "enumerable").enumerable).toBe(true);
            expect(Object.getOwnPropertyDescriptor(object, "notEnumerable").enumerable).toBe(false);
        });

        it("should remove a function listener and continue calling the original setter after removal", function() {
            var setters = {
                 setter: function(value) {
                     this._foo = value;
                 }
             };

            var MeaningfulObject = Montage.create(Montage, {
                _foo: {
                    value: "same"
                },

                foo: {
                    set: setters.setter,
                    get: function() {
                        return this._foo;
                    }
                }
            });
            var object = MeaningfulObject.create();

            spyOn(setters, "setter").andCallThrough();
            object.addPropertyChangeListener("x", function(notification) {});
            object.removePropertyChangeListener("x", function(notification) {});
            object.foo = "new";

            expect(object.foo).toEqual("new");
        });

        it("should always call the original setter", function() {

            var setterCalled = false;

            var MeaningfulObject = Montage.create(Montage, {
                _foo: {
                    value: "same"
                },

                foo: {
                    set: function(value) {
                        setterCalled = true;
                        this._foo = value;
                    },
                    get: function() {
                        return this._foo;
                    }
                }
            });
            var object = MeaningfulObject.create();

            object.addPropertyChangeListener("x", function(notification) {});
            object.foo = "same";

            expect(setterCalled).toBeTruthy();
         });

    });

    describe("listener cycles", function() {
        it("should not create an infinite loop on a direct cycle", function() {
            var object = {x: 0},
                listeners = {
                    listener: function(notification) {
                        object.x = object.x + 1;
                    }
                };

            object.addPropertyChangeListener("x", listeners.listener);
            try {
                object.x = 1;
            } catch(ex) {
                expect(true).toBe(false);
            }
        });

        it("should not create an infinite loop on a two state cycle", function() {
            var object = {x: 0, y: 0},
                listeners = {
                    listenerX: function(notification) {
                        object.y = object.x + 1;
                    },
                    listenerY: function(notification) {
                        object.x = object.y + 1;
                    }
                };

            object.addPropertyChangeListener("x", listeners.listenerX);
            object.addPropertyChangeListener("y", listeners.listenerY);
            try {
                object.x = 1;
            } catch(ex) {
                expect(true).toBe(false);
            }
        });

        it("should not create an infinite loop on a cycle involving dependencies", function() {
            var object = {x: {y: {z: 0}}},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        if (++callCount == 1) {
                            object.x.y = {z: 0};
                        } else {
                            object.x.y.z = object.x.y.z + 1;
                        }
                    }
                };

            object.addPropertyChangeListener("x.y.z", listeners.listener);
            try {
                object.x.y.z = 1;
            } catch(ex) {
                expect(true).toBe(false);
            }
        });

        it("should not create an infinite loop on a cycle with user setters involving dependencies", function() {
            var MeaningfulObject = Montage.create(Montage, {
                _foo: {
                    enumerable: false,
                    value: null
                },

                foo: {
                    enumerable: false,
                    set: function(value) {
                        this._foo = value;
                    },
                    get: function() {
                        return this._foo;
                    }
                }
            });

            var object = MeaningfulObject.create(),
                listeners = {
                    listener: function(notification) {
                        object.foo = object.foo + 1;
                    }
                };

            object.addPropertyChangeListener("foo", listeners.listener);
            try {
                object.foo = 1;
            } catch(ex) {
                expect(true).toBe(false);
            }
        });

        it("should throw a stack error on a cycle created by user setters", function() {
            var MeaningfulObject = Montage.create(Montage, {
                _foo: {
                    enumerable: false,
                    value: null
                },

                foo: {
                    enumerable: false,
                    set: function(value) {
                        this.foo = value + 1;
                    },
                    get: function() {
                        return this._foo;
                    }
                }
            });

            var object = MeaningfulObject.create(),
                listeners = {
                    listener: function(notification) {
                    }
                };

            object.addPropertyChangeListener("foo", listeners.listener);
            try {
                object.foo = 1;
                expect(true).toBe(false);
            } catch(ex) {
                expect(ex.type).toBe("stack_overflow");
            }
        });

        it("should not create an infinite loop on a cycle with direct property dependencies", function() {
            var MeaningfulObject = Montage.create(Montage, {
                    foo: {
                        dependencies: ["bar"],
                        value: null
                    },

                    bar: {
                        dependencies: ["foo"],
                        value: null
                    }
                });

            var object = MeaningfulObject.create(),
                listeners = {
                    listener: function(notification) {
                    }
                };

            object.addPropertyChangeListener("foo", listeners.listener);
            object.foo = 1;
            expect(true).toBe(true);
        });

        it("should not create an infinite loop on a cycle with indirect property dependencies", function() {
            var MeaningfulObject = Montage.create(Montage, {
                    foo: {
                        dependencies: ["bar"],
                        value: null
                    },

                    bar: {
                        dependencies: ["foo", "baz"],
                        value: null
                    },

                    baz: {
                        value: null
                    }
                });

            var object = MeaningfulObject.create(),
                listeners = {
                    listener: function(notification) {
                    }
                };

            object.addPropertyChangeListener("foo", listeners.listener);
            object.baz = 1;
            expect(true).toBe(true);
        });

        it("should not create an infinite loop on a cycle created by manually dispatching a property change in a changeProperty listener that is triggered by that dispatch", function() {
            var MeaningfulObject = Montage.create(Montage, {
                    _foo: {value: 2},
                    foo: {
                        get: function() {
                            return this._foo;
                        },
                        set: function(value) {
                            this._foo = value;
                            this.dispatchPropertyChange("bar", function() {
                                this.bar = null;
                            });
                        }
                    },

                    bar: {value: null}
                });

            var object = MeaningfulObject.create(),
                listeners = {
                    listener: function(notification) {
                        object.foo = 1;
                    }
                };

            object.addPropertyChangeListener("bar", listeners.listener);
            object.foo = 1;
            expect(true).toBe(true);
        });
    });

    describe("calling listeners on arrays", function() {
        describe("when listening to a specific index", function() {
            it("should listen on array element", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(2);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(2);
                            expect(notification.index).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();

                array.setProperty("0", 2)
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger index listener on array splice", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[1]).toBe(4);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("1");
                            expect(notification.minus).toBe(2);
                            expect(notification.plus).toBe(4);
                            expect(notification.index).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                array.addPropertyChangeListener("1", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();
                array.splice(1, 1, 4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger index listener on array shift", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(2);
                            expect(array[1]).toBe(3);
                            expect(array[2]).toBeUndefined();
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(2);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();
                array.shift();
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger index listener on array unshift", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(-1);
                            expect(array[1]).toBe(0);
                            expect(array[2]).toBe(1);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(-1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();
                array.unshift(-1, 0);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger index listener on array push", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(1);
                            expect(array[1]).toBe(2);
                            expect(array[2]).toBe(3);
                            expect(array[3]).toBe(4);
                            expect(array[4]).toBe(5);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("3");
                            expect(notification.minus).toBeUndefined();
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("3", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();
                array.push(4, 5);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger index listener on array pop", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(1);
                            expect(array[1]).toBe(2);
                            expect(array[2]).toBeUndefined();
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("2");
                            expect(notification.minus).toBe(3);
                            expect(notification.plus).toBeUndefined();
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("2", listeners.listener);
                expect(array.isDispatchingArray).toBeTruthy();
                array.pop();
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not trigger index listener on same value changes", function() {
                var array = [1, 2, 3],
                    listeners = {
                        listener: function(notification) {
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("2", listeners.listener);
                array.setProperty(1, 2);
                expect(listeners.listener.callCount).toBe(0);
            });
        });

        describe("when listening to an array", function() {
            it("should trigger listener on array element change", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(1);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0]).toBe(2);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array", listeners.listener);
                array.setProperty(0, 2);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener on array splice", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(1);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(2);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0]).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array", listeners.listener);
                array.splice(1, 1, 4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener on array shift", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(1);
                            expect(notification.plus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.shift();
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener on array unshift", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(2);
                            expect(notification.plus[0]).toBe(-1);
                            expect(notification.plus[1]).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.unshift(-1, 0);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener on array push", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(3);
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(2);
                            expect(notification.plus[0]).toBe(4);
                            expect(notification.plus[1]).toBe(5);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.push(4, 5);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener on array pop", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(2);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(3);
                            expect(notification.plus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.pop();
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should report a value change at an array index on a shift", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(1);
                            expect(notification.plus.length).toBe(0);
                        },
                        listener0: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.isMutation).toBeFalsy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(2);
                        },
                        listener1: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("1");
                            expect(notification.isMutation).toBeFalsy();
                            expect(notification.index).toBe(1);
                            expect(notification.minus).toBe(2);
                            expect(notification.plus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                spyOn(listeners, "listener0").andCallThrough();
                spyOn(listeners, "listener1").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.addPropertyChangeListener("0", listeners.listener0);
                array.addPropertyChangeListener("1", listeners.listener1);
                array.shift();
                expect(listeners.listener.callCount).toBe(1);
                expect(listeners.listener0.callCount).toBe(1);
                expect(listeners.listener1.callCount).toBe(1);
            });

            it("should report a value change at an array index on a splice", function() {
                var array = [1, 2, 3],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe(null);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(1);
                            expect(notification.plus.length).toBe(0);
                        },
                        listener0: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.isMutation).toBeFalsy();
                            expect(notification.index).toBe(0);
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(2);
                        },
                        listener1: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("1");
                            expect(notification.isMutation).toBeFalsy();
                            expect(notification.index).toBe(1);
                            expect(notification.minus).toBe(2);
                            expect(notification.plus).toBe(3);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                spyOn(listeners, "listener0").andCallThrough();
                spyOn(listeners, "listener1").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.addPropertyChangeListener("0", listeners.listener0);
                array.addPropertyChangeListener("1", listeners.listener1);
                array.splice(0, 1);
                expect(listeners.listener.callCount).toBe(1);
                expect(listeners.listener0.callCount).toBe(1);
                expect(listeners.listener1.callCount).toBe(1);
            });

            it("should not trigger listener on old array value mutation", function() {
                var array = [1, 2, 3],
                    newArray = [4, 5, 6],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(object);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("array");
                            expect(notification.isMutation).toBeFalsy();
                            expect(notification.minus).toBe(array);
                            expect(notification.plus).toBe(newArray);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array", listeners.listener);
                object.array = newArray;
                array.shift(0);
                expect(listeners.listener.callCount).toBe(1);
            });

        });

        describe("when listening on nested arrays", function() {

            it("should trigger listener when inner array is changed", function() {
                var array = [[1], [2], [3]],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0][0]).toBe(4);
                            expect(notification.target).toBe(array[0]);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                array.addPropertyChangeListener("0.0", listeners.listener);
                array[0].setProperty(0, 4);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener when outer array is changed", function() {
                var array = [[1], [2], [3]],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0][0]).toBe(4);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(1);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0]).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                array.addPropertyChangeListener("0.0", listeners.listener);
                array.setProperty(0, [4]);
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener when inner array properties are changed", function() {
                var array = [[{x: 1}], [{x: 2}], [{x: 3}]],
                    listeners = {
                        listener: function(notification) {
                            expect(array[0][0].x).toBe(4);
                            expect(notification.target).toBe(array[0][0]);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("x");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBe(4);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0.0.x", listeners.listener);
                array[0][0].x = 4;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not trigger listener when changing nested property in removed value", function() {
                var a00,
                    array = [[a00={x: 1}], [{x: 2}], [{x: 3}]],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0].x).toBe(1);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0].x).toBe(2);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0.0.x", listeners.listener);
                array.shift();
                a00.x = 4;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should not trigger listener when changing removed value", function() {
                var a00,
                    array = [[a00={x: 1}], [{x: 2}], [{x: 3}]],
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array[0]);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus.x).toBe(1);
                            expect(notification.plus).toBeUndefined();
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0.0.x", listeners.listener);
                array[0].pop();
                a00.x = 4;
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should trigger listener when changing new value", function() {
                var a00 = {x: 4},
                    array = [[{x: 1}], [{x: 2}], [{x: 3}]],
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array[0]);
                                expect(notification.currentTarget).toBe(array);
                                expect(notification.propertyPath).toBe("0");
                                expect(notification.minus.x).toBe(1);
                                expect(notification.plus.x).toBe(4);
                                break;

                                case 2:
                                expect(notification.target).toBe(a00);
                                expect(notification.currentTarget).toBe(array);
                                expect(notification.propertyPath).toBe("x");
                                expect(notification.minus).toBe(4);
                                expect(notification.plus).toBe(5);
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                array.addPropertyChangeListener("0.0.x", listeners.listener);
                array[0].splice(0, 1, a00);
                a00.x = 5;
                expect(listeners.listener.callCount).toBe(2);
            });
        });

        describe("adding members to an already observed array", function() {
            it("should start observing added members of an initially empty array", function() {
                var array = [],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(array[0]).toBe(0);
                            expect(array[1]).toBe(1);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(2);
                            expect(notification.plus[0]).toBe(0);
                            expect(notification.plus[1]).toBe(1);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();

                object.addPropertyChangeListener("array", listeners.listener);
                array.push(0, 1);
                expect(listeners.listener.callCount).toBe(1);
            });
        });

        it("should call a change listener targgeting an array position, that was created before that position existed, when the target is created", function() {
            var array = [],
                callCount = 0,
                listeners = {
                    listener0: function(notification) {
                        expect(array[0].length).toBe(1);
                        expect(array[0][0]).toBe(1);
                        expect(notification.target).toBe(array[0]);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.isMutation).toBeTruthy();
                        expect(notification.index).toBe(1);
                        expect(notification.minus.length).toBe(1);
                        expect(notification.minus[0]).toBe(2);
                        expect(notification.plus.length).toBe(0);
                    },
                    listener1: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(array[1].length).toBe(2);
                            expect(array[1][0]).toBe(3);
                            expect(array[1][1]).toBe(4);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("1");
                            expect(notification.minus).toBeUndefined();
                            expect(notification.plus.length).toBe(2);
                            expect(notification.plus[0]).toBe(3);
                            expect(notification.plus[1]).toBe(4);
                            break;

                            case 2:
                            expect(array[1].length).toBe(1);
                            expect(array[1][0]).toBe(3);
                            expect(notification.target).toBe(array[1]);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.index).toBe(1);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(4);
                            expect(notification.plus.length).toBe(0);
                            break;
                        }
                    }
                };

            spyOn(listeners, "listener0").andCallThrough();
            spyOn(listeners, "listener1").andCallThrough();

            array.push([1, 2]);

            array.addPropertyChangeListener("0", listeners.listener0);
            array.addPropertyChangeListener("1", listeners.listener1);

            array.push([3, 4]);
            array[0].pop();
            array[1].pop();

            expect(listeners.listener0.callCount).toBe(1); // called on array[0].pop()
            expect(listeners.listener1.callCount).toBe(2); // called on array.push(...) and array[1].pop()
        });

        it("should call a change event listener on an array position when that position is changed via setProperty", function() {
            var oldElement = [1, 2],
                array = [
                    oldElement
                ],
                newElement = [2, 3],
                listeners = {
                    listener: function(notification) {
                        expect(array[0]).toBe(newElement);
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe("0");
                        expect(notification.minus).toBe(oldElement);
                        expect(notification.plus).toBe(newElement);
                    }
                };

            spyOn(listeners, "listener").andCallThrough();

            array.addPropertyChangeListener("0", listeners.listener);
            array.setProperty(0, newElement);
            expect(listeners.listener.callCount).toBe(1);
        });

        it("should stop observing non-existent array elements when inside another array", function() {
            var array = [
                    [0],
                    [1]
                ],
                callCount = 0,
                listeners = {
                    listener0: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(array[0][0]).toBe(1);
                            expect(array.length).toBe(1);
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus.length).toBe(1);
                            expect(notification.minus[0]).toBe(0);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0]).toBe(1);
                            break;

                            case 2:
                            expect(array[0].length).toBe(0);
                            expect(notification.target).toBe(array[0]);
                            expect(notification.currentTarget).toBe(array);
                            expect(notification.propertyPath).toBe("0");
                            expect(notification.minus).toBe(1);
                            expect(notification.plus).toBeUndefined();
                            break;
                        }
                    },
                    listener1: function(notification) {
                        expect(array[0][0]).toBe(1);
                        expect(array.length).toBe(1);
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe("1");
                        expect(notification.minus.length).toBe(1);
                        expect(notification.minus[0]).toBe(1);
                        expect(notification.plus).toBeUndefined();
                    }
                };

            spyOn(listeners, "listener0").andCallThrough();
            spyOn(listeners, "listener1").andCallThrough();

            array.addPropertyChangeListener("0.0", listeners.listener0);
            array.addPropertyChangeListener("1.0", listeners.listener1);
            array.shift();
            array[0].pop();

            expect(listeners.listener0.callCount).toBe(2); // called on array.shift() and array[0].pop()
            expect(listeners.listener1.callCount).toBe(1); // called on array.shift()
        });

        it("should observe multi-dimensional property paths", function() {
            var object = {array: [
                    {foo: [
                        {bar: 11},
                        {bar: 12},
                        {bar: 13}
                    ]},
                    {foo: [
                        {bar: 21},
                        {bar: 22},
                        {bar: 23}
                    ]},
                    {foo: [
                        {bar: 31},
                        {bar: 32},
                        {bar: 33}
                    ]}
                ]},
                callCount = 0,
                listeners = {
                    listener: function(notification) {
                        switch (++callCount) {
                            case 1:
                            expect(notification.target).toBe(object.array[1].foo[1]);
                            expect(notification.propertyPath).toBe("bar");
                            expect(notification.minus).toBe(22);
                            expect(notification.plus).toBe(221);
                            break;

                            case 2:
                            expect(notification.target).toBe(object.array[2].foo);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0].bar).toBe(34);
                            break;

                            case 3:
                            expect(notification.target).toBe(object.array);
                            expect(notification.isMutation).toBeTruthy();
                            expect(notification.minus.length).toBe(0);
                            expect(notification.plus.length).toBe(1);
                            expect(notification.plus[0].foo.length).toBe(3);
                            break;
                        }

                        expect(notification.currentTarget).toBe(object);
                    }
                };

            spyOn(listeners, "listener").andCallThrough();
            object.addPropertyChangeListener("array.foo.bar", listeners.listener);

            object.array[1].foo[1].bar = 221;
            expect(listeners.listener.callCount).toBe(1);

            object.array[2].foo.push({bar: 34});
            expect(listeners.listener.callCount).toBe(2);

            object.array.push({foo: [
                {bar: 41}, {bar: 42}, {bar: 43}
            ]});
            expect(listeners.listener.callCount).toBe(3);
        });

        describe("indexing by property name", function() {
            it("should observe all existing members of an array for changes at the property path beyond the array itself", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    array = [first, second],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(first);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.propertyPath).toBe("foo");
                            expect(notification.minus).toBe("hello");
                            expect(notification.plus).toBe("goodbye");
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);
                first.foo = "goodbye";
                expect(listeners.listener.callCount).toBe(1);
            });

            it("must stop observing removed members of an array for changes at the property path beyond the array itself", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    array = [first, second],
                    object = {array: array},
                    listeners = {
                        listener: function(notification) {
                            expect(notification.target).toBe(array);
                            expect(notification.currentTarget).toBe(object);
                            expect(notification.index).toBe(1);
                            expect(notification.isMutation).toBe(true);
                            expect(notification.minus.length).toBe(1);
                            expect(notification.plus.length).toBe(0);
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);
                array.pop();
                second.foo = "earth";
                expect(listeners.listener.callCount).toBe(1);
            });

            it("should continue observing remaining members of an array for changes at the property path beyond the array itself after some members are removed", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    array = [first, second],
                    object = {array: array},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.index).toBe(1);
                                expect(notification.isMutation).toBe(true);
                                expect(notification.minus.length).toBe(1);
                                expect(notification.plus.length).toBe(0);
                                break;

                                case 2:
                                expect(notification.target).toBe(first);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.propertyPath).toBe("foo");
                                expect(notification.minus).toBe("hello");
                                expect(notification.plus).toBe("goodbye");
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);
                array.pop();
                first.foo = "goodbye";
                expect(listeners.listener.callCount).toBe(2);
            });

            it("should start observing added members of an initially empty array for changes at the property path beyond the array itself", function() {
                var first = {foo: "hello"},
                    array = [],
                    object = {array: array},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.index).toBe(0);
                                expect(notification.isMutation).toBe(true);
                                expect(notification.minus.length).toBe(0);
                                expect(notification.plus.length).toBe(1);
                                break;

                                case 2:
                                expect(notification.target).toBe(first);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.propertyPath).toBe("foo");
                                expect(notification.minus).toBe("hello");
                                expect(notification.plus).toBe("howdy");
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);
                // This triggers a change at the array.foo path
                array.push(first);
                // This should also trigger a change at the array.foo path, even though first was pushed after
                // we installed the listener on object
                first.foo = "howdy";

                expect(listeners.listener.callCount).toBe(2);
            });

            it("should start observing added members of an array that had some member initially for changes at the property path beyond the array itself", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    third = {foo: "hey"},
                    array = [first, second],
                    object = {array: array},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.index).toBe(2);
                                expect(notification.isMutation).toBe(true);
                                expect(notification.minus.length).toBe(0);
                                expect(notification.plus.length).toBe(1);
                                break;

                                case 2:
                                expect(notification.target).toBe(third);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.propertyPath).toBe("foo");
                                expect(notification.minus).toBe("hey");
                                expect(notification.plus).toBe("howdy");
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);
                // This triggers a change at the array.foo path
                array.push(third);
                // This should also trigger a change at the array.foo path, even though third was pushed after
                // we installed the listener on object
                third.foo = "howdy";

                expect(listeners.listener.callCount).toBe(2);
            });

            it("should start observing added members of an array for changes at the property path beyond the array itself, even if that path resolves to a value property", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    third = {},
                    array = [first, second],
                    object = {array: array},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.index).toBe(2);
                                expect(notification.isMutation).toBe(true);
                                expect(notification.minus.length).toBe(0);
                                expect(notification.plus.length).toBe(1);
                                break;

                                case 2:
                                expect(notification.target).toBe(third);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.propertyPath).toBe("foo");
                                expect(notification.minus).toBe("hey");
                                expect(notification.plus).toBe("howdy");
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);

                Montage.defineProperties(third, {
                    foo: {
                        value: "hey"
                    }
                });

                // This triggers a change at the array.foo path
                array.push(third);
                // This should also trigger a change at the array.foo path, even though third was pushed after
                // we installed the listener on object
                third.foo = "howdy";

                expect(listeners.listener.callCount).toBe(2);
                expect(typeof Object.getPropertyDescriptor(third, "foo").set).toBe("function");
            });


            it("should start observing added members of an array for changes at the property path beyond the array itself, even if that path resolves to a get/set property", function() {
                var first = {foo: "hello"},
                    second = {foo: "world"},
                    third = {},
                    array = [first, second],
                    object = {array: array},
                    callCount = 0,
                    listeners = {
                        listener: function(notification) {
                            switch (++callCount) {
                                case 1:
                                expect(notification.target).toBe(array);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.index).toBe(2);
                                expect(notification.isMutation).toBe(true);
                                expect(notification.minus.length).toBe(0);
                                expect(notification.plus.length).toBe(1);
                                break;

                                case 2:
                                expect(notification.target).toBe(third);
                                expect(notification.currentTarget).toBe(object);
                                expect(notification.propertyPath).toBe("foo");
                                expect(notification.minus).toBe("hey");
                                expect(notification.plus).toBe("howdy");
                                break;
                            }
                        }
                    };

                spyOn(listeners, "listener").andCallThrough();
                object.addPropertyChangeListener("array.foo", listeners.listener);

                var fooSetter = function(value) {
                    this._foo = value;
                };

                Montage.defineProperties(third, {
                    _foo: {
                        value: "hey"
                    },

                    foo: {
                        get: function() {
                            return this._foo;
                        },
                        set: fooSetter
                    }
                });

                // This triggers a change at the array.foo path
                array.push(third);
                // This should also trigger a change at the array.foo path, even though third was pushed after
                // we installed the listener on object
                third.foo = "howdy";

                expect(listeners.listener.callCount).toBe(2);
                expect(typeof Object.getPropertyDescriptor(third, "foo").set).not.toBe(fooSetter);
            });
        });

        it("should listen to changes made by reverse", function() {
            var array = [1, 2, 3],
                listeners = {
                    listener1: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe(null);
                        expect(notification.isMutation).toBeTruthy();
                        expect(notification.minus.length).toBe(0);
                        expect(notification.plus.length).toBe(0);
                    },

                    listener2: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe("2");
                        expect(notification.index).toBe(2);
                        expect(notification.minus).toBe(3);
                        expect(notification.plus).toBe(1);
                    },

                    listener3: function(notification) {
                    }
                };

            spyOn(listeners, "listener1").andCallThrough();
            spyOn(listeners, "listener2").andCallThrough();
            spyOn(listeners, "listener3").andCallThrough();

            array.addPropertyChangeListener(null, listeners.listener1);
            array.addPropertyChangeListener("2", listeners.listener2);
            array.addPropertyChangeListener("1", listeners.listener3);

            array.reverse();

            expect(listeners.listener1.callCount).toBe(1);
            expect(listeners.listener2.callCount).toBe(1);
            expect(listeners.listener3.callCount).toBe(0);
        });

        it("should listen to changes made by user defined sort", function() {
            var array = [4, 6, 3, 2, 5, 1],
                listeners = {
                    listener1: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe(null);
                        expect(notification.isMutation).toBeTruthy();
                        expect(notification.minus.length).toBe(0);
                        expect(notification.plus.length).toBe(0);
                    },

                    listener2: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe("0");
                        expect(notification.index).toBe(0);
                        expect(notification.minus).toBe(4);
                        expect(notification.plus).toBe(1);
                    },

                    listener3: function(notification) {
                    }
                };

            spyOn(listeners, "listener1").andCallThrough();
            spyOn(listeners, "listener2").andCallThrough();
            spyOn(listeners, "listener3").andCallThrough();

            array.addPropertyChangeListener(null, listeners.listener1);
            array.addPropertyChangeListener("0", listeners.listener2);
            array.addPropertyChangeListener("2", listeners.listener3);

            array.sort(function(e1, e2) {
                return e1 - e2;
            });

            expect(array).toEqual([1, 2, 3, 4, 5, 6]);
            expect(listeners.listener1.callCount).toBe(1);
            expect(listeners.listener2.callCount).toBe(1);
            expect(listeners.listener3.callCount).toBe(0);
        });

        it("should listen to changes made by sort", function() {
            var array = ["françois", "afonso", "heather", "stuart", "mike"],
                sortedArray = array.slice(0),
                listeners = {
                    listener1: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe(null);
                        expect(notification.isMutation).toBeTruthy();
                        expect(notification.minus.length).toBe(0);
                        expect(notification.plus.length).toBe(0);
                    },

                    listener2: function(notification) {
                        expect(notification.target).toBe(array);
                        expect(notification.currentTarget).toBe(array);
                        expect(notification.propertyPath).toBe("0");
                        expect(notification.index).toBe(0);
                        expect(notification.minus).toBe("françois");
                        expect(notification.plus).toBe("afonso");
                    },

                    listener3: function(notification) {
                    }
                };

            sortedArray.sort();

            spyOn(listeners, "listener1").andCallThrough();
            spyOn(listeners, "listener2").andCallThrough();
            spyOn(listeners, "listener3").andCallThrough();

            array.addPropertyChangeListener(null, listeners.listener1);
            array.addPropertyChangeListener("0", listeners.listener2);
            array.addPropertyChangeListener("2", listeners.listener3);

            array.sort();

            expect(array).toEqual(sortedArray);
            expect(listeners.listener1.callCount).toBe(1);
            expect(listeners.listener2.callCount).toBe(1);
            expect(listeners.listener3.callCount).toBe(0);
        });
    });
});
