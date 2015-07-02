var Montage = require("montage").Montage,
    Bindings = require("montage/core/bindings").Bindings;

describe("test/core/super-spec", function () {
    var Vehicle, Car, Beetle,
        vehicle, car, beetle,
        vehicleSpy, carSpy, beetleSpy,
        vehicleConstructorSpy, carConstructorSpy, beetleConstructorSpy,
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
        vehicleRedefinedSpy = function () {calledSpy.push("vehicleRedefinedSpy")};
        carRedefinedSpy = function () {calledSpy.push("carRedefinedSpy")};
        beetleRedefinedSpy = function () {calledSpy.push("beetleRedefinedSpy")};
        vehicleConstructorSpy = function () {calledSpy.push("vehicleConstructorSpy")};
        carConstructorSpy = function () {calledSpy.push("carConstructorSpy")};
        beetleConstructorSpy = function () {calledSpy.push("beetleConstructorSpy")};
    });
    describe("observed getter/setter calling super", function () {
        var getBarCounter = 0,
            setBarCounter = 0,
            Foo = Montage.specialize({
                bar: {
                    get: function getBar() {
                        getBarCounter++;
                        if (getBarCounter < 10) {
                            this.super();
                        }
                    },
                    set: function setBar(value) {
                        setBarCounter++;
                        if (setBarCounter < 10) {
                            this.super(value);
                        }
                    }
                }
            }),
            foo = new Foo();

        foo.addOwnPropertyChangeListener("bar", function () {}, false);
        it("should not enter in a direct infinite loop", function () {
            foo.bar = foo.bar;
            expect((getBarCounter < 10) && (setBarCounter < 10)).toBe(true);
        });
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward();
                    calledSpy = [];
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward();
                    calledSpy = [];
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward();
                    calledSpy = [];
                    beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car should cache super function", function () {
                    car.forward();
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward();
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
            });
            describe("with a property that exists on Object.prototype", function () {
                beforeEach(function () {
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                        }
                    });
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: function () {
                            this.super();
                        }
                    });
                    Montage.defineProperty(Vehicle.prototype, "toString", {
                        value: function () {
                            vehicleSpy();
                        }
                    });
                    Montage.defineProperty(Car.prototype, "toString", {
                        value: function () {
                            this.super();
                        }
                    });
                    vehicle = new Vehicle();
                    car = new Car();
                });
                it("calling toString on car", function () {
                    vehicle.forward();
                    car.toString();
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward();
                    calledSpy = [];
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward();
                    calledSpy = [];
                    car.forward();
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward();
                    calledSpy = [];
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward();
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("adding forward on car should clear cache on beetle", function () {
                    beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: function () {
                            carSpy();
                        }
                    });
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward();
                    calledSpy = [];
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward();
                    calledSpy = [];
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward();
                    calledSpy = [];
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache car's super function", function () {
                    beetle.forward();
                    calledSpy = [];
                    delete Car.prototype.forward;
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache vehicle's super function", function () {
                    beetle.forward();
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on car should clear cache on beetle", function () {
                    beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        value: function () {
                            carRedefinedSpy();
                        }
                    });
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("carRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        value: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car should cache super function", function () {
                    car.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward setter on vehicle should not clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {}
                    });
                    delete Vehicle.prototype.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    expect(vehicle.forward).toEqual("Vehicle");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    expect(car.forward).toEqual("Vehicle");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
                    expect(beetle.forward).toEqual("VehicleBeetle");
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("adding forward on car should clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {
                            carSpy();
                        }
                    });
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("adding forward setter on car should not clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {}
                    });
                    delete Car.prototype.forward;
                    beetle.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache car's super function", function () {
                    beetle.forward;
                    calledSpy = [];
                    delete Car.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache vehicle's super function", function () {
                    beetle.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on car should clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {
                            carRedefinedSpy();
                        }
                    });
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("carRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward setter on car should clear not cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {}
                    });
                    delete Car.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward setter on vehicle should not clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {}
                    });
                    delete Vehicle.prototype.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    car.forward;
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward = true;
                    calledSpy = [];
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward = true;
                    calledSpy = [];
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    beetle.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car should cache super function", function () {
                    car.forward = true;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward getter on vehicle should not clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {}
                    });
                    delete Vehicle.prototype.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward = true;
                    calledSpy = [];
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward = true;
                    calledSpy = [];
                    car.forward = true;
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("adding forward on car should clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {
                            carSpy();
                        }
                    });
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("adding forward getter on car should not clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {}
                    });
                    delete Car.prototype.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward = true;
                    calledSpy = [];
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward = true;
                    calledSpy = [];
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache car's super function", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    delete Car.prototype.forward;
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache vehicle's super function", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on car should clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        set: function () {
                            carRedefinedSpy();
                        }
                    });
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("carRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward getter on car should clear not cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Car.prototype, "forward", {
                        get: function () {}
                    });
                    delete Car.prototype.forward;
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        set: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward = true;
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward getter on vehicle should not clear cache on beetle", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {}
                    });
                    delete Vehicle.prototype.forward;
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car should cache super function", function () {
                    car.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle should cache super function", function () {
                    beetle.forward;
                    calledSpy = [];
                    delete Vehicle.prototype.forward;
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on vehicle should clear cache on beetle", function () {
                    beetle.forward;
                    calledSpy = [];
                    Montage.defineProperty(Vehicle.prototype, "forward", {
                        get: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                describe("binding on super method", function () {
                    beforeEach(function () {
                        Bindings.defineBinding(vehicle, "forward", {"<->": "foo"});
                        vehicle.foo = "BOO"
                    });
                    it("calling forward on vehicle", function () {
                        vehicle.forward;
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
                    it("calling forward on vehicle twice", function () {
                        vehicle.forward;
                        calledSpy = [];
                        vehicle.foo = "BAH";
                        vehicle.forward;
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BAH");
                    });
                    it("calling forward on car twice", function () {
                        // checking if the binding is working
                        expect(backingValue).toEqual("BOO");
                        car.forward = true;
                        calledSpy = [];
                        car.forward = true;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");

                    });
                    it("calling forward on beetle twice", function () {
                        beetle.forward;
                        calledSpy = [];
                        vehicle.foo = "BAH";
                        beetle.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BAH");
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
                    it("calling forward on vehicle twice", function () {
                        vehicle.forward;
                        calledSpy = [];
                        vehicle.forward;
                        expect(calledSpy).toContain("vehicleSpy");
                    });
                    it("calling forward on car twice", function () {
                        car.forward;
                        calledSpy = [];
                        car.foo = "BAH";
                        car.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BAH");
                    });
                    it("calling forward on beetle twice", function () {
                        beetle.forward;
                        calledSpy = [];
                        car.foo = "BAH";
                        beetle.forward;
                        expect(calledSpy).toContain("carSpy");
                        expect(calledSpy).toContain("vehicleSpy");
                        expect(backingValue).toEqual("BAH");
                    });
                });
            });
        });
        describe("constructors", function () {
            describe("with three in a row", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {
                            value: function Vehicle() {
                                vehicleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {
                            value: function Car() {
                                carConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Beetle = Car.specialize( {
                        constructor: {
                            value: function Beetle() {
                                beetleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                });
                it("calling constructor on vehicle", function () {
                    vehicle = new Vehicle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                });
                it("calling constructor on car", function () {
                    car = new Car();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                });
                it("calling constructor on beetle", function () {
                    beetle = new Beetle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                    expect(calledSpy).toContain("beetleConstructorSpy");
                });
            });
            describe("with no constructor on Beetle", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {
                            value: function Vehicle() {
                                vehicleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {
                            value: function Car() {
                                carConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Beetle = Car.specialize( {});
                });
                it("calling constructor on beetle", function () {
                    beetle = new Beetle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                });
            });
            describe("with no constructor on Car", function () {
                beforeEach(function () {
                    Vehicle = Montage.specialize( {
                        constructor: {
                            value: function Vehicle() {
                                vehicleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {});
                    Beetle = Car.specialize( {
                        constructor: {
                            value: function Beetle() {
                                beetleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                });
                it("calling constructor on beetle", function () {
                    beetle = new Beetle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("beetleConstructorSpy");
                });
                it("calling constructor on car", function () {
                    beetle = new Car();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
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
                it("calling forward on Vehicle twice", function () {
                    Vehicle.forward();
                    calledSpy = [];
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car twice", function () {
                    Car.forward();
                    calledSpy = [];
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle twice", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car should cache super function", function () {
                    Car.forward();
                    calledSpy = [];
                    delete Vehicle.forward;
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle should cache super function", function () {
                    Beetle.forward();
                    calledSpy = [];
                    delete Vehicle.forward;
                    Beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on Vehicle should clear cache on Beetle", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Vehicle, "forward", {
                        value: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    Beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
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
                it("calling forward on Vehicle twice", function () {
                    Vehicle.forward();
                    calledSpy = [];
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car twice", function () {
                    Car.forward();
                    calledSpy = [];
                    Car.forward();
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle twice", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle should cache super function", function () {
                    Beetle.forward();
                    calledSpy = [];
                    delete Vehicle.forward;
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on Vehicle should clear cache on Beetle", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Vehicle, "forward", {
                        value: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
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
                it("calling forward on Vehicle twice", function () {
                    Vehicle.forward();
                    calledSpy = [];
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car twice", function () {
                    Car.forward();
                    calledSpy = [];
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle twice", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle should cache Vehicle's super function", function () {
                    Beetle.forward();
                    calledSpy = [];
                    delete Vehicle.forward;
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle should cache Car's super function", function () {
                    Beetle.forward();
                    calledSpy = [];
                    delete Car.forward;
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("changing forward on Vehicle should clear cache on Beetle", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Vehicle, "forward", {
                        value: function () {
                            vehicleRedefinedSpy();
                        }
                    });
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
                it("changing forward on Car should clear cache on Beetle", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Montage.defineProperty(Car, "forward", {
                        value: function () {
                            carRedefinedSpy();
                        }
                    });
                    Beetle.forward();
                    expect(calledSpy).toContain("beetleSpy");
                    expect(calledSpy).not.toContain("carSpy");
                    expect(calledSpy).toContain("carRedefinedSpy");
                    expect(calledSpy).not.toContain("vehicleSpy");
                });
            });
        });
    });
    describe("Adopt non montage constructor", function () {
        beforeEach(function () {
            Vehicle = Montage.specialize.call(function Foreign () {}, {
                constructor: {value: function Vehicle() {}}
            });
            Car = Vehicle.specialize( {
                constructor: {value: function Car() {}}
            });
            Beetle = Car.specialize( {
                constructor: {value: function Beetle() {}}
            });
        });
        describe("instance", function () {
            describe("methods", function () {
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward();
                    calledSpy = [];
                    vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward();
                    calledSpy = [];
                    car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward();
                    calledSpy = [];
                    beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
             });

            describe("getters", function () {
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward;
                    calledSpy = [];
                    vehicle.forward;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward;
                    calledSpy = [];
                    car.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward;
                    calledSpy = [];
                    beetle.forward;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });

            describe("setters", function () {
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
                it("calling forward on vehicle twice", function () {
                    vehicle.forward = true;
                    calledSpy = [];
                    vehicle.forward = true;
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on car twice", function () {
                    car.forward = true;
                    calledSpy = [];
                    car.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on beetle twice", function () {
                    beetle.forward = true;
                    calledSpy = [];
                    beetle.forward = true;
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
            });

            describe("constructors", function () {
                var foreignConstructor;
                beforeEach(function () {
                    foreignConstructor = jasmine.createSpy("Foreign")
                    Vehicle = Montage.specialize.call(foreignConstructor, {
                        constructor: {
                            value: function Vehicle() {
                                vehicleConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Car = Vehicle.specialize( {
                        constructor: {
                            value: function Car() {
                                carConstructorSpy();
                                this.super();
                            }
                        }
                    });
                    Beetle = Car.specialize( {
                        constructor: {
                            value: function Beetle() {
                                beetleConstructorSpy();
                                this.super();
                            }
                        }
                    });



                });
                it("calling forward on vehicle", function () {
                    vehicle = new Vehicle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
                it("calling forward on car", function () {
                    car = new Car();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
                it("calling forward on beetle", function () {
                    beetle = new Beetle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                    expect(calledSpy).toContain("beetleConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
                it("calling forward on vehicle twice", function () {
                    vehicle = new Vehicle();
                    calledSpy = [];
                    foreignConstructor.wasCalled = false;
                    vehicle = new Vehicle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
                it("calling forward on car twice", function () {
                    car = new Car();
                    calledSpy = [];
                    foreignConstructor.wasCalled = false;
                    car = new Car();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
                it("calling forward on beetle twice", function () {
                    beetle = new Beetle();
                    calledSpy = [];
                    foreignConstructor.wasCalled = false;
                    beetle = new Beetle();
                    expect(calledSpy).toContain("vehicleConstructorSpy");
                    expect(calledSpy).toContain("carConstructorSpy");
                    expect(calledSpy).toContain("beetleConstructorSpy");
                    expect(foreignConstructor).toHaveBeenCalled();
                });
            });
        });
        describe("class", function () {
            beforeEach(function () {
                Montage.defineProperty(Vehicle, "forward", {
                    value: function () {
                        vehicleSpy();
                    }
                });
                Montage.defineProperty(Car, "forward", {
                    value: function () {
                        this.super();
                        carSpy();
                    }
                });
                vehicle = new Vehicle();
                car = new Car();
                beetle = new Beetle();
            });
            describe("methods", function () {
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
            describe("methods", function () {
                it("calling forward on Vehicle twice", function () {
                    Vehicle.forward();
                    calledSpy = [];
                    Vehicle.forward();
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Car twice", function () {
                    Car.forward();
                    calledSpy = [];
                    Car.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
                it("calling forward on Beetle twice", function () {
                    Beetle.forward();
                    calledSpy = [];
                    Beetle.forward();
                    expect(calledSpy).toContain("carSpy");
                    expect(calledSpy).toContain("vehicleSpy");
                });
           });
        });
    });
});
