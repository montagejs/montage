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
var Montage = require("montage").Montage;

describe("array-spec", function () {

    describe("mutator methods", function () {

        describe("when pushing", function () {

            describe("a single value", function () {

                var array,
                    newValue;

                beforeEach(function () {
                    array = [0,1,2];
                    newValue = 3;
                });

                // Want to double check that the expected behavior still works
                afterEach(function () {
                    expect(array.length).toBe(4);
                    expect(array[3]).toBe(newValue);
                });

                it("should push the new value on the end of the array", function () {
                    array.push(newValue);
                    // Expectations performed automatically
                });

                it("should notify listeners observing the array for 'change' events, with a collection of the pushed values", function () {
                    var arrayChangeListener = {
                        changeHandlerFunction: function (event) {
                            expect(event.minus.length).toBe(0);
                            expect(event.plus[0]).toBe(newValue);
                            expect(event.plus.length).toBe(1);
                            expect(event.index).toBe(3);
                        }
                    };

                    spyOn(arrayChangeListener, 'changeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener(null, arrayChangeListener.changeHandlerFunction, false);

                    array.push(newValue);

                    expect(arrayChangeListener.changeHandlerFunction).toHaveBeenCalled();
                });

                it("should notify listeners observing the affected index of the array for 'change' events, detailing the diff at that index", function () {
                    var indexChangeListener = {
                        changeHandlerFunction: function (event) {
                            expect(event.minus).not.toBeDefined();
                            expect(event.plus).toBe(newValue);
                        }
                    };

                    spyOn(indexChangeListener, 'changeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("3", indexChangeListener.changeHandlerFunction, false);

                    array.push(newValue);

                    expect(indexChangeListener.changeHandlerFunction).toHaveBeenCalled();
                });

                it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                    var indexChangeListener = {
                        changeHandlerFunction: function (event) {
                            throw "Did not expect to handle event for " + event.type;
                        }
                    };

                    spyOn(indexChangeListener, 'changeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("0", indexChangeListener.changeHandlerFunction);
                    array.addPropertyChangeListener("1", indexChangeListener.changeHandlerFunction);
                    array.addPropertyChangeListener("2", indexChangeListener.changeHandlerFunction);
                    // Skipping change@3 as it is the affected index in this case
                    array.addPropertyChangeListener("4", indexChangeListener.changeHandlerFunction);

                    array.push(newValue);

                    expect(indexChangeListener.changeHandlerFunction).not.toHaveBeenCalled();
                });

            });

            describe("multiple values", function () {

                var array,
                    newValues;

                beforeEach(function () {
                    array = [0,1,2];
                    newValues = [3,4];
                });

                afterEach(function () {
                    expect(array.length).toBe(5);
                    expect(array[3]).toBe(newValues[0]);
                    expect(array[4]).toBe(newValues[1]);
                });

                it("should push the new values on the end of the array", function () {
                    array.push.apply(array, newValues);
                    // Expectations performed automatically
                });

                it("should notify listeners observing the array for 'change' events, detailing the diff", function () {
                    var arrayChangeListener = {
                        changeHandlerFunction: function (event) {
                            expect(event.minus.length).toBe(0);
                            expect(event.plus.length).toBe(2);
                            expect(event.plus[0]).toBe(newValues[0]);
                            expect(event.plus[1]).toBe(newValues[1]);
                        }
                    };

                    spyOn(arrayChangeListener, 'changeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener(null, arrayChangeListener.changeHandlerFunction, false);

                    array.push.apply(array, newValues);

                    expect(arrayChangeListener.changeHandlerFunction).toHaveBeenCalled();
                });

                it("should notify listeners observing the affected index of the array for 'change' events, detailing the diff at those respective indexes", function () {
                    var index3ChangeListener = {
                        index3ChangeHandlerFunction: function (event) {
                            expect(event.minus).not.toBeDefined();
                            expect(event.plus).toBe(newValues[0]);
                        }
                    };

                    var index4ChangeListener = {
                        index4ChangeHandlerFunction: function (event) {
                            expect(event.minus).not.toBeDefined();
                            expect(event.plus).toBe(newValues[1]);
                        }
                    };

                    spyOn(index3ChangeListener, 'index3ChangeHandlerFunction').andCallThrough();
                    spyOn(index4ChangeListener, 'index4ChangeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("3", index3ChangeListener.index3ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("4", index4ChangeListener.index4ChangeHandlerFunction, false);

                    array.push.apply(array, newValues);

                    expect(index3ChangeListener.index3ChangeHandlerFunction).toHaveBeenCalled();
                    expect(index4ChangeListener.index4ChangeHandlerFunction).toHaveBeenCalled();
                });

                it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                    var indexChangeListener = {
                        changeHandlerFunction: function (event) {
                            throw "Did not expect to handle event for " + event.type;
                        }
                    };

                    spyOn(indexChangeListener, 'changeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("0", indexChangeListener.changeHandlerFunction, false);
                    array.addPropertyChangeListener("1", indexChangeListener.changeHandlerFunction, false);
                    array.addPropertyChangeListener("2", indexChangeListener.changeHandlerFunction, false);
                    // Skipping change@3 and change@4 as it is the affected index in this case
                    array.addPropertyChangeListener("5", indexChangeListener.changeHandlerFunction, false);

                    array.push.apply(array, newValues);

                    expect(indexChangeListener.changeHandlerFunction).not.toHaveBeenCalled();
                });

            });

        });

        describe("when popping", function () {

            var array,
                poppedValue;

            beforeEach(function () {
                array = [0, 1, 2];
                poppedValue = 2;
            });

            // We want to make sure our own tinkering doesn't affect the expected behavior, but
            // I don't want to be the focus of these tests necessarily
            afterEach(function () {
                expect(array.length).toBe(2);
                expect(array[2]).not.toBeDefined();
            });

            it("should return the last value removed from the end of the array", function () {
                expect(array.pop()).toBe(poppedValue);
            });

            it("should notify listeners observing the array for 'change' events, detailing the diff of the change", function () {
                var arrayChangeListener = {
                    changeHandlerFunction: function (event) {
                        expect(event.minus[0]).toBe(poppedValue);
                        expect(event.plus.length).toBe(0);
                    }
                };

                spyOn(arrayChangeListener, 'changeHandlerFunction').andCallThrough();

                array.addPropertyChangeListener(null, arrayChangeListener.changeHandlerFunction, false);

                expect(array.pop()).toBe(poppedValue);

                expect(arrayChangeListener.changeHandlerFunction).toHaveBeenCalled();
            });

            it("should notify listeners observing the affected index of the array for 'change' events, detailing the diff of the change", function () {
                var indexChangeListener = {
                    changeHandlerFunction: function (event) {
                        expect(event.minus).toBe(poppedValue);
                        expect(event.plus).not.toBeDefined();
                    }
                };

                spyOn(indexChangeListener, 'changeHandlerFunction').andCallThrough();

                array.addPropertyChangeListener("2", indexChangeListener.changeHandlerFunction, false);

                expect(array.pop()).toBe(poppedValue);

                expect(indexChangeListener.changeHandlerFunction).toHaveBeenCalled();
            });

            it ("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                var indexChangeListener = {
                    changeHandlerFunction: function (event) {
                        throw "Did not expect to handle event for " + event.type;
                    }
                };

                spyOn(indexChangeListener, 'changeHandlerFunction').andCallThrough();

                array.addPropertyChangeListener("0", indexChangeListener.changeHandlerFunction, false);
                array.addPropertyChangeListener("1", indexChangeListener.changeHandlerFunction, false);
                // Skipping change@2 as it is the affected index in this case
                array.addPropertyChangeListener("3", indexChangeListener.changeHandlerFunction, false);

                expect(array.pop()).toBe(poppedValue);

                expect(indexChangeListener.changeHandlerFunction).not.toHaveBeenCalled();
            });
        });

        describe("when shifting", function () {

            var array,
                shiftedValue,
                prevArray,
                newArray;

            beforeEach(function () {
                prevArray = [0, 1, 2];
                array = [0, 1, 2];
                shiftedValue = 0;
                newArray = [1,2];
            });

            // We want to make sure our own tinkering doesn't affect the expected behavior, but
            // I don't want to be the focus of these tests necessarily
            afterEach(function () {
                expect(array.length).toBe(2);
                expect(array[0]).toBe(1);
                expect(array[1]).toBe(2);
                expect(array[2]).not.toBeDefined();
            });

            it("should return the first value removed from the front of the array", function () {
                expect(array.shift()).toBe(shiftedValue);
            });

            it ("must notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {

                var indexChangeListener = {
                    index0ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[0]);
                        expect(event.plus).toBe(newArray[0]);
                    },

                    index1ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[1]);
                        expect(event.plus).toBe(newArray[1]);
                    },

                    index2ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[2]);
                        expect(event.plus).toBe(newArray[2]);
                    }
                };

                spyOn(indexChangeListener, 'index0ChangeHandlerFunction').andCallThrough();
                spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();

                array.addPropertyChangeListener("0", indexChangeListener.index0ChangeHandlerFunction, false);
                array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);

                expect(array.shift()).toBe(shiftedValue);

                expect(indexChangeListener.index0ChangeHandlerFunction).toHaveBeenCalled();
                expect(indexChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
            });

        });

        describe("when unshifting", function () {

            describe("a single value", function () {

                var prevArray,
                    array,
                    unshiftedValue,
                    newArray;

                beforeEach(function () {
                    prevArray = [0, 1, 2];
                    array = [0, 1, 2];
                    unshiftedValue = -1;
                    newArray = [-1, 0, 1, 2];
                });

                afterEach(function () {

                    expect(array.length).toBe(newArray.length);

                    for(var i = 0; i < newArray.length; i++) {
                        expect(array[i]).toBe(newArray[i]);
                    }
                });

                it("should add the value to the front of the array", function () {
                    array.unshift(unshiftedValue);
                });

                it("should return the new length of the array", function () {
                    expect(array.unshift(unshiftedValue)).toBe(newArray.length);
                });

                it ("should notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {
                    var indexChangeListener = {
                        index0ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[0]);
                            expect(event.plus).toBe(newArray[0]);
                        },

                        index1ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[1]);
                            expect(event.plus).toBe(newArray[1]);
                        },

                        index2ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[2]);
                            expect(event.plus).toBe(newArray[2]);
                        },

                        index3ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[3]);
                            expect(event.plus).toBe(newArray[3]);
                        }
                    };

                    spyOn(indexChangeListener, 'index0ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index3ChangeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("0", indexChangeListener.index0ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("3", indexChangeListener.index3ChangeHandlerFunction, false);

                    array.unshift(unshiftedValue);

                    expect(indexChangeListener.index0ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index3ChangeHandlerFunction).toHaveBeenCalled();
                });

            });

            describe("multiple values", function () {

                var prevArray,
                    array,
                    unshiftedValues,
                    newArray;

                beforeEach(function () {
                    prevArray = [0, 1, 2];
                    array = [0, 1, 2];
                    unshiftedValues = [-2, -1];
                    newArray = [-2, -1, 0, 1, 2];
                });

                afterEach(function () {

                    expect(array.length).toBe(newArray.length);

                    for(var i = 0; i < newArray.length; i++) {
                        expect(array[i]).toBe(newArray[i]);
                    }
                });

                it("should add the values to the front of the array", function () {
                    array.unshift.apply(array, unshiftedValues);
                });

                it("should return the new length of the array", function () {
                    expect(array.unshift.apply(array, unshiftedValues)).toBe(newArray.length);
                });

                it ("should notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {
                    var indexChangeListener = {
                        index0ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[0]);
                            expect(event.plus).toBe(newArray[0]);
                        },

                        index1ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[1]);
                            expect(event.plus).toBe(newArray[1]);
                        },

                        index2ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[2]);
                            expect(event.plus).toBe(newArray[2]);
                        },

                        index3ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[3]);
                            expect(event.plus).toBe(newArray[3]);
                        },

                        index4ChangeHandlerFunction: function (event) {
                            expect(event.minus).toBe(prevArray[4]);
                            expect(event.plus).toBe(newArray[4]);
                        }
                    };

                    spyOn(indexChangeListener, 'index0ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index3ChangeHandlerFunction').andCallThrough();
                    spyOn(indexChangeListener, 'index4ChangeHandlerFunction').andCallThrough();

                    array.addPropertyChangeListener("0", indexChangeListener.index0ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("3", indexChangeListener.index3ChangeHandlerFunction, false);
                    array.addPropertyChangeListener("4", indexChangeListener.index4ChangeHandlerFunction, false);

                    array.unshift.apply(array, unshiftedValues);

                    expect(indexChangeListener.index0ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index3ChangeHandlerFunction).toHaveBeenCalled();
                    expect(indexChangeListener.index4ChangeHandlerFunction).toHaveBeenCalled();
                });

            });

        });

        describe("when reversing", function () {

            var array,
                prevArray,
                newArray;

            beforeEach(function () {
                prevArray = [0,1,2];
                array = [0,1,2];
                newArray = [2,1,0];
            });

            afterEach(function () {
                expect(array.length).toBe(newArray.length);

                for(var i = 0; i < newArray.length; i++) {
                    expect(array[i]).toBe(newArray[i]);
                }
            });

            it("should reverse the order of the array", function () {
                array.reverse();
            });

            it("should notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {
                var indexChangeListener = {
                    index0ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[0]);
                        expect(event.plus).toBe(newArray[0]);
                    },

                    index1ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[1]);
                        expect(event.plus).toBe(newArray[1]);
                    },

                    index2ChangeHandlerFunction: function (event) {
                        expect(event.minus).toBe(prevArray[2]);
                        expect(event.plus).toBe(newArray[2]);
                    }
                };

                spyOn(indexChangeListener, 'index0ChangeHandlerFunction').andCallThrough();
                spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();

                array.addPropertyChangeListener("0", indexChangeListener.index0ChangeHandlerFunction, false);
                array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);

                array.reverse();

                expect(indexChangeListener.index0ChangeHandlerFunction).toHaveBeenCalled();
                expect(indexChangeListener.index1ChangeHandlerFunction).not.toHaveBeenCalled();
                expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
            });

        });

        describe("when sorting", function () {

            var myArray, sortedArray;

            beforeEach(function () {
               myArray = ["alice", "eve", "carol", "bob", "david"];
               sortedArray = ["alice", "bob", "carol", "david", "eve"];
            });

            it("should return a reference to the sorted array", function () {
                    expect(myArray.sort()).toBe(myArray);
            });

            it("should sort the array without a given sorting function", function () {
                myArray.sort();

                for (var i = 0; i < sortedArray.length; i++) {
                    expect(myArray[i]).toBe(sortedArray[i]);
                }
            });

            it("TODO should sort the array with a given sorting function", function () {
            });

            describe("when observed for changes at any index", function () {

                it("TODO should dispatch a change for each index affected by the sort", function () {
                });

                it("TODO must not dispatch a change for an index unaffected by the sort", function () {
                });

            });

            describe("when observed for a change at the array itself", function () {

                it("TODO should dispatch a change for each index affected by the sort", function () {
                });

            });

        });

        describe("when splicing", function () {

            var array,
                prevArray,
                newArray,
                splicedValue,
                spliceIndex,
                spliceLength;

            beforeEach(function () {
                prevArray = [0, 1, 2];
                array = [0, 1, 2];
            });

            describe("to add a single object", function () {

                beforeEach(function () {
                    splicedValue = "foo";
                });

                describe("without replacement", function () {

                    beforeEach(function () {
                        spliceLength = 0;
                    });

                    describe("into the middle of an array", function () {

                        beforeEach(function () {
                            spliceIndex = 1;
                            newArray = [0, "foo", 1, 2];
                        });

                        it("should insert the element at the index specified", function () {
                            array.splice(spliceIndex, spliceLength, splicedValue);
                        });

                        it("should return an array of the removed elements, which will be empty", function () {
                            var replacedValues = array.splice(spliceIndex, spliceLength, splicedValue);
                            expect(replacedValues.length).toBe(0);
                        });

                        it("should notify listeners observing the array for 'change' events, providing the previous and new list values", function () {
                            var changeListener = {
                                changeHandlerFunction: function (event) {
                                    expect(event.minus.length).toBe(0);
                                    expect(event.plus.length).toBe(1);
                                    expect(event.plus[0]).toBe(splicedValue);
                                }
                            };

                            spyOn(changeListener, 'changeHandlerFunction').andCallThrough();

                            array.addPropertyChangeListener(null, changeListener.changeHandlerFunction, false);

                            array.splice(spliceIndex, spliceLength, splicedValue);

                            expect(changeListener.changeHandlerFunction).toHaveBeenCalled();
                        });

                        it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                            var indexChangeListener = {
                                indexChangeHandlerFunction: function (event) {
                                    throw "Did not expect to handle event for " + event.type;
                                }
                            };

                            spyOn(indexChangeListener, 'indexChangeHandlerFunction').andCallThrough();

                            array.addPropertyChangeListener("0", indexChangeListener.indexChangeHandlerFunction, false);
                            // Skipping event listeners on affected indices 1,2,3
                            array.addPropertyChangeListener("4", indexChangeListener.indexChangeHandlerFunction, false);

                            array.splice(spliceIndex, spliceLength, splicedValue);

                            expect(indexChangeListener.indexChangeHandlerFunction).not.toHaveBeenCalled();
                        });

                        it("should notify listeners observing affected indices of the array for 'change' events, detailing the diff at that index", function () {
                            var indexChangeListener = {
                                index1ChangeHandlerFunction: function (event) {
                                    expect(event.minus).toBe(prevArray[1]);
                                    expect(event.plus).toBe(newArray[1]);
                                },

                                index2ChangeHandlerFunction: function (event) {
                                    expect(event.minus).toBe(prevArray[2]);
                                    expect(event.plus).toBe(newArray[2]);
                                },

                                index3ChangeHandlerFunction: function (event) {
                                    expect(event.minus).toBe(prevArray[3]);
                                    expect(event.plus).toBe(newArray[3]);
                                }
                            };

                            spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                            spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();
                            spyOn(indexChangeListener, 'index3ChangeHandlerFunction').andCallThrough();

                            array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                            array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);
                            array.addPropertyChangeListener("3", indexChangeListener.index3ChangeHandlerFunction, false);

                            array.splice(spliceIndex, spliceLength, splicedValue);

                            expect(indexChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                            expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
                            expect(indexChangeListener.index3ChangeHandlerFunction).toHaveBeenCalled();
                        });

                    });

                });

                describe("with replacement", function () {

                    beforeEach(function () {
                        spliceLength = 1;
                    });

                    describe("into the middle of an array", function () {

                        beforeEach(function () {
                            spliceIndex = 1;
                            newArray = [0, "foo", 2];
                        });

                        it("should insert the element at the index specified", function () {
                            array.splice(spliceIndex, spliceLength, splicedValue);
                        });

                        it("should return an array of the removed elements", function () {
                            var replacedValues = array.splice(spliceIndex, spliceLength, splicedValue);
                            expect(replacedValues.length).toBe(1);
                            expect(replacedValues[0]).toBe(1);
                        });

                        it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                            var indexChangeListener = {
                                indexChangeHandlerFunction: function (event) {
                                    throw "Did not expect to handle event for " + event.type;
                                }
                            };

                            spyOn(indexChangeListener, 'indexChangeHandlerFunction').andCallThrough();

                            array.addPropertyChangeListener("0", indexChangeListener.indexChangeHandlerFunction);
                            // Skipping event listener on change@1, that's the affected index
                            // There should be no change@2 because we added and removed the same number of elements
                            array.addPropertyChangeListener("2", indexChangeListener.indexChangeHandlerFunction);

                            array.splice(spliceIndex, spliceLength, splicedValue);

                            expect(indexChangeListener.indexChangeHandlerFunction).not.toHaveBeenCalled();
                        });

                        it("should notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {
                            var index1ChangeListener = {
                                index1ChangeHandlerFunction: function (event) {
                                    expect(event.minus).toBe(prevArray[1]);
                                    expect(event.plus).toBe(splicedValue);
                                }
                            };

                            spyOn(index1ChangeListener, 'index1ChangeHandlerFunction').andCallThrough();

                            array.addPropertyChangeListener("1", index1ChangeListener.index1ChangeHandlerFunction, false);

                            var removedValues = array.splice(spliceIndex, spliceLength, splicedValue);

                            expect(index1ChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                        });

                    });

                });

                afterEach(function () {
                    expect(array.length).toBe(newArray.length);

                    for(var i = 0; i < newArray.length; i++) {
                        expect(array[i]).toBe(newArray[i]);
                    }
                });

            });

            xdescribe("to add multiple objects", function () {

                it ("must not notify listeners observing unaffected indices of the array for 'change' events", function () {

                });

            });

            describe("to remove a single object", function () {

                beforeEach(function () {
                    spliceLength = 1;
                });

                describe("from the middle of an array", function () {

                    beforeEach(function () {
                        spliceIndex = 1;
                        newArray = [0, 2];
                    });

                    it("should remove the element at the index specified", function () {
                        array.splice(spliceIndex, spliceLength);
                    });

                    it("should return an array of the removed elements", function () {
                        var replacedValues = array.splice(spliceIndex, spliceLength);
                        expect(replacedValues.length).toBe(1);
                        expect(replacedValues[0]).toBe(1);
                    });

                    it("should notify listeners observing the array for 'change' events, providing the previous and new list values", function () {
                        var changeListener = {
                            changeHandlerFunction: function (event) {
                                expect(event.minus.length).toBe(1);
                                expect(event.minus[0]).toBe(prevArray[1]);
                                expect(event.plus.length).toBe(0);
                            }
                        };

                        spyOn(changeListener, 'changeHandlerFunction').andCallThrough();

                        array.addPropertyChangeListener(null, changeListener.changeHandlerFunction, false);

                        array.splice(spliceIndex, spliceLength);

                        expect(changeListener.changeHandlerFunction).toHaveBeenCalled();
                    });

                    it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {
                        var indexChangeListener = {
                            indexChangeHandlerFunction: function (event) {
                                throw "Did not expect to handle event for " + event.type;
                            }
                        };

                        spyOn(indexChangeListener, 'indexChangeHandlerFunction').andCallThrough();

                        array.addEventListener("change@0", indexChangeListener.indexChangeHandlerFunction, false);
                        // Skipping event listeners on affected indices 1,2
                        array.addEventListener("change@3", indexChangeListener.indexChangeHandlerFunction, false);

                        array.splice(spliceIndex, spliceLength);

                        expect(indexChangeListener.indexChangeHandlerFunction).not.toHaveBeenCalled();
                    });

                    it("should notify listeners observing affected indices of the array for 'change' events, providing the previous and new values at that index", function () {
                        var indexChangeListener = {
                            index1ChangeHandlerFunction: function (event) {
                                expect(event.minus).toBe(prevArray[1]);
                                expect(event.plus).toBe(newArray[1]);
                            },

                            index2ChangeHandlerFunction: function (event) {
                                expect(event.minus).toBe(prevArray[2]);
                                expect(event.plus).toBe(newArray[2]);
                            }
                        };

                        spyOn(indexChangeListener, 'index1ChangeHandlerFunction').andCallThrough();
                        spyOn(indexChangeListener, 'index2ChangeHandlerFunction').andCallThrough();

                        array.addPropertyChangeListener("1", indexChangeListener.index1ChangeHandlerFunction, false);
                        array.addPropertyChangeListener("2", indexChangeListener.index2ChangeHandlerFunction, false);

                        array.splice(spliceIndex, spliceLength);

                        expect(indexChangeListener.index1ChangeHandlerFunction).toHaveBeenCalled();
                        expect(indexChangeListener.index2ChangeHandlerFunction).toHaveBeenCalled();
                    });
                });

                afterEach(function () {
                    expect(array.length).toBe(newArray.length);

                    for(var i = 0; i < newArray.length; i++) {
                        expect(array[i]).toBe(newArray[i]);
                    }
                });


            });

            xdescribe("to remove multiple objects", function () {

                it("must not notify listeners observing unaffected indices of the array for 'change' events", function () {

                });

            });

        });

    });

    describe("when detecting any", function () {

        it("should have an any method exposed", function () {
            expect([].any).toBeTruthy();
        });

        describe("when no property path is provided", function () {

            it("should return false for an empty array", function () {
                expect([].any()).toBe(false);
            });

            it("should return false for an array with no truthy values", function () {
                expect([0, false, null].any()).toBe(false);
            });

            it("should return true for an array with any truthy values", function () {
                expect([0, false, null, true].any()).toBe(true);
            });

        });

        describe("when a property path is provided", function () {

            it("should return false for an empty array", function () {
                expect([].any("a.b")).toBe(false);
            });

            it("should return false for an array with no truthy values", function () {
                expect([{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}].any("a.b")).toBe(false);
            });

            it("should return true for an array with any truthy values", function () {
                expect([{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}, {a: {b: true}}].any("a.b")).toBe(true);
            });

        });

    });


});
