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
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

var Person = Montage.create(Montage, {

    name: {
        enumerable: false,
        value: null
    },

    homeState: {
        enumerable: false,
        value: null
    },

    initWithName: {
        enumerable: false,
        value: function(aName) {
            this.name = aName;
            return this;
        }
    },

    friends: {
        enumerable: false,
        value: null
    }

});

describe("controllers/array-controller-spec.js", function() {

    var arrayController;

    beforeEach(function() {
        arrayController = ArrayController.create();
    });

    describe("initializing an array controller", function() {

        it("should have no content by default", function() {
            expect(arrayController.content).toBeNull();
        });

        it("should have content when initialized with content", function() {
            var content = [0,1,2,3];
            arrayController.initWithContent(content);
            expect(arrayController.content).toBe(content);
        });

        it("should initialize content", function() {
            arrayController.addObjects("Foo");
            expect(arrayController.content).toEqual(["Foo"]);
        });
    });

    describe("when used in bindings", function() {

        it("should accept new content when bound to another object for its content property", function() {
            var boundObject = Person.create().initWithName("Alice"),
                originalFriends = ["Bob", "Carol", "Dave"],
                newFriends = ["Eve", "Fred", "Gail"];

            boundObject.friends = originalFriends;

            Object.defineBinding(arrayController, "content", {
                boundObject: boundObject,
                boundObjectPropertyPath: "friends",
                oneway: true
            });

            expect(arrayController.content).toBe(originalFriends);

            boundObject.friends = newFriends;

            expect(arrayController.content).toBe(newFriends);
        });

        it("must not allow an outright replacement of the value on the sourceObject to affect the array controller's organizedObjects property with a oneway binding", function() {
            var sourceObject = Person.create().initWithName("Alice"),
                originalFriends = ["Bob", "Carol", "Dave"],
                imposterFriends = ["Xavier", "Yancy", "Zed"];

            arrayController.content = originalFriends;

            Object.defineBinding(sourceObject, "friends", {
                boundObject: arrayController,
                boundObjectPropertyPath: "organizedObjects",
                oneway: true
            });

            sourceObject.friends = imposterFriends;

            expect(sourceObject.friends).toBe(imposterFriends);
            expect(arrayController.organizedObjects).toBe(originalFriends);
        });

        it("must not allow an outright replacement of the value on the sourceObject to affect the array controller's selectedObjects property with a oneway binding", function() {
            var sourceObject = Person.create().initWithName("Alice"),
                originalFriends = ["Bob", "Carol", "Dave"],
                imposterFriends = ["Xavier", "Yancy", "Zed"];

            arrayController.content = originalFriends;
            arrayController.selectedContentIndexes = [0];

            Object.defineBinding(sourceObject, "friends", {
                boundObject: arrayController,
                boundObjectPropertyPath: "selectedObjects",
                oneway: true
            });

            sourceObject.friends = imposterFriends;

            expect(sourceObject.friends).toBe(imposterFriends);
            expect(arrayController.selectedObjects[0]).toBe("Bob");
            expect(arrayController.content).toBe(originalFriends);
        });

    });

    describe("when assisting a managed collection", function() {

        var content;

        beforeEach(function() {
            content = [];
            arrayController = ArrayController.create().initWithContent(content);
        });

        it("should accept an object constructor", function() {
            arrayController.objectPrototype = Person;
            expect(arrayController.objectPrototype).toBe(Person);
        });

        describe("to add objects to the managed content", function() {

            it("should provide a way to add a new instance of an object using the stored prototype", function() {

                arrayController.objectPrototype = Person;
                arrayController.add();

                expect(arrayController.content.length).toBe(1);
                expect(arrayController.content[0].__proto__).toBe(Person);
            });

            it("should accept a single object to append to the managed collection", function() {
                var newPerson = Person.create();
                arrayController.addObjects(newPerson);

                expect(arrayController.content.length).toBe(1);
                expect(arrayController.content[0]).toBe(newPerson);
            });

            it("should accept multiple objects to append to the managed collection", function() {
                var newPerson = Person.create();
                var newPerson2 = Person.create();
                arrayController.addObjects(newPerson, newPerson2);

                expect(arrayController.content.length).toBe(2);
                expect(arrayController.content[0]).toBe(newPerson);
                expect(arrayController.content[1]).toBe(newPerson2);
            });

        });

        describe("to remove objects from the managed content", function() {

            var alice, bob;

            beforeEach(function() {
                alice = Person.create();
                bob = Person.create();
                arrayController.initWithContent([alice, bob]);
            });

            it("should provide a way to remove a single object from the managed collection", function() {

                arrayController.removeObjects(alice);

                expect(arrayController.content.length).toBe(1);
                expect(arrayController.content[0]).toBe(bob);
            });

            it("should return a single object removed from the managed collection", function() {
                expect(arrayController.removeObjects(alice)).toEqual([alice]);
            });

            it("should provide a way to remove multiple objects from the managed collection", function() {

                arrayController.removeObjects(bob, alice);

                expect(arrayController.content.length).toBe(0);
            });

            it("should return multiple object removed from the managed collection", function() {
                expect(arrayController.removeObjects(bob, alice)).toEqual([bob, alice]);
            });

            it("should provide a way to remove selected objects from the managed collection", function() {;
                arrayController.selectedContentIndexes = [0,1];
                arrayController.remove();

                expect(arrayController.content.length).toBe(0);
                expect(arrayController.selectedObjects.length).toBe(0);
                expect(arrayController.selectedContentIndexes.length).toBe(0);
            });

            it("should return multiple selected objects removed by from the managed collection", function() {
                arrayController.selectedContentIndexes = [0,1];
                expect(arrayController.remove()).toEqual([bob, alice]);
            });

            it("should remove objects at the selected indices", function() {
                arrayController.selectedIndexes = [1];
                arrayController.removeObjectsAtSelectedIndexes();

                expect(arrayController.content.length).toBe(1);
                expect(arrayController.content.indexOf(bob)).toBe(-1);
            });

            it("should return multiple objects removed by selectedIndexes from the managed collection", function() {
                arrayController.selectedIndexes = [1];
                expect(arrayController.removeObjectsAtSelectedIndexes()).toEqual([bob]);
            });

            it("should remove objects at the specified indices", function() {
                arrayController.removeObjectsAtIndexes([0,1]);
                expect(arrayController.content.length).toBe(0);
                expect(arrayController.content.indexOf(bob)).toBe(-1);
                expect(arrayController.content.indexOf(alice)).toBe(-1);
            });

            it("should return multiple objects removed by specific indicies from the managed collection", function() {
                expect(arrayController.removeObjectsAtIndexes([0,1])).toEqual([alice, bob]);
            });

        });

    });

    describe("when concerned with selections", function() {

        var alice, bob, carol, david, eve, frank;

        beforeEach(function() {
            alice = Person.create(); //0
            bob = Person.create(); // 1
            carol = Person.create(); // 2
            david = Person.create(); // 3
            eve = Person.create(); // 4
            frank = Person.create(); // 5
            arrayController.initWithContent([alice, bob, carol, david, eve, frank]);
        });

        describe("by selecting objects", function() {

            it("should allow clearing a selection by selecting null", function() {
                arrayController.selectedObjects = null;
                expect(arrayController.selectedContentIndexes).toBe(null);
            });

            it("should allow setting a selection by selecting a falsy value in the managed content, other than null", function() {
                // TODO not sure how important this is really
            });

            it("should allow setting a selection given an object", function() {
                arrayController.selectedObjects = david;
                expect(arrayController.selectedContentIndexes.length).toBe(1);
                expect(arrayController.selectedContentIndexes[0]).toBe(3);
            });

            it("should allow setting a selection given several objects", function() {
                arrayController.selectedObjects = [alice, david, eve];
                expect(arrayController.selectedContentIndexes.length).toBe(3);
                expect(arrayController.selectedContentIndexes[0]).toBe(0);
                expect(arrayController.selectedContentIndexes[1]).toBe(3);
                expect(arrayController.selectedContentIndexes[2]).toBe(4);
            });

        });

        describe("by selecting indexes", function() {
            beforeEach(function() {
                arrayController.selectedContentIndexes = [1];
            });

            it("should allow removing a selection by passing a falsy value other than zero as a selection content index", function() {
                arrayController.selectedContentIndexes = null;
                expect(arrayController.selectedObjects.length).toBe(0);

                arrayController.selectedContentIndexes = false;
                expect(arrayController.selectedObjects.length).toBe(0);

                var notDefined;
                arrayController.selectedContentIndexes = notDefined;
                expect(arrayController.selectedObjects.length).toBe(0);

                arrayController.selectedContentIndexes = [0];
                expect(arrayController.selectedObjects.length).toBe(1);
                expect(arrayController.selectedObjects[0]).toBe(alice);
            });

            it("should allow removing a selection by passing a falsy value other than zero as a selection index", function() {
                arrayController.selectedIndexes = null;
                expect(arrayController.selectedObjects.length).toBe(0);

                arrayController.selectedIndexes = false;
                expect(arrayController.selectedObjects.length).toBe(0);

                var notDefined;
                arrayController.selectedIndexes = notDefined;
                expect(arrayController.selectedObjects.length).toBe(0);

                arrayController.selectedIndexes = [0];
                expect(arrayController.selectedObjects.length).toBe(1);
                expect(arrayController.selectedObjects[0]).toBe(alice);
            });

            it("should allow setting a selection given an index", function() {
                arrayController.selectedContentIndexes = [2];

                expect(arrayController.selectedObjects.length).toBe(1);
                expect(arrayController.selectedObjects[0]).toBe(carol);

                expect(arrayController.selectedContentIndexes.length).toBe(1);
                expect(arrayController.selectedContentIndexes[0]).toBe(2);
            });

            it("should allow setting a selection given several indices", function() {
                arrayController.selectedContentIndexes = [0,1,4,5];

                expect(arrayController.selectedObjects.length).toBe(4);
                expect(arrayController.selectedObjects[0]).toBe(alice);
                expect(arrayController.selectedObjects[1]).toBe(bob);
                expect(arrayController.selectedObjects[2]).toBe(eve);
                expect(arrayController.selectedObjects[3]).toBe(frank);
            });

        });

        describe("by adding objects when 'selectObjectsOnAddition' is enabled", function() {

            it ("should select a single new object added to the collection by the array controller", function() {
                arrayController.objectPrototype = Person;
                arrayController.selectObjectsOnAddition = true;
                arrayController.add();

                expect(arrayController.selectedContentIndexes[0]).toBe(6);
                expect(arrayController.selectedObjects[0].__proto__).toBe(Person);
            });

            it ("should select new objects added to the collection through the array controller", function() {
                arrayController.selectObjectsOnAddition = true;

                var gertrude = Person.create(), // 6
                    hiram = Person.create(); //7
                arrayController.addObjects(gertrude, hiram);

                expect(arrayController.selectedContentIndexes.length).toBe(2);
                expect(arrayController.selectedContentIndexes[0]).toBe(6);
                expect(arrayController.selectedObjects[0]).toBe(gertrude);

                expect(arrayController.selectedContentIndexes[1]).toBe(7);
                expect(arrayController.selectedObjects[1]).toBe(hiram);
            });

            //TODO not sure if we care to select new objects we may find out about via bindings to the content or anything

        });


    });

    describe("when organizing a managed collection", function() {

        var alice, bob, carol, david, eve, frank,
            sortByHome, filterNewEnglandOnly, filterStatesWithA;

        sortByHome = function(personA, personB) {

            if (personA.homeState < personB.homeState) {
                 return -1;
            } else if (personA.homeState > personB.homeState) {
                return 1;
            } else {
              return 0;
            }

        };

        filterNewEnglandOnly = function(person) {
            var newEngland = ["ME", "NH", "VT", "MA", "CT", "RI"];
            return newEngland.indexOf(person.homeState) >= 0;
        };

        filterStatesWithA = function(person) {
            return person.homeState.indexOf("A") >= 0;
        };

        beforeEach(function() {
            alice = Person.create().initWithName("Alice"); //0
            alice.homeState = "RI";

            bob = Person.create().initWithName("Bob"); // 1
            bob.homeState = "CA";

            carol = Person.create().initWithName("Carol"); // 2
            carol.homeState = "PA";

            david = Person.create().initWithName("David"); // 3
            david.homeState = "NJ";

            eve = Person.create().initWithName("Eve"); // 4
            eve.homeState = "PA";

            frank = Person.create().initWithName("Frank"); // 5
            frank.homeState = "MA";

            arrayController.initWithContent([alice, bob, carol, david, eve, frank]);
        });

        describe("when automatically organizing objects", function() {

            beforeEach(function() {
                arrayController.automaticallyOrganizeObjects = true;
            });

//            it("should keep the content array intact", function() {
//                var clone = arrayController.content.splice(0);
//
//                arrayController.sortFunction = sortByHome;
//
//                expect(arrayController.content).toEqual(clone);
//            });

            it("should organize objects when the sort function is set", function() {
                arrayController.sortFunction = sortByHome;

                expect(arrayController.organizedObjects[0]).toBe(bob);
                expect(arrayController.organizedObjects[1]).toBe(frank);
                expect(arrayController.organizedObjects[2]).toBe(david);
                expect(arrayController.organizedObjects[3]).toBe(carol);
                expect(arrayController.organizedObjects[4]).toBe(eve);
                expect(arrayController.organizedObjects[5]).toBe(alice);
            });

            it("should organize objects when the filter function is set", function() {
                arrayController.filterFunction = filterNewEnglandOnly;

                expect(arrayController.organizedObjects.length).toBe(2);
                expect(arrayController.organizedObjects[0]).toBe(alice);
                expect(arrayController.organizedObjects[1]).toBe(frank);
            });

            describe("and setting the output range", function() {

                it("should organize objects when the startIndex is set", function() {
                    arrayController.sortFunction = sortByHome;
                    arrayController.startIndex = 1;

                    var organizedObjects = arrayController.organizedObjects;
                    expect(organizedObjects.length).toBe(5);
                    expect(organizedObjects[0]).toBe(frank);
                    expect(organizedObjects[organizedObjects.length-1]).toBe(alice);
                });

                it("should organize objects when the endIndex is set", function() {
                    arrayController.filterFunction = filterNewEnglandOnly;
                    arrayController.endIndex = 1;

                    var organizedObjects = arrayController.organizedObjects;
                    expect(organizedObjects.length).toBe(1);
                    expect(organizedObjects[0]).toBe(alice);
                });

                it("should have no effect when the startIndex & endIndex are out of bounds", function() {
                    arrayController.filterFunction = filterNewEnglandOnly;
                    arrayController.startIndex = -1;
                    arrayController.endIndex = 99;

                    var organizedObjects = arrayController.organizedObjects;
                    expect(organizedObjects.length).toBe(2);
                    expect(organizedObjects[0]).toBe(alice);
                    expect(organizedObjects[organizedObjects.length-1]).toBe(frank);
                });

                it("should organize objects when both startIndex and endIndex are set", function() {
                    arrayController.startIndex = 1;
                    arrayController.endIndex = 3;
                    arrayController.filterFunction = filterStatesWithA;
                    arrayController.sortFunction = sortByHome;

                    var organizedObjects = arrayController.organizedObjects;
                    expect(organizedObjects.length).toBe(2);
                    expect(organizedObjects[0]).toBe(frank);
                    expect(organizedObjects[organizedObjects.length-1]).toBe(carol);
                });

            });

        });

        describe("when not automatically organizing objects", function() {

            beforeEach(function() {
                arrayController.automaticallyOrganizeObjects = false;
            });

            afterEach(function() {
                arrayController.automaticallyOrganizeObjects = true;
            });

            it("should not organize objects when the sort function is set", function() {
                arrayController.sortFunction = sortByHome;

                expect(arrayController.organizedObjects[0]).toBe(alice);
                expect(arrayController.organizedObjects[1]).toBe(bob);
                expect(arrayController.organizedObjects[2]).toBe(carol);
                expect(arrayController.organizedObjects[3]).toBe(david);
                expect(arrayController.organizedObjects[4]).toBe(eve);
                expect(arrayController.organizedObjects[5]).toBe(frank);
            });

            it("should not organize objects when the filter function is set", function() {
                arrayController.filterFunction = filterNewEnglandOnly;

                expect(arrayController.organizedObjects[0]).toBe(alice);
                expect(arrayController.organizedObjects[1]).toBe(bob);
                expect(arrayController.organizedObjects[2]).toBe(carol);
                expect(arrayController.organizedObjects[3]).toBe(david);
                expect(arrayController.organizedObjects[4]).toBe(eve);
                expect(arrayController.organizedObjects[5]).toBe(frank);

            });

            it("should organize objects using associated sort function when explicitly organized", function() {
                arrayController.sortFunction = sortByHome;

                arrayController.organizeObjects();

                expect(arrayController.organizedObjects[0]).toBe(bob);
                expect(arrayController.organizedObjects[1]).toBe(frank);
                expect(arrayController.organizedObjects[2]).toBe(david);
                expect(arrayController.organizedObjects[3]).toBe(carol);
                expect(arrayController.organizedObjects[4]).toBe(eve);
                expect(arrayController.organizedObjects[5]).toBe(alice);
            });

            it("should organize objects using associated filter function when explicitly organized", function() {
                arrayController.filterFunction = filterNewEnglandOnly;

                arrayController.organizeObjects();

                expect(arrayController.organizedObjects.length).toBe(2);
                expect(arrayController.organizedObjects[0]).toBe(alice);
                expect(arrayController.organizedObjects[1]).toBe(frank);
            });

            it("should organize objects using associated filter and sort functions when explicitly organized", function() {
                arrayController.sortFunction = sortByHome;
                arrayController.filterFunction = filterNewEnglandOnly;

                arrayController.organizeObjects();

                expect(arrayController.organizedObjects.length).toBe(2);
                expect(arrayController.organizedObjects[0]).toBe(frank);
                expect(arrayController.organizedObjects[1]).toBe(alice);
            });

        });

        describe("setting the selected indexes of the organized objects", function() {

            beforeEach(function() {
                arrayController.automaticallyOrganizeObjects = true;
            });

            describe("when sorting", function() {

                beforeEach(function() {
                    arrayController.sortFunction = sortByHome;
                });

                it("should keep track of selection after organization", function() {
                    arrayController.selectedIndexes = [1,2];
                    expect(arrayController.selectedObjects[0]).toBe(david);
                    expect(arrayController.selectedObjects[1]).toBe(frank);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

                it("should ignore indexes that are out of bounds", function() {
                    arrayController.selectedIndexes = [-1, 1, 2 ,6];
                    expect(arrayController.selectedObjects[0]).toBe(david);
                    expect(arrayController.selectedObjects[1]).toBe(frank);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

            });

            describe("when filtering", function() {

                beforeEach(function() {
                    arrayController.filterFunction = filterStatesWithA;
                });

                it("should keep track of selection after organization", function() {
                    arrayController.selectedIndexes = [1,2];
                    expect(arrayController.selectedObjects[0]).toBe(carol);
                    expect(arrayController.selectedObjects[1]).toBe(eve);
                    expect(arrayController.selectedContentIndexes).toEqual([2,4]);
                 });

            });

            describe("when applying a range", function() {

                beforeEach(function() {
                    arrayController.startIndex = 1;
                    arrayController.endIndex = 4;
                });

                it("should keep track of selection after organization", function() {
                    arrayController.selectedIndexes = [1,2];
                    expect(arrayController.selectedObjects[0]).toBe(carol);
                    expect(arrayController.selectedObjects[1]).toBe(david);
                    expect(arrayController.selectedContentIndexes).toEqual([2,3]);
                });

            });

            describe("when sorting, filtering and range are applied", function() {

                beforeEach(function() {
                    arrayController.sortFunction = sortByHome;
                    arrayController.filterFunction = filterStatesWithA;
                    arrayController.startIndex = 1;
                    arrayController.endIndex = 3;
                });

                it("should keep track of selection after organization", function() {
                    arrayController.selectedIndexes = [0,1];
                    expect(arrayController.selectedObjects[0]).toBe(carol);
                    expect(arrayController.selectedObjects[1]).toBe(frank);
                    expect(arrayController.selectedContentIndexes).toEqual([2,5]);
                });

            });

        });

        describe("setting the selected objects of the organized objects", function() {

            beforeEach(function() {
                arrayController.automaticallyOrganizeObjects = true;
            });

            describe("when there is no sorting, filtering, or range applied", function() {

                it("should select the indexes for objects that were found", function() {
                    arrayController.selectedObjects = [david, frank];
                    expect(arrayController.selectedIndexes).toEqual([3,5]);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

                it("must not select the indexes for objects that were not found", function() {
                    arrayController.selectedObjects = [{}, david, frank, {}];
                    expect(arrayController.selectedIndexes).toEqual([3, 5]);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

            });

            describe("when sorting", function() {

                beforeEach(function() {
                    arrayController.sortFunction = sortByHome;
                });

                it("should select the indexes for objects that were found", function() {
                    arrayController.selectedObjects = [david, frank];
                    expect(arrayController.selectedIndexes).toEqual([1,2]);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

                it("must not select the indexes for objects that were not found", function() {
                    arrayController.selectedObjects = [{}, david, frank, {}];
                    expect(arrayController.selectedIndexes).toEqual([1, 2]);
                    expect(arrayController.selectedContentIndexes).toEqual([3,5]);
                });

            });

            describe("when filtering", function() {

                beforeEach(function() {
                    arrayController.filterFunction = filterStatesWithA;
                });

                it("should select the indexes for objects that were found", function() {
                    arrayController.selectedObjects = [carol, eve];
                    expect(arrayController.selectedIndexes).toEqual([1,2]);
                    expect(arrayController.selectedContentIndexes).toEqual([2,4]);
                });

            });

            describe("when a range is applied", function() {

                beforeEach(function() {
                    arrayController.startIndex = 1;
                    arrayController.endIndex = 4;
                });

                it("should select the indexes for objects that were found", function() {
                    arrayController.selectedObjects = [carol, david];
                    expect(arrayController.selectedIndexes).toEqual([1,2]);
                    expect(arrayController.selectedContentIndexes).toEqual([2,3]);
                });

            });

            describe("when sorting, filtering and range are applied", function() {

                beforeEach(function() {
                    arrayController.sortFunction = sortByHome;
                    arrayController.filterFunction = filterStatesWithA;
                    arrayController.startIndex = 1;
                    arrayController.endIndex = 3;
                });

                it("should select the indexes for objects that were found", function() {
                    arrayController.selectedObjects = [carol, frank];
                    expect(arrayController.selectedIndexes).toEqual([0,1]);
                    expect(arrayController.selectedContentIndexes).toEqual([2,5]);
                });

            });

        });

        it("should dispatch a change event for the organizedObjects property when the objects are organized", function() {

            arrayController.filterFunction = filterNewEnglandOnly;

            var changeHandler = {
                handleChange: function(event) {
                    expect(event.plus.length).toBe(2);
                    expect(event.plus[0]).toBe(alice);
                    expect(event.plus[1]).toBe(frank);
                }
            };
            spyOn(changeHandler, "handleChange").andCallThrough();

            arrayController.addPropertyChangeListener("organizedObjects", changeHandler);

            arrayController.organizeObjects();

            expect(changeHandler.handleChange).toHaveBeenCalled();

        });

        it("should correctly update observers that have bound to the organizedObjects property when the objects are organized", function() {
            arrayController.filterFunction = filterNewEnglandOnly;

            var newEnglander = Person.create();

            Object.defineBinding(newEnglander, "friends", {
                boundObject: arrayController,
                boundObjectPropertyPath: "organizedObjects",
                oneway: true
            });

            arrayController.organizeObjects();

            expect(newEnglander.friends.length).toBe(2);
            expect(newEnglander.friends[0]).toBe(alice);
            expect(newEnglander.friends[1]).toBe(frank);
        });

    });



});
