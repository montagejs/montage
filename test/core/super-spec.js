var Montage = require("montage").Montage,
    Bindings = require("montage/core/bindings").Bindings;

describe("test/core/super-spec", function () {
    var Vehicle, Car, Beetle,
        vehicle, car, beetle,
        vehicleSpy, carSpy, beetleSpy,
        calledSpy;
    beforeEach(function () {
        calledSpy = [];
        Vehicle = Montage.specialize( {
            constructor: {value: function Vehicle() {}}
        });
        Car = Vehicle.specialize( {
            constructor: {value: function Car() {}}
        });
        Beetle = Car.specialize( {
            constructor: {value: function Beetle() {}}
        });
        vehicleSpy = function () {calledSpy.push("vehicleSpy")};
        carSpy = function () {calledSpy.push("carSpy")};
        beetleSpy = function () {calledSpy.push("beetleSpy")};
    });
    describe("instance", function () {
        describe("methods", function () {
            describe("with direct super", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with one hop", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        value: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward();
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with three in a row", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        value: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
        });

        describe("getters", function () {
            describe("with direct super", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with one hop", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleSpy();
                            return "Vehicle"
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        get: function () {
                            var superValue = this.super();
                            beetleSpy();
                            return superValue+"Beetle";
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    expect(vehicle.forward).toEqual("Vehicle");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    expect(car.forward).toEqual("Vehicle");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    expect(beetle.forward).toEqual("VehicleBeetle");
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with three in a row", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        get: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with a value in between", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: null
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        get: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward;
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
            });
        });

        describe("setters", function () {
            describe("with direct super", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with one hop", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        set: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward = true;
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with three in a row", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {
                            this.super();
                            carSpy();
                        }
                    });
                    Montage.defineProperty(Beetle.prototype, "forward", {
                        set: function () {
                            this.super();
                            beetleSpy();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
        });
        describe("bindings", function () {
            describe("with direct super", function () {
                var backingValue;
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleSpy();
                        },
                        set: function (value) {
                            vehicleSpy();
                            backingValue = value;
                        }

                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {
                            this.super();
                            carSpy();
                        },
                        set: function (value) {
                            this.super(value);
                            carSpy();
                            backingValue = value;
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                    beetle = new Beetle();
                });
                afterEach(function () {
                    backingValue = null
                });
                it("calling forward on vehicle", function () {
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car", function () {
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle", function () {
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                describe("binding on super method", function () {
                    beforeEach(function () {
                        Bindings.defineBinding(vehicle, "forward", {"<->": "foo"});
                        vehicle.foo = "BOO"
                    });
                    it("calling forward on vehicle", function () {
                        vehicle.forward;
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BOO");
                    });
                    it("calling forward on car", function () {
                        // checking if the binding is working
                        expect(backingValue).toEqual("BOO");
                        car.forward = true;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");

                    });
                    it("calling forward on beetle", function () {
                        beetle.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BOO");
                    });
                });
                describe("binding on method itself", function () {
                    beforeEach(function () {
                        Bindings.defineBinding(car, "forward", {"<->": "foo"});
                        car.foo = "BOO"
                    });
                    it("calling forward on vehicle", function () {
                        vehicle.forward;
                        expect(calledSpy).toContain("vehicleSpy");
                    });
                    it("calling forward on car", function () {
                        car.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BOO");
                    });
                    it("calling forward on beetle", function () {
                        beetle.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BOO");
                    });
                });
            });

        });
    });
    describe("class", function () {
        describe("methods", function () {
            describe("with direct super", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {value: function Vehicle() {}}
                    }, {
                        forward: {
                            value: function () {
                                vehicleSpy();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {value: function Car() {}}
                    }, {
                        forward: {
                            value: function () {
                                this.super();
                                carSpy();
                            }
                        }
                    });
                    Beetle = Car.specialize( {
                        constructor: {value: function Beetle() {}}
                    });
               });
                it("calling forward on Vehicle", function () {
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car", function () {
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle", function () {
                    Beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with one hop", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {value: function Vehicle() {}}
                    }, {
                        forward: {
                            value: function () {
                                vehicleSpy();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {value: function Car() {}}
                    });
                    Beetle = Car.specialize( {
                        constructor: {value: function Beetle() {}}
                    }, {
                        forward: {
                            value: function () {
                                this.super();
                                beetleSpy();
                            }
                        }
                    });
                });
                it("calling forward on Vehicle", function () {
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car", function () {
                    Car.forward();
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle", function () {
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
            describe("with three in a row", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {value: function Vehicle() {}}
                    }, {
                        forward: {
                            value: function () {
                                vehicleSpy();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {value: function Car() {}}
                    }, {
                        forward: {
                            value: function () {
                                this.super();
                                carSpy();
                            }
                        }
                    });
                    Beetle = Car.specialize( {
                        constructor: {value: function Beetle() {}}
                    }, {
                        forward: {
                            value: function () {
                                this.super();
                                beetleSpy();
                            }
                        }
                    });
                });
                it("calling forward on Vehicle", function () {
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car", function () {
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle", function () {
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });
        });
    });
    describe("bindings", function () {

    });
});
