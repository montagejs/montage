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
/**
 @module montage/ui/controller/array-controller
 @requires montage/core/core
 @requires montage/ui/controller/object-controller
 @requires montage/core/change-notification
 */
var Montage = require("montage").Montage,
    ObjectController = require("ui/controller/object-controller").ObjectController,
    ChangeNotification = require("core/change-notification").ChangeNotification;
/**
    The ArrayController helps with organizing a collection of objects, and managing user selection within that collection.
    TYou can assign an ArrayController instance as the <code>contentProvider</code> property for a Montage List or Repetition object.
    @class module:montage/ui/controller/array-controller.ArrayController
    @classdesc
    @extends module:montage/ui/controller/object-controller.ObjectController
*/
var ArrayController = exports.ArrayController = Montage.create(ObjectController, /** @lends module:montage/ui/controller/array-controller.ArrayController# */ {

    didCreate: {
        value: function() {
            var self = this;

            // TODO optimize this, try to use dependentProperties perhaps

            this.addPropertyChangeListener("selections", function() {

                var newSelectedIndexes = [];
                self._selections.forEach(function(item, i) {
                    if (item) {
                        newSelectedIndexes.push(i);
                    }
                });

                // TODO this triggers an infinite loop
                self.selectedIndexes = newSelectedIndexes;
            });

            this.addPropertyChangeListener("content", function() {
                // TODO for right now assume that any content change invalidates the selection completely;
                // we'll need to address this of course
                self.selectedObjects = null;

                if (self.automaticallyOrganizeObjects) {
                    self.organizeObjects();
                }
            });
        }
    },

    /**
     @private
     */
    _content: {
        value: null
    },

    /**
        The content managed by the ArrayController.
        @type {Function}
        @default {String} null
    */
    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {

            if (this._content === value) {
                return;
            }
            this._content = value;

        }
    },

    /**
     The user-defined delegate object for the ArrayController.<br>
     If a delegate object exists, the ArrayController will notify the delegate of changes to the collection, or the selection.<br>
     Currently, the only supported delegate method is <code>shouldChangeSelection</code>, which passes the new and old selected objects.<br>
     If the function returns false the selection action is canceled.
     @type {Object}
     @default null
     @example
     var ArrayController = require("ui/controller/array-controller").ArrayController;
     var controller = ArrayController.create();
     controller.delegate = Montage.create(Object.prototype, {
     shouldChangeSelection: function(newObj, oldObj) {
     console.log("New object is", newObj, "Old object is", oldObj);
     }
     })
     */
    delegate: {
        value: null
    },

    /**
     @private
     */
    _organizedObjects: {
        distinct: true,
        value: []
    },

    /**
     The filtered and sorted content of the ArrayCollection.
     @type {Function}
     @default null
     */
    organizedObjects: {
        get: function() {
            return this._organizedObjects;
        }
    },

    /**
     Specifies whether the ArrayCollection's content is automatically organized.
     @type {Property}
     @default {Boolean} true
     */
    automaticallyOrganizeObjects: {
        value: true
    },

    /**
     @private
     */
    _sortFunction: {
        value: null
    },

    /**
     The sort function used to organize the array collection.
     @type {Function}
     @default null
     @version 1.0
     */
    sortFunction: {
        get: function() {
            return this._sortFunction;
        },
        set: function(value) {

            if (this._sortFunction === value) {
                return;
            }

            this._sortFunction = value;

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /**
     @private
     */
    _filterFunction: {
        value: null
    },

    /**
     The filter function used to organize the array collection.
     @type {Function}
     @default null
     @version 1.0
     */
    filterFunction: {
        get: function() {
            return this._filterFunction;
        },
        set: function(value) {

            if (this._filterFunction === value) {
                return;
            }

            this._filterFunction = value;

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /**
        @private
    */
    _startIndex: {
        value: null
    },

    /**
        The start index of the organized objects.
        @type {Function}
        @default null
        @version 1.0
    */
    startIndex: {
        get: function() {
            return this._startIndex;
        },
        set: function(value) {

            if (this._startIndex === value) {
                return;
            }

            this._startIndex = value;

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /**
        @private
    */
    _endIndex: {
        enumerable: false,
        value: null
    },

    /**
        The start index of the organized objects.
        @type {Function}
        @default null
        @version 1.0
    */
    endIndex: {

        get: function() {
            return this._endIndex;
        },
        set: function(value) {

            if (this._endIndex === value) {
                return;
            }

            this._endIndex = value;

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /*
        @private
    */
    _organizedObjectsIndexes: {
        value: null
    },

    /*
        @private
    */
    _rangedOrganizedObjectsIndexes: {
        value: null
    },

    /**
        @private
     */
    _selectedIndexes: {
        value: null
    },

   /**
        Description TODO
        @type {Function}
        @default null
    */
    selectedIndexes: {
        get: function() {

            if (this._selectedIndexes) {
                return this._selectedIndexes;
            }

            if (!this.selectedContentIndexes) {
                return null;
            }
            return this._selectedIndexes = this._convertIndexesFromContentToOrganized(this.selectedContentIndexes);
        },
        set: function(value) {
            if (this.selectedIndexes !== value) {
                var newIndexes = value ? this._convertIndexesFromOrganizedToContent(value) : null,
                    newSelection = null;

                if (this.delegate && typeof this.delegate.shouldChangeSelection === "function") {
                    if (newIndexes) {
                        newSelection = this.content.filter(function(value, i) {
                            return newIndexes.indexOf(i) >= 0;
                        }, this);
                    }

                    if (this.delegate.shouldChangeSelection(this, newSelection, this._selectedObjects) === false) {
                        return;
                    }
                }


                // _selectedIndexes is assigned in the dispatcher because "selectedContentIndexes", "selectedObjects" and "selections" depend on _selectedIndexes, so in order to have a correct "minus" (and prevent the premature creation of those values) in the notification we need to hold back the change.
                this.dispatchPropertyChange("selections", "selectedContentIndexes", "selectedObjects", function() {
                    this._selectedIndexes = value;
                    this._selectedContentIndexes = newIndexes;
                    this._selectedObjects = null;
                    this._selections = null;
                });
            }
        }
    },

    /**
     @private
     */
    _convertIndexesFromOrganizedToContent: {
        value: function(indexes) {
            var index, selectedContentIndexes = [], lookup, valueLength = indexes.length, selectedIndex, lookupLength;
            // if _rangedOrganizedObjectsIndexes != null we have applied a range
            lookup = this._rangedOrganizedObjectsIndexes ? this._rangedOrganizedObjectsIndexes : this._organizedObjectsIndexes;
            if (lookup) {
                lookupLength = lookup.length;
                for (index = 0; index < valueLength ; index++) {
                    selectedIndex = indexes[index];
                    if(selectedIndex < lookupLength && selectedIndex >= 0) {
                        selectedContentIndexes[selectedContentIndexes.length] = lookup[selectedIndex];
                    }
                }
            } else {
                // then it's just a range with not filter or sort
                for (index = 0; index < valueLength ; index++) {
                    selectedContentIndexes[selectedContentIndexes.length] = indexes[index] + this.startIndex;
                }
            }
            return selectedContentIndexes.sort();
        }
    },

    /**
     @private
     */
    _convertIndexesFromContentToOrganized: {
        value: function(indexes) {
            var index, selectedOrganizedIndexes = [], lookup, valueLength = indexes.length, selectedIndex;
            // if _rangedOrganizedObjectsIndexes != null we have applied a range
            lookup = this._rangedOrganizedObjectsIndexes ? this._rangedOrganizedObjectsIndexes : this._organizedObjectsIndexes;
            if (lookup) {
                for (index = 0; index < valueLength ; index++) {
                    selectedIndex = indexes[index];
                    if (selectedIndex >= 0) {
                        selectedIndex = lookup.indexOf(selectedIndex);
                        if (selectedIndex !== -1) {
                            selectedOrganizedIndexes[selectedOrganizedIndexes.length] = selectedIndex;
                        }
                    }
                }
            } else {
                // then it's just a range with not filter or sort
                for (index = 0; index < valueLength ; index++) {
                    selectedIndex = indexes[index] - this.startIndex;
                    // Check if we are within the range of the current organizedObjects
                    if(selectedIndex > -1 && (this.endIndex == null || selectedIndex < this.endIndex)) {
                        selectedOrganizedIndexes[selectedOrganizedIndexes.length] = selectedIndex;
                   }
                }
            }
            return selectedOrganizedIndexes.sort();
        }
    },

    /**
        Organizes the array collection using the filter and sort functions, if defined.<br>
        Dispatches a change event.
        @function
        @fires change@organizeObjects
    */
    organizeObjects: {
        value: function() {

            var organizedObjects = this.content,
                filterFunction = this.filterFunction,
                sortFunction = this.sortFunction,
                index = 0,
                newIndex = 0,
                filteredIndexes,
                sortedIndexes,
                tmpArray, item;

            if (organizedObjects && typeof filterFunction === "function") {
                filteredIndexes = [];
                organizedObjects = organizedObjects.filter(function filterFunctionWrapper(item) {
                    var filterValue = filterFunction.call(this, item);
                    if (filterValue) {
                        // we are going to keep the item in the new array
                        filteredIndexes[newIndex] = index;
                        newIndex++;
                    }
                    index++;
                    return filterValue;
                }, this);
            }

            if (typeof sortFunction === "function") {

                // need to attach index information so that we can pick it up after the sort
                // this has the added side effect of creating a clone of the array so that if it wasn't filtered,
                // we are not editing the content directly
                sortedIndexes = [];
                tmpArray = [];
                index = 0;

                for (index = 0; (item = organizedObjects[index]); index++) {
                    if (item !== null && typeof item === "object") {
                        // attach the index
                        item._montage_array_controller_index = index;
                        tmpArray[index] = item;
                    } else {
                        // wrap in a host object
                        tmpArray[index] = {
                            _montage_array_controller_index : index,
                            _montage_array_controller_value : item
                        };
                    }
                }

                // Do the sort
                tmpArray = tmpArray.sort(function sortFunctionWrapper(a, b) {
                    if (a._montage_array_controller_value) {
                        a = a._montage_array_controller_value;
                    }
                    if (b._montage_array_controller_value) {
                        b = b._montage_array_controller_value;
                    }
                    return sortFunction.call(this, a, b);
                });

                // get all the new indexes
                organizedObjects = [];
                for (index = 0; (item = tmpArray[index]); index++) {
                    newIndex = item._montage_array_controller_index;
                    sortedIndexes[index] = filteredIndexes ? filteredIndexes[newIndex] : newIndex;
                    if (item._montage_array_controller_value) {
                        organizedObjects[index] = item._montage_array_controller_value;
                    } else {
                        organizedObjects[index] = item;
                        delete item._montage_array_controller_index;
                    }
                }
                // store it for later use
                this._organizedObjectsIndexes = sortedIndexes;
            } else {
                // store it for later use
                this._organizedObjectsIndexes = filteredIndexes;
            }

            this._applyRangeIfNeeded(organizedObjects);
        }
    },

    /**
        @private
    */
    _applyRangeIfNeeded: {
        value: function(organizedObjects) {

            var startIndex = this.startIndex,
                endIndex = this.endIndex;


            // We apply the range after the content is filtered and sorted
            if (organizedObjects && (typeof startIndex === "number" || typeof endIndex === "number")) {
                startIndex = typeof startIndex === "number" && startIndex >= 0 ? startIndex : 0;
                endIndex = typeof endIndex === "number" && endIndex < organizedObjects.length ? endIndex : organizedObjects.length;
                // apply the range
                organizedObjects = organizedObjects.slice(startIndex, endIndex);
                // store the index lookup change
                if(this._organizedObjectsIndexes) {
                    this._rangedOrganizedObjectsIndexes = this._organizedObjectsIndexes.slice(startIndex, endIndex);
                } else {
                    this._rangedOrganizedObjectsIndexes = null;
                }
            }

            // I don't want to provide a setter for organizedObjects, so update the cached value and notify observers that
            // the organizedObjects property changed
            this.dispatchPropertyChange("organizedObjects", function() {
                this._organizedObjects = organizedObjects ? organizedObjects : [];
            });
        }
    },

    /**
     @private
     */
    _selectedObjects: {
        value: null
    },

    /**
     Gets or sets the selected objects in the collection.<br>
     Setting the selected objects to a new value fires an event of type <code>change@selectedObjects</code>.
     @type {Function}
     @default null
     @fires change@selectedContentIndexes
     */
    selectedObjects: {
        get: function() {

            if (this._selectedObjects) {
                return this._selectedObjects;
            }

            if (!this._selectedContentIndexes) {
                return null;
            }

            if(this.content) {
                this._selectedObjects = this.content.filter(function(value, i) {
                    return this._selectedContentIndexes.indexOf(i) >= 0;
                }, this);
            }

            return this._selectedObjects;
        },
        set: function(value) {

            // Normalizing the value before the difference check prevents false-positive "changes" for things like [x]=>x
            if (value === null || typeof value === "undefined") {
                // undefined => null
                value = null;
            } else if (!Array.isArray(value)) {
                // any single object, including false and zero
                value = [value];
            }

            // TODO validate the array content maybe?

            if (this.selectedObjects === value) {
                return;
            }

            if (this.delegate && typeof this.delegate.shouldChangeSelection === "function") {
                if (this.delegate.shouldChangeSelection(this, value, this._selectedObjects) === false) {
                    return;
                }
            }

            // _selectedObjects is assigned in the dispatcher because "selectedContentIndexes", "selectedIndexes" and "selections" depend on _selectedObjects, so in order to have a correct "minus" (and prevent the premature creation of those values) in the notification we need to hold back the change.
            this.dispatchPropertyChange("selections", "selectedContentIndexes", "selectedIndexes", function() {
                this._selectedObjects = value;
                this._selectedContentIndexes = null;
                this._selectedIndexes = null;
                this._selections = null;
            });
        }
    },

    /**
     @private
     */
    _selectedContentIndexes: {
        value: null
    },

    /**
     Gets or sets the indexes of the currently selected items in the collection.<br>
     When set to a new set of indexes, generates a event of type "change@selectedObjects".
     @type {Function}
     @default null
     */
    selectedContentIndexes: {
        get: function() {

            if (this._selectedContentIndexes) {
                return this._selectedContentIndexes;
            }

            if (!this._selectedObjects) {
                return null;
            }

            this._selectedContentIndexes = [];
            var selectedIndex;
            this._selectedObjects.forEach(function(value) {
                if((selectedIndex = this.content.indexOf(value)) !== -1) {
                     this._selectedContentIndexes.push(selectedIndex);
                }
            }, this);

            return this._selectedContentIndexes;
        },
        set: function(value) {
            // Normalizing the value before the difference check prevents false-positive "changes" for things like [x]=>x
            if (value === null || value === false || typeof value === "undefined") {
                // undefined, false => null
                value = null;
            } else if (!Array.isArray(value)) {
                // any single index, including zero
                value = [value];
            }

            // TODO validate the array content maybe?

            if (this.selectedContentIndexes === value) {
                return;
            }

            if (this.delegate && typeof this.delegate.shouldChangeSelection === "function") {
                var newIndexes = value, newSelection = null;

                if (newIndexes) {
                    newSelection = this.content.filter(function(value, i) {
                        return newIndexes.indexOf(i) >= 0;
                    }, this);
                }

                if (this.delegate.shouldChangeSelection(this, newSelection, this._selectedObjects) === false) {
                    return;
                }
            }

            this._selectedContentIndexes = value;

            this.dispatchPropertyChange("selections", "selectedIndexes", "selectedObjects", function() {
                this._selectedIndexes = null;
                this._selectedObjects = null;
                this._selections = null;
            });

        }
    },

    // parse array with same length as objects but contains true / false(falsy)
    _selections: {value: null},
    selections: {
        get: function() {
            if (!this._selections) {

                this._selections = new Array(this._organizedObjects.length);

                if (this.selectedIndexes) {

                    var selections = this._selections,
                        selectedIndexes = this.selectedIndexes,
                        selectedIndexCount = selectedIndexes.length,
                        i,
                        index;

                    for (i = 0; i < selectedIndexCount; i++) {
                        index = selectedIndexes[i];
                        if (index < selections.length) {
                            selections[index] = true;
                        }
                    }
                }

            }
            return this._selections;
        }
    },


    /**
     Initalizes the ArrayController with the specified content.
     @function
     @param {Object} content The collection of objects for the ArrayController to manage.
     @returns {ArrayController}
     */

    initWithContent: {
        value: function(content) {
            this.content = content;
            return this;
        }
    },

    /**
     A Boolean that specifies whether new objects that are added to the array collection are automatically selected.
     @type {Property}
     @default {Boolean} false
     */
    selectObjectsOnAddition: {
        value: false
    },

    /**
     A Boolean that specifies whether the filter function is set to null when new objects that are added to the content.
     @type {Property}
     @default {Boolean} true
     */
    clearFilterFunctionOnAddition: {
        value: true
    },

    /**
     Adds an item to the array collection's <code>content</code> property.
     @function
     @example
     var ArrayCollection = require("ui/controller/array-controller").ArrayCollection;
     var ac = ArrayCollection.create();
     ac.add({name: "John"});
     */
    add: {
        value: function() {

            var newObject = this.newObject();
            this.content.push(newObject);

            //TODO fdf what do we do with the filterFunction if the newObject wouldn't show?
            if (this.selectObjectsOnAddition) {
                this.selectedContentIndexes = [this.content.length-1];
            }
            if (this.clearFilterFunctionOnAddition) {
                this.filterFunction = null;
            } else {

            }

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /**
     Adds one or more items to the array controller's <code>content</code> property.
     @function
     @example
     var ArrayCollection = require("ui/controller/array-controller").ArrayCollection;
     var ac = ArrayCollection.create();
     ac.addObjects( {label: "News"}, {label: "Sports"}, {label: "Weather"} );
     */
    addObjects: {
        value: function() {

            var objects = Array.prototype.slice.call(arguments),
                i,
                objectCount = objects.length,
                selectedContentIndexes, firstIndex,
                content = this.content;

            if (content) {
                content.push.apply(content, objects);
            } else {
                this.content = content = objects;
            }

            if (this.selectObjectsOnAddition) {
                selectedContentIndexes = [];
                firstIndex = content.length-objectCount;
                for (i = 0; i < objectCount; i++) {
                    selectedContentIndexes[i] = firstIndex++;
                }
                this.selectedContentIndexes = selectedContentIndexes;
                this.selectedObjects = objects;
            }

            if (this.clearFilterFunctionOnAddition) {
                this.filterFunction = null;
            }

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }
        }
    },

    /**
     Removes the currently selected item or items in the collection.
     @function
     */
    remove: {
        value: function() {

            var removedObjects;

            if (this.selectedObjects && this.selectedObjects.length > 0) {
                removedObjects = this.removeObjects.apply(this, this.selectedObjects);

                if (this.automaticallyOrganizeObjects) {
                    this.organizeObjects();
                }
            }
            return removedObjects;
        }
    },

    /**
     Removes the specified object or objects from the collection.
     @function
     */
    removeObjects: {
        value: function() {
            var objectsToRemove = Array.prototype.slice.call(arguments),
                remainingObjects;

            // TODO what do we do if there are no arguments? (should this be where we solve the problem of calling remove with no selection?)

            remainingObjects = this.content.filter(function(value) {
                return objectsToRemove.indexOf(value) < 0;
            });

            this.content = remainingObjects;

            //TODO abandon selection? preserve what we can of the selection?

            if (this.automaticallyOrganizeObjects) {
                this.organizeObjects();
            }

            return objectsToRemove;

        }
    },

    removeObjectsAtSelectedIndexes: {
        value: function() {
            return this.removeObjectsAtIndexes(this.selectedIndexes);
        }
    },

    removeObjectsAtIndexes: {
        value: function(indices) {
            var removedObjects,
                remainingObjects;

            if(indices && indices.length > 0) {
                removedObjects = [];
                remainingObjects = this.content.filter(function(value, index) {
                    if (indices.indexOf(index) < 0) {
                        return true;
                    } else {
                        removedObjects.push(value);
                        return false
                    };
                });
                this.content = remainingObjects;
                if (this.automaticallyOrganizeObjects) {
                    this.organizeObjects();
                }
            }

            return removedObjects;
        }
    }

});
