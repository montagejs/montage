/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/repetition.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/template
    @requires montage/core/logger
    @requires montage/core/gate
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Template = require("ui/template").Template,
    logger = require("core/logger").logger("repetition"),
    Gate = require("core/gate").Gate;
/**
 @class module:"montage/ui/repetition.reel".Repetition
 @extends module:montage/ui/component.Component
 */
var Repetition = exports.Repetition = Montage.create(Component, /** @lends module:"montage/ui/repetition.reel".Repetition# */{
    /**
     Description TODO
     */
    hasTemplate: {value: false},

/**
    @private
*/
    _hasBeenDeserialized: {
        value: false,
        enumerable: false
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    USE_FLATTENING: {
        enumerable: false,
        value: false
    },

/**
  Description TODO
  @private
*/
    _nextDeserializedItemIx: {
        enumerable: false,
        value: 0,
        distinct: true
    },
/**
    Description TODO
    @function
    @returns itself
    */
    init: {
        enumerable: false,
        value: function() {
            this._items = [];
            this._itemsToAppend = [];
            this._nextDeserializedItemIx = 0;
            this._itemsToRemove = [];
            this._deletedItems = [];
            return this;
        }
    },
/**
  Description TODO
  @private
*/
    _contentController: {
        enumerable: false,
        value: null
    },
/**
        The collection of items managed the Repetition.
        @type {Function}
        @default null
    */
    contentController: {
        enumerable: false,
        get: function() {
            return this._contentController;
        },
        set: function(value) {
            if (this._contentController === value) {
                return;
            }

            if (this._contentController) {
                Object.deleteBinding(this, "objects");
                //Object.deleteBinding(this, "selectedIndexes");
            }

            this._contentController = value;

            if (this._contentController) {

                // If we're already getting contentController related values from other bindings...stop that
                if (this._bindingDescriptors) {
                    Object.deleteBinding(this, "objects");
                }

                // And bind what we need from the new contentController
                var objectsBindingDescriptor;

                objectsBindingDescriptor = {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "organizedObjects",
                    oneway: true
                };

                // If we're ready for bindings...go ahead an install
                // TODO: Look at changing this once the new serialization has been implemented
                if (this._hasBeenDeserialized) {
                    Object.defineBinding(this, "objects", objectsBindingDescriptor);
                } else {
                    // otherwise we need to defer it until later; we haven't been deserialized yet
                    if (!this._controllerBindingsToInstall) {
                        this._controllerBindingsToInstall = {};
                    }

                    this._controllerBindingsToInstall.objects = objectsBindingDescriptor;
                }
            }

            //TODO otherwise if no contentController should we disable selections?

        }
    },
/**
  Description TODO
  @private
*/
    _objects: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    objects: {
        enumerable: false,
        get: function() {
            return this._objects;
        },
        set: function(value) {
            if (logger.isDebug) {
                logger.debug(this, " set objects:", value.length, value, "same objects?", value === this._objects);
            }
            this._objects = value;

            // Objects have changed, clear the selectedIndexes, if we're managing our own selection
            if (!this.contentController) {
                this.selectedIndexes = null;
            }

            if (this._isComponentExpanded) {
                this._refreshItems();
            }
        },
        modify: function(modificationType, newValue, oldValue) {
            this.selectedIndexes = null;

            if (this._isComponentExpanded) {
                this._refreshItems();
            }
        }
    },
/**
  Description TODO
  @private
*/
    _isSelectionEnabled: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    isSelectionEnabled: {
        get: function() {
            return this._isSelectionEnabled;
        },
        set: function(value) {
            if (value === this._isSelectionEnabled) {
                return;
            }

            this._isSelectionEnabled = value;

            if (this._isComponentExpanded) {
                this._refreshSelectionTracking();
            }
        }
    },
/**
  Description TODO
  @private
*/
    _childLoadedCount: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _childComponentsCount: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
  Description TODO
  @private
*/
    _expectedChildComponentsCount: {
        enumerable: false,
        serializable: true,
        value: null
    },
    /* Format: {firstNode, lastNode}*/

 /**
  Description TODO
  @private
*/
    _items: {
        enumerable: false,
        value: [],
        distinct: true
    },
/**
  Description TODO
  @private
*/
    _itemsToAppend: {
        enumerable: false,
        value: [],
        distinct: true
    },
/**
  Description TODO
  @private
*/
    _itemsToRemove: {
        enumerable: false,
        value: [],
        distinct: true
    },
/**
  Description TODO
  @private
*/
    _deletedItems: {
        enumerable: false,
        value: [],
        distinct: true
    },
/**
  Description TODO
  @private
*/
    _iterationFragment: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _refreshingItems: {
        value: false
    },
/**
  Description TODO
  @private
*/
    _refreshItems: {
        value: function() {

            if (this._refreshingItems) {
                return;
            }
            this._refreshingItems = true;

            var objectCount = this._objects ? this._objects.length : 0,
                itemCount = this._items.length + this._itemsToAppend.length,
                neededItemCount = objectCount - itemCount,
                i;

            // TODO: this needs to be here because the repetition might be ready to draw during a call to _addItem (if all modules are already loaded).
            // The problem is that when the gate is open, and the repetition hasn't ask to be drawn, the _canDraw = true will never happen and it will not happen when needsDraw = true afterwards. This kind of sucks because it means the needsDraw=true and the opening of the Gate needs to be in the correct order.
            // needsDraw should do _canDraw = true if the gate was opened, but we need to be careful since _canDraw=true only works if there was a previous _canDraw=false.
            if (0 !== neededItemCount) {
                this.needsDraw = true;
            }

            // TODO what if instead of actually adding/removing (effectively loading and unloading child components) at this
            // point, we instead only changed the count or something about how many items are needed...
            // only after that count is changed such that we know how many items we will need to load
            // do we then try to add them
            // each one of these addItem calls triggers a refreshItems
            // or well I'm trying a flag right
            if (neededItemCount > 0) {
                // _addItem might be completly synchrounous since we cache both template and deserializer so we need to set this before adding any item otherwise it will trigger a draw after every iteration template instantiation.
                this._expectedChildComponentsCount += this._childComponentsCount * neededItemCount;
                // Need to add more items
                for (i = 0; i < neededItemCount; i++) {
                    this._addItem();
                }
            } else if (neededItemCount < 0) {
                // Need to remove extra items
                for (i = neededItemCount; i < 0; i++) {
                    this._deleteItem();
                }
            }

            this._refreshingItems = false;
            // Otherwise, no change in length; don't add or remove items
            // bindings should already be in place
        }
    },
/**
  Description TODO
  @private
*/
    _addItem: {value: function() {
        var self = this,
            items = this._items,
            childComponents,
            childComponent,
            componentsCount,
            index,
            componentStartIndex,
            componentEndIndex,
            canDrawGate = self.canDrawGate;

        // TODO simply pop from deletedItems if we have any in that pool
        this._currentItem = {};

        // TODO when do we actually consider the item part of the "items" array? now or after drawing?
        // right now I think we want to say if it's not in the DOM; it's not in the items list
        // for clarity sake
        this._itemsToAppend.push(this._currentItem);
        index = items.length + this._itemsToAppend.length - 1;

        canDrawGate.setField("iterationLoaded", false);
        self._canDraw = false;
        componentsCount = this._childComponentsCount;

        this._iterationTemplate.instantiateWithComponent(this, function() {
            if (componentsCount === 0) {
                canDrawGate.setField("iterationLoaded", true);
            } else {
                childComponents = self.childComponents;
                componentStartIndex = index * self._childComponentsCount;
                componentEndIndex = componentStartIndex + componentsCount;
                for (var i = componentStartIndex; i < componentEndIndex; i++) {
                    childComponent = childComponents[i];
                    childComponent.element.id = childComponent.element.id + "-" + index;
                    childComponent.needsDraw = true;
                    childComponent.loadComponentTree(function() {
                        if (++self._childLoadedCount === self._expectedChildComponentsCount) {
                            canDrawGate.setField("iterationLoaded", true);
                        }
                    });
                }
            }
        });
    }},
/**
  Description TODO
  @private
*/
    _deleteItem: {value: function() {

        var deletedItem, itemIndex, removedComponents, childComponents = this.childComponents, childComponentsCount = this._childComponentsCount,
            itemsToAppendCount = this._itemsToAppend.length;
        if (itemsToAppendCount > 0) {
            // We caught the need to remove these items before they got inserted
            // just don't bother appending them
            deletedItem = this._itemsToAppend.pop();
            this._deletedItems.push(deletedItem);
            if (--itemsToAppendCount <= this._nextDeserializedItemIx) {
                this._nextDeserializedItemIx = itemsToAppendCount;
            }
        } else if (this._items.length > 0) {
            // No items were scheduled for appending, so we need to extract some
            deletedItem = this._items.pop();
            this._itemsToRemove.push(deletedItem);
        }

        if (childComponentsCount > 0) {
            removedComponents = childComponents.splice(childComponents.length - childComponentsCount, childComponentsCount);
            this._childLoadedCount -= childComponentsCount;
            this._expectedChildComponentsCount -= childComponentsCount;
            for (var i = 0, l = removedComponents.length; i < l; i++) {
                this.cleanupDeletedComponentTree(removedComponents[i]);
            }
        }
    }},

    _iterationTemplate: {
        enumerable: false,
        serializable: true,
        value: null
    },
/**
    Description TODO
    @function
    @param {Function} callback The callback method.
    */
    expandComponent: {value: function expandComponent(callback) {
        var self = this,
            childComponents = this.childComponents,
            childComponent;

        this.setupIterationSerialization();
        this._childComponentsCount = childComponents.length;

        if (this._childComponentsCount > 0) {
            this._templateId = childComponents[0]._suuid || childComponents[0].uuid;
            this._iterationTemplate = Template.templateWithComponent(this);
        } else {
            this._iterationTemplate = Template.create().initWithComponent(this);
        }

        // just needed to create the iteration Template, so we get rid of it.
        this.removeIterationSerialization();

        while ((childComponent = this.childComponents.shift())) {
            if (childComponent.needsDraw) {
                childComponent.needsDraw = false;
            }
        }
        this.childComponents = [];

        this._iterationFragment = this.element.ownerDocument.createDocumentFragment();

        if (this.USE_FLATTENING) {
            this._iterationTemplate.flatten(function() {
                if (logger.debug) {
                    logger.debug(self, "Flattened version:  " + self._iterationTemplate.exportToString());
                }
                self._isComponentExpanded = true;
                // if objects property was set before we could add the items do it now (we needed the iteration template in place)
                if (self.objects && (self.objects.length !== self._items.length)) {
                    self._refreshItems();
                }

                if (callback) {
                    callback();
                }
            });
        } else {
            this._isComponentExpanded = true;
            // if objects property was set before we could add the items do it now (we needed the iteration template in place)
            if (this.objects && (this.objects.length !== this._items.length)) {
                this._refreshItems();
            }

            if (callback) {
                callback();
            }
        }

    }},

    templateDidLoad: {value: function() {
        var range = document.createRange(),
            item = this._deserializedItem;

        range.selectNodeContents(item.element);
        delete item.element;
        item.fragment = range.extractContents();
    }},

    deserializedFromTemplate: {value: function deserializedFromTemplate() {
        this.setupIterationDeserialization();
        if (this._isComponentExpanded) {
            // this is setup just for the flattening of the template iteration, the iteration needs to be serialized once it's completely flatten.
            this.setupIterationSerialization();
        }
        var controllerBindingDescriptorsToInstall = this._controllerBindingsToInstall;
        if (controllerBindingDescriptorsToInstall) {
            for (var key in controllerBindingDescriptorsToInstall) {
                Object.defineBinding(this, key, controllerBindingDescriptorsToInstall[key]);
            }
            delete this._controllerBindingsToInstall;
        }
        this._hasBeenDeserialized = true;
    }},

    canDraw: {
        value: function() {
            var canDraw = this.canDrawGate.value, component, i, length = this.childComponents.length;
            if (canDraw) {
                for (i = 0; i < length; i++) {
                    if (!this.childComponents[i].canDraw()) {
                        canDraw = false;
                        break;
                    }
                }
            }
            return canDraw;
        }
    },
/**
    Description TODO
    @function
    */
    prepareForDraw: {
        value: function() {

            this._iterationChildCount = this.element.childNodes.length;
            this._iterationChildElementCount = this.element.childElementCount;

            this.element.innerHTML = "";
            this._refreshSelectionTracking();
        }
    },
/**
  Description TODO
  @private
*/
    _selectedIndexesToDeselectOnDraw: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _selectedIndexes: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    selectedIndexes: {
        enumerable: false,
        get: function() {

            if (this.contentController) {
                return this.contentController.selectedIndexes;
            } else {
                return this._selectedIndexes;
            }
        },
        set: function(value) {

            if (!this._selectedIndexesToDeselectOnDraw) {
                this._selectedIndexesToDeselectOnDraw = this.selectedIndexes ? this.selectedIndexes : [];
            }

            // Accumulate the indexes that were selected since the last time we drew
            // Note this may mean we remove and re-add a selected class when we draw, but that should be quicker
            // than trying to keep this list as accurate as possible
            if (this.selectedIndexes || 0 === this.selectedIndexes) {
                this._selectedIndexesToDeselectOnDraw = this._selectedIndexesToDeselectOnDraw.concat(this.selectedIndexes);
            }

            if (this._contentController) {
                this._contentController.selectedIndexes = value;
            } else {
                this._selectedIndexes = value;
            }

            if (this._isComponentExpanded) {
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _activeIndexesToClearOnDraw: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _activeIndexes: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    activeIndexes: {
        enumerable: false,
        get: function() {
            return this._activeIndexes;
        },
        set: function(value) {

            if (!this._activeIndexesToClearOnDraw) {
                this._activeIndexesToClearOnDraw = this._activeIndexes ? this.activeIndexes : [];
            }

            if (this._activeIndexes || 0 === this._activeIndexes) {
                this._activeIndexesToClearOnDraw = this._activeIndexesToClearOnDraw.concat(this._activeIndexes);
            }

            this._activeIndexes = value;

            if (this._isComponentExpanded) {
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _refreshSelectionTracking: {
        value: function() {

            if (this.isSelectionEnabled) {
                if (window.Touch) {
                    this.element.addEventListener("touchstart", this, true);
                } else {
                    this.element.addEventListener("mousedown", this, true);
                }
            } else {
                if (window.Touch) {
                    this.element.removeEventListener("touchstart", this, true);
                } else {
                    this.element.removeEventListener("mousedown", this, true);
                }
            }

        }
    },
/**
  Description TODO
  @private
*/
    _itemIndexOfElement: {
        value: function (element) {

            var repetitionChild = element,
                itemIndex = null,
                endOffsetAdjustment,
                range;

            // from the given element go up until we hit the repetitionElement;
            // meaning the last element we hit is an immediate child of the repetition
            if (repetitionChild === this.element) {
                return itemIndex;
            }
            while (repetitionChild.parentNode !== this.element) {
                repetitionChild = repetitionChild.parentNode;
            }

            // figure out what index that node is inside the repetitionElement's.childNodes collection
            // knowing how many nodes we have per iteration and which index was clicked we can figure out the selectedIndex
            range = this.element.ownerDocument.createRange();
            range.setStart(this.element, 0);
            range.setEndAfter(repetitionChild);
            endOffsetAdjustment = this._iterationChildCount > 1 ? 1 : 0;

            itemIndex = ((range.endOffset + endOffsetAdjustment) / this._iterationChildCount) - 1;

            // TODO#3493  francois shift the index by the amount defined by the large array controller?

            return itemIndex;
        }
    },
    // TODO by the time we have batches/subsets of the entire content/repetition visible at a time
    // we'll need to really translate selected indexes within a repetition viewing a subset to the
    // selected indexes within the actual content collection
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    captureTouchstart: {
        value: function(event) {

            if (this._selectionPointer || 0 === this._selectionPointer) {
                // If we already have one touch making a selection, ignore any others
                return;
            }

            this._observeSelectionPointer(event.changedTouches[0].identifier);

            var activeIndex = this._itemIndexOfElement(event.target);
            if (null !== activeIndex) {
                this.activeIndexes = [activeIndex];
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleTouchend: {
        value: function(event) {
            // TODO only grab new touches that are in target touches as well maybe?

            var i = 0;
            while (i < event.changedTouches.length && event.changedTouches[i].identifier !== this._selectionPointer) {
                i++;
            }

            if (i < event.changedTouches.length) {
                if (this.eventManager.isPointerClaimedByComponent(this._selectionPointer, this)) {
                    var selectedIndex = this._itemIndexOfElement(event.target);

                    if (null !== selectedIndex) {
                        this.selectedIndexes = [selectedIndex];
                    }
                }

                this._ignoreSelectionPointer();
            }

        }
    },
/**
    Description TODO
    @function
    */
    handleTouchcancel: {
        value: function() {
            this._ignoreSelectionPointer();
        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    captureMousedown: {
        value: function(event) {
            this._observeSelectionPointer("mouse");

            var activeIndex = this._itemIndexOfElement(event.target);
            if (null !== activeIndex) {
                this.activeIndexes = [activeIndex];
            }
        }
    },
/**
    Description TODO
    @function
    */
    handleMouseup: {
        value: function(event) {
            var selectedIndex = this._itemIndexOfElement(event.target);

            if (null !== selectedIndex) {
                // TODO expand the selection if shift/cmd etc (it's not necessarily a single selection being added
                this.selectedIndexes = [selectedIndex];
            }

            this._ignoreSelectionPointer();
        }
    },
/**
    Description TODO
    @function
    @param {String} pointer TODO
    @param {Component} demandingComponent TODO
    @returns {Boolean} true
    */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            this._ignoreSelectionPointer();
            return true;
        }
    },
/**
  Description TODO
  @private
*/
    _selectionPointer: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _observeSelectionPointer: {
        value: function(pointer) {
            this._selectionPointer = pointer;
            this.eventManager.claimPointer(pointer, this);

            if (window.Touch) {
                document.addEventListener("touchend", this, false);
                document.addEventListener("touchcancel", this, false);
            } else {
                document.addEventListener("mouseup", this, false);
                // TODO on significant mousemovement/mouseout of the "selected" element, should we forget the selectionPointer
            }
        }
    },
/**
  Description TODO
  @private
*/
    _ignoreSelectionPointer: {
        value: function() {
            this.eventManager.forfeitPointer(this._selectionPointer, this);
            this._selectionPointer = null;

            this.activeIndexes = [];

            if (window.Touch) {
                document.removeEventListener("touchend", this, false);
                document.removeEventListener("touchcancel", this, false);
            } else {
                document.removeEventListener("mouseup", this, false);
            }
        }
    },
/**
  Description TODO
  @private
*/
    _iterationChildCount: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _iterationChildElementCount: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    */
    draw: {value: function() {
        var i,
            iItem,
            fragment,
            componentStartIndex,
            componentEndIndex,
            j,
            isFirstItem,
            itemCount = this._items.length,
            addFragment,
            repetitionElement = this.element,
            doc = repetitionElement.ownerDocument,
            firstAddedIndex,
            selectionCount,
            deselectionCount,
            rangeToRemove,
            iterationElements,
            deselectableElementCount,
            deactivateCount,
            deactivatableElementCount,
            selectableElementCount,
            activatedCount,
            activatableElementCount;

        // Before we remove any nodes, make sure we "deselect" them
        //but only for single element iterations
        if (1 === this._iterationChildElementCount) {

            iterationElements = this.element.children;

            if (this._activeIndexesToClearOnDraw &&
                this._activeIndexesToClearOnDraw.length > 0) {

                deactivateCount = this._activeIndexesToClearOnDraw.length;
                deactivatableElementCount = Math.min(deactivateCount, iterationElements.length);

                for (i = 0; i < deactivateCount; i++) {
                    iterationElements.item(this._activeIndexesToClearOnDraw[i]).classList.remove("active");
                }

                this._activeIndexesToClearOnDraw = [];
            }

            if (this._selectedIndexesToDeselectOnDraw &&
                this._selectedIndexesToDeselectOnDraw.length > 0) {

                deselectionCount = this._selectedIndexesToDeselectOnDraw.length;
                deselectableElementCount = Math.min(deselectionCount, iterationElements.length);

                for (i = 0; i < deselectableElementCount; i++) {
                    iterationElements.item(this._selectedIndexesToDeselectOnDraw[i]).classList.remove("selected");
                }

                this._selectedIndexesToDeselectOnDraw = [];
            }

        }

        // Remove items pending removal
        if (this._itemsToRemove.length && this._itemsToRemove.length > 0) {
            rangeToRemove = document.createRange();

            for (i = 0; (iItem = this._itemsToRemove[i]); i++) {

                rangeToRemove.setStart(repetitionElement, iItem.start);
                rangeToRemove.setEnd(repetitionElement, iItem.end);

                rangeToRemove.extractContents();
                //TODO do we need to do anything with the bindings that are attached?
            }
            this._itemsToRemove = [];
        }

        if (this._itemsToAppend.length && this._itemsToAppend.length > 0) {
            addFragment = doc.createDocumentFragment();
            firstAddedIndex = itemCount;

            // Append items pending addition
            for (i = 0; (iItem = this._itemsToAppend[i]); i++) {
                fragment = iItem.fragment;
                delete iItem.fragment;
                isFirstItem = (repetitionElement.childNodes.length === 0);

                iItem.start = (itemCount + i) * this._iterationChildCount;
                iItem.end = iItem.start + this._iterationChildCount;

                addFragment.appendChild(fragment);

                //now that the item has been appended, we add it to our items array
                this._items.push(iItem);
                // Tell childComponents that are associated with this new item
                componentStartIndex = (itemCount + i) * this._childComponentsCount;
                componentEndIndex = componentStartIndex + this._childComponentsCount;
            }

            repetitionElement.appendChild(addFragment);

            itemCount = this._items.length;

            this._itemsToAppend = [];
            this._nextDeserializedItemIx = 0;
        }

        // TODO Add selection class to selected items; may be easier to have this bound to an item or something directly
        // basically we have a couple of ways to attack this; leaving it like this for now prior to optimization
        if (null !== this.selectedIndexes && this.selectedIndexes.length > 0 && 1 === this._iterationChildElementCount) {

            iterationElements = this.element.children;
            selectionCount = this.selectedIndexes.length;
            selectableElementCount = Math.min(selectionCount, iterationElements.length);

            for (i = 0; i < selectableElementCount; i++) {
                iterationElements.item(this.selectedIndexes[i]).classList.add("selected");
            }
        }

        // TODO Add active class to active items; may be easier to have this bound to an item or something directly
        // basically we have a couple of ways to attack this; leaving it like this for now prior to optimization
        if (null !== this._activeIndexes && this._activeIndexes.length > 0 && 1 === this._iterationChildElementCount) {

            iterationElements = this.element.children;
            activatedCount = this._activeIndexes.length;
            activatableElementCount = Math.min(activatedCount, iterationElements.length);

            for (i = 0; i < activatableElementCount; i++) {
                iterationElements.item(this._activeIndexes[i]).classList.add("active");
            }
        }

    }},
/**
    Description TODO
    @function
    */
    setupIterationSerialization: {value: function() {
        Montage.defineProperty(this, "serializeSelf", {value: this.serializeIteration});
    }},
/**
    Description TODO
    @function
    */
    setupIterationDeserialization: {value: function() {
        //        Montage.defineProperty(this, "deserializeSelf", {value: this.deserializeIteration});
        this.deserializeSelf = this.deserializeIteration;
    }},
/**
    Description TODO
    @function
    */
    removeIterationSerialization: {value: function() {
        delete this.serializeSelf;
    }},
/**
    Description TODO
    @function
    @param {Property} type TODO
    @param {Property} listener TODO
    @param {Property} useCapture TODO
    @param {Property} atSignIndex TODO
    @param {Property} bindingOrigin TODO
    @param {Property} bindingPropertyPath TODO
    @param {Property} bindingDescriptor TODO
    @returns null or Object.prototype.propertyChangeBindingListener.call
    */
    propertyChangeBindingListener: {value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {

        var usefulBindingDescriptor = bindingDescriptor;
        var usefulType = type;
        var currentIndex;

        if (bindingDescriptor && bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
            if (this._currentItem) {
                currentIndex = this._items.length + this._nextDeserializedItemIx - 1;
                usefulBindingDescriptor = {};
                var descriptorKeys = Object.keys(bindingDescriptor);
                var descriptorKeyCount = descriptorKeys.length;
                var iDescriptorKey;
                for (var i = 0; i < descriptorKeyCount; i++) {
                    iDescriptorKey = descriptorKeys[i];
                    usefulBindingDescriptor[iDescriptorKey] = bindingDescriptor[iDescriptorKey];
                }

                //TODO not as simple as replacing this, there may be more to the path maybe? (needs testing)
                var modifiedBoundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath.replace(/objectAtCurrentIteration/, 'objects.' + currentIndex);
                usefulBindingDescriptor.boundObjectPropertyPath = modifiedBoundObjectPropertyPath;

                usefulType = type.replace(/objectAtCurrentIteration/, 'objects.' + currentIndex);
            } else {
                return null;
            }
        }

        return Object.prototype.propertyChangeBindingListener.call(this, usefulType, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, usefulBindingDescriptor);
    }},
/**
    Description TODO
    @function
    @param {Property} serializer TODO
    */
    serializeIteration: {value: function(serializer) {
        serializer.set("element", this.element);
        var childComponents = this.childComponents;
        for (var i = 0, l = childComponents.length; i < l; i++) {
            serializer.addObject(childComponents[i]);
        }
        // iterations are already expanded
        serializer.set("_isComponentExpanded", true);
    }},
/**
    Description TODO
    @function
    @param {Property} deserializer TODO
    */
    deserializeIteration: {value: function(deserializer) {
        var item = this._itemsToAppend[this._nextDeserializedItemIx++],
            newChildComponents = deserializer.get("childComponents");

        this._deserializedItem = item;
        item.element = deserializer.get("element");

        this.eventManager.registerEventHandlerForElement(this, item.element);
        if (logger.debug) {
            logger.debug(this._montage_metadata.objectName + ":deserializeIteration", "childNodes: " + item.range);
        }
    }},

    /**
     Remove all bindings and starts buffering the needsDraw.
     @function
     @param {Property} rootComponent The root component of the tree do cleanup.
     */
    cleanupDeletedComponentTree: {value: function(rootComponent) {
        rootComponent.needsDraw = false;
        rootComponent.traverseComponentTree(function(component) {
            Object.deleteBindings(component);
            component.canDrawGate.setField("componentTreeLoaded", false);
            component.blockDrawGate.setField("element", false);
            component.blockDrawGate.setField("drawRequested", false);
            component.needsDraw = false;
        });
    }}
});
