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
    Gate = require("core/gate").Gate,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    ChangeTypeModification = require("core/event/mutable-event").ChangeTypes.MODIFICATION;
/**
 @class module:"montage/ui/repetition.reel".Repetition
 @extends module:montage/ui/component.Component
 */
var Repetition = exports.Repetition = Montage.create(Component, /** @lends module:"montage/ui/repetition.reel".Repetition# */{
    /**
     Description TODO
     */
    hasTemplate: {value: false},

    didCreate: {
        value: function() {
            this.addPropertyChangeListener("objects", this);
        }
    },

    handleChange: {
        enumerable: false,
        value: function(notification) {
            if (notification.isMutation && notification.plus.length != notification.minus.length) {

                if (!this.contentController) {

                    // if the objects collection itself was actually modified: clear the selection
                    // TODO preserve selection if possible
                    if (this._objects === notification.plus) {
                        this.selectedIndexes = null;
                    }
                    // otherwise; the change to objects was a result of a change to the indexMap

                }

                this._mappedObjects = null;

                if (this._isComponentExpanded) {
                    this._refreshItems();
                }
            }
        }
    },

/**
    @private
*/
    _hasBeenDeserialized: {
        value: false,
        enumerable: false
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
                Object.deleteBinding(this, "selectedIndexes");
                Object.deleteBinding(this, "selections");
            }

            this._contentController = value;

            if (this._contentController) {

                // If we're already getting contentController related values from other bindings...stop that
                if (this._bindingDescriptors) {
                    Object.deleteBinding(this, "objects");
                }

                // And bind what we need from the new contentController
                var objectsBindingDescriptor,
                    selectedIndexesBindingDescriptor,
                    selectionsBindingDescriptor;

                objectsBindingDescriptor = {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "organizedObjects",
                    oneway: true
                };

                selectedIndexesBindingDescriptor = {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "selectedIndexes"
                };

                selectionsBindingDescriptor = {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "selections"
                };

                // If we're ready for bindings...go ahead an install
                // TODO: Look at changing this once the new serialization has been implemented
                if (this._hasBeenDeserialized) {
                    Object.defineBinding(this, "objects", objectsBindingDescriptor);
                    Object.defineBinding(this, "selectedIndexes", selectedIndexesBindingDescriptor);
                    Object.defineBinding(this, "selections", selectionsBindingDescriptor);
                } else {
                    // otherwise we need to defer it until later; we haven't been deserialized yet
                    if (!this._controllerBindingsToInstall) {
                        this._controllerBindingsToInstall = {};
                    }

                    this._controllerBindingsToInstall.objects = objectsBindingDescriptor;
                    this._controllerBindingsToInstall.selectedIndexes = selectedIndexesBindingDescriptor;
                    this._controllerBindingsToInstall.selections = selectionsBindingDescriptor;
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

    _mappedObjects: {
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
        dependencies: ["indexMap", "indexMapEnabled"],
        enumerable: false,
        get: function() {
            if (!this.indexMap || !this.indexMapEnabled) {
                return this._objects;
            } else {
                if (this._objects && !this._mappedObjects) {
                    this._mappedObjects = this.indexMap.map(function(value) {
                        return !isNaN(value) ? this._objects.getProperty(value) : undefined;
                    }, this);
                }
                return this._mappedObjects;
            }
        },
        set: function(value) {
            if (logger.isDebug) {
                logger.debug(this, " set objects:", (value ? value.length : null), value, "same objects?", value === this._objects);
            }

            this._mappedObjects = null;
            this._objects = value;

            // Objects have changed, clear the selectedIndexes, if we're managing our own selection
            if (!this.contentController) {
                this.selectedIndexes = null;
            }

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
    _iterationChildComponentsCount: {
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

    _indexMap: {
        enumerable: false,
        value: null
    },

    indexMap: {
        get: function() {
            return this._indexMap;
        }
    },

    _indexMapEnabled: {
        enumerable: false,
        value: false
    },

    indexMapEnabled: {
        get: function() {
            return this._indexMapEnabled;
        },
        set: function(value) {
            if (value === this._indexMapEnabled) {
                return;
            }

            if (!this._indexMap && value) {
                this._indexMap = [];
            }

            this._indexMapEnabled = value;

            this.refreshIndexMap();
        }
    },

    _drawnIndexMap: {
        enumerable: false,
        value: null
    },

    drawnIndexMap: {
        get: function() {
            return this._drawnIndexMap;
        }
    },

    mapIndexToIndex: {
        value: function(actual, apparent, update) {

            if (!this._indexMap) {
                this._indexMap = [];
            }

            if (apparent === this._indexMap[actual] || this._indexMap.indexOf(apparent) > -1) {
                return;
            }

            this._indexMap[actual] = apparent;

            // Track that the indexMap changed what is appearing at the given index
            // so that we can force it to not transition
            this._indexMapAffectedIndexes[actual] = true;
            this._indexMapChanged = true;

            // Don't update if the end-user forced no update, they might be doing a bunch of modifications
            // and want to manually refresh the indexMap when they're done.
            if (update || typeof update === "undefined") {
                this.refreshIndexMap();
            }
        }
    },

    clearIndexMap: {
        value: function() {
            this._indexMap.length = 0;
            this.indexMapEnabled = false;
        }
    },

    refreshIndexMap: {
        value: function() {
            this._mappedObjects = null;

            this.dispatchEvent(MutableEvent.changeEventForKeyAndValue("indexMap"));

            if (this._isComponentExpanded) {
                this._refreshItems();
                this.needsDraw = true;
            }
        }
    },

    _indexMapChanged: {
        enumerable: false,
        value: false
    },

    _indexMapAffectedIndexes: {
        enumerable: false,
        distinct: true,
        value: {}
    },

    _dirtyIndexes: {
        enumerable: false,
        distinct: true,
        value: {}
    },

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
                neededItemCount,
                i,
                addItem = this._addItem,
                deleteItem = this._deleteItem;

            if (this._objects && this.indexMap && this._indexMapEnabled) {
                objectCount = this.indexMap.length;
            }

            neededItemCount = objectCount - itemCount;

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
                this._expectedChildComponentsCount += (this._iterationChildComponentsCount||1) * neededItemCount;
                this.canDrawGate.setField("iterationLoaded", false);
                // Need to add more items
                for (i = 0; i < neededItemCount; i++) {
                    addItem.call(this);
                }
            } else if (neededItemCount < 0) {
                // Need to remove extra items
                for (i = neededItemCount; i < 0; i++) {
                    deleteItem.call(this);
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
            canDrawGate = self.canDrawGate,
            i;

        // TODO simply pop from deletedItems if we have any in that pool
        this._currentItem = {};

        // TODO when do we actually consider the item part of the "items" array? now or after drawing?
        // right now I think we want to say if it's not in the DOM; it's not in the items list
        // for clarity sake
        this._itemsToAppend.push(this._currentItem);
        index = items.length + this._itemsToAppend.length - 1;

        self._canDraw = false;
        componentsCount = this._iterationChildComponentsCount;
        this._iterationTemplate.instantiateWithComponent(this, function() {
            if (componentsCount === 0) {
                if (++self._childLoadedCount === self._expectedChildComponentsCount) {
                    canDrawGate.setField("iterationLoaded", true);
                }
            } else {
                childComponents = self.childComponents;
                componentStartIndex = index * self._iterationChildComponentsCount;
                componentEndIndex = componentStartIndex + componentsCount;
                for (i = componentStartIndex; i < componentEndIndex; i++) {
                    childComponent = childComponents[i];
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

        var deletedItem, itemIndex, removedComponents, childComponents = this.childComponents, childComponentsCount = this._iterationChildComponentsCount,
            itemsToAppendCount = this._itemsToAppend.length,
            i,
            removedComponentCount;

        if (itemsToAppendCount > 0) {
            // We caught the need to remove these items before they got inserted
            // just don't bother appending them
            deletedItem = this._itemsToAppend.pop();
            // TODO: make _deletedItems usable in _addItem
            //this._deletedItems.push(deletedItem);
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
            for (i = 0, removedComponentCount = removedComponents.length; i < removedComponentCount; i++) {
                removedComponents[i].cleanupDeletedComponentTree();
            }
        } else {
            this._childLoadedCount--;
            this._expectedChildComponentsCount--;
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
        if (!this._refreshingItems) {
            this._setupIterationTemplate();
        }
        this._isComponentExpanded = true;
        if (callback) {
            callback();
        }
    }},

    // we don't want to reinitialize the ownerComponent again
    templateDidDeserializeObject: {
        value: null
    },

    _setupIterationTemplate: {
        value: function() {
            var element = this._element,
                childComponents = this.childComponents,
                childComponent;

            this.setupIterationSerialization();
            this.setupIterationDeserialization();
            this._iterationChildComponentsCount = childComponents.length;
            this._iterationChildCount = element.childNodes.length;
            this._iterationChildElementCount = element.children.length;

            if (this._iterationChildComponentsCount > 0) {
                this._templateId = childComponents[0]._suuid || childComponents[0].uuid;
                this._iterationTemplate = Template.templateWithComponent(this);
            } else {
                this._iterationTemplate = Template.create().initWithComponent(this);
            }
            this._iterationTemplate.optimize();
            this._removeOriginalContent = true;

            if (logger.isDebug) {
                logger.debug(this._iterationTemplate.exportToString());
            }

            // just needed to create the iteration Template, so we get rid of it.
            this.removeIterationSerialization();

            while ((childComponent = childComponents.shift())) {
                childComponent.needsDraw = false;
            }

            if (this.objects && (this.objects.length !== this._items.length)) {
                this._refreshItems();
            }
        }
    },

    // called on iteration instantiation
    templateDidLoad: {value: function() {
        var item = this._deserializedItem,
            children;

        // if this iteration was removed in the meanwhile there's no
        // _deserializedItem so we need to ignore this.
        if (item) {
            children = item.element.childNodes;
            item.fragment = document.createDocumentFragment();
            while (children.length > 0) {
                // As the nodes are appended to item.fragment they are removed
                // from item.element, so always use index 0.
                item.fragment.appendChild(children[0]);
            }
            delete item.element;
        }
    }},

    contentWillChange: {
        value: function(content) {
            this._refreshingItems = true;
            this.reset();
        }
    },

    contentDidChange: {
        value: function() {
            this._refreshingItems = false;
            this._setupIterationTemplate();
            this._skipCurrentDraw = true;
        }
    },

    reset: {
        value: function() {
            this._items.wipe();
            this._itemsToAppend.wipe();
            this._nextDeserializedItemIx = 0;
            this._itemsToRemove.wipe();
            this._deletedItems.wipe();
        }
    },

    deserializedFromTemplate: {value: function deserializedFromTemplate() {
        if (this._isComponentExpanded) {
            // this is setup just for the flattening of the template iteration, the iteration needs to be serialized once it's completely flatten.
            this.setupIterationSerialization();
        }
        var controllerBindingDescriptorsToInstall = this._controllerBindingsToInstall,
            key;

        if (controllerBindingDescriptorsToInstall) {
            for (key in controllerBindingDescriptorsToInstall) {
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
            return this._selectedIndexes;
        },
        set: function(value) {
            this._selectedIndexes = value;

            this._markIndexesDirty(value);

            if (this._isComponentExpanded) {
                this.needsDraw = true;
            }
        }
    },


    // parse array with same length as objects but contains true / false(falsy)
    // only applicable if contentController is used with the Repetition
    selections: {
        get: function() {
            if(this.contentController) {
                return this.contentController.selections;
            }
            return null;
        },
        set: function(v) {
            if(this.contentController) {
                this.contentController.selections = v;
            }
        },
        modify: function(v) {
            if(this.contentController) {
                this.contentController.selections = this.selections;
            }
        }
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

            this._activeIndexes = value;

            this._markIndexesDirty(value);

            if (this._isComponentExpanded) {
                this.needsDraw = true;
            }
        }
    },

    _markIndexesDirty: {
        value: function(indexes) {

            if (indexes) {
                for (var i = 0, indexCount = indexes.length; i < indexCount; i++) {
                    this._dirtyIndexes[this._indexMap ? this._indexMap.indexOf(indexes[i]) : indexes[i]] = true;
                }
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
            while (repetitionChild && repetitionChild.parentNode !== this.element) {
                repetitionChild = repetitionChild.parentNode;
            }

            if (!repetitionChild) {
                return null;
            }

            // figure out what index that node is inside the repetitionElement's.childNodes collection
            // knowing how many nodes we have per iteration and which index was clicked we can figure out the selectedIndex
            range = this.element.ownerDocument.createRange();
            range.setStart(this.element, 0);
            range.setEndAfter(repetitionChild);
            endOffsetAdjustment = this._iterationChildCount > 1 ? 1 : 0;

            itemIndex = ((range.endOffset + endOffsetAdjustment) / this._iterationChildCount) - 1;

            // TODO#3493  francois shift the index by the amount defined by the large array controller?

            if (this.indexMap) {
                 return this.indexMap[itemIndex];
            } else {
                return itemIndex;
            }
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
            } else {
                this._ignoreSelectionPointer();
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

            var i = 0,
                selectedIndex;

            while (i < event.changedTouches.length && event.changedTouches[i].identifier !== this._selectionPointer) {
                i++;
            }

            if (i < event.changedTouches.length) {
                if (this.eventManager.isPointerClaimedByComponent(this._selectionPointer, this)) {
                    selectedIndex = this._itemIndexOfElement(event.target);

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
            } else {
                this._ignoreSelectionPointer();
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
            rangeToRemove,
            iterationElements,
            selectableElementCount,
            activatedCount,
            activatableElementCount,
            iterationElement,
            iterationElementClassList,
            indexMapChanged = this._indexMapChanged,
            activeIndex,
            selectedIndex;

        if (this._removeOriginalContent) {
            this._removeOriginalContent = false;
            repetitionElement.innerHTML = "";
            // even if there were items to remove we don't need to do that anymore.
            if (this._skipCurrentDraw) {
                this._skipCurrentDraw = false;
                return;
            }
        }

        // Before we remove any nodes, make sure we "deselect" them
        //but only for single element iterations
        if (1 === this._iterationChildElementCount) {

            iterationElements = repetitionElement.children;

            // NOTE Might be a bit excessive, but with the idea that the repetition will have a reasonable amount
            // of elements given the indexMap support I'll start with this
            // Wipe-out selection related classnames throughout the repetition to ensure a clean slate
            for (i = 0; i < iterationElements.length; i++) {
                iterationElement = iterationElements.item(i);
                if (iterationElement) {

                    if (this._dirtyIndexes[i]) {
                        iterationElementClassList = iterationElement.classList;

                        iterationElementClassList.remove("active");
                        iterationElementClassList.remove("selected");
                        iterationElementClassList.remove("no-transition");

                        if (indexMapChanged && this._indexMapAffectedIndexes[i]) {
                            iterationElementClassList.add("no-transition");
                            this._dirtyIndexes[i] = false;
                        }

                    }
                }
            }
        }

        // We've accounted for drawing given an indexMap change, schedule the next draw to clean up from that
        // by re-enabling transitions
        if (indexMapChanged) {
            this._indexMapAffectedIndexes.wipe();
            this._indexMapChanged = false;
            this.needsDraw = true;
        }

        // Remove items pending removal
        if (this._itemsToRemove.length && this._itemsToRemove.length > 0) {
            rangeToRemove = document.createRange();

            for (i = 0; (iItem = this._itemsToRemove[i]); i++) {

                rangeToRemove.setStart(repetitionElement, iItem.start);
                rangeToRemove.setEnd(repetitionElement, iItem.end);

                rangeToRemove.extractContents();
            }
            this._itemsToRemove.wipe();
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
                componentStartIndex = (itemCount + i) * this._iterationChildComponentsCount;
                componentEndIndex = componentStartIndex + this._iterationChildComponentsCount;
            }

            repetitionElement.appendChild(addFragment);

            itemCount = this._items.length;

            this._itemsToAppend.wipe();
            this._nextDeserializedItemIx = 0;
        }

        // TODO Add selection class to selected items; may be easier to have this bound to an item or something directly
        // basically we have a couple of ways to attack this; leaving it like this for now prior to optimization
        if (null !== this.selectedIndexes && this.selectedIndexes.length > 0 && 1 === this._iterationChildElementCount) {

            iterationElements = repetitionElement.children;
            selectionCount = this.selectedIndexes.length;
            selectableElementCount = Math.min(selectionCount, iterationElements.length);

            for (i = 0; i < selectableElementCount; i++) {
                selectedIndex = this.indexMap ? this.indexMap.indexOf(this.selectedIndexes[i]): this.selectedIndexes[i];
                iterationElement = iterationElements.item(selectedIndex);
                if (iterationElement) {
                    iterationElement.classList.add("selected");
                    //Mark the rediscovered selected index as dirty
                    this._dirtyIndexes[selectedIndex] = true;
                }
            }
        }

        // TODO Add active class to active items; may be easier to have this bound to an item or something directly
        // basically we have a couple of ways to attack this; leaving it like this for now prior to optimization
        if (null !== this._activeIndexes && this._activeIndexes.length > 0 && 1 === this._iterationChildElementCount) {

            iterationElements = this.element.children;
            activatedCount = this._activeIndexes.length;
            activatableElementCount = Math.min(activatedCount, iterationElements.length);

            for (i = 0; i < activatableElementCount; i++) {
                activeIndex = this.indexMap ? this.indexMap.indexOf(this._activeIndexes[i]): this._activeIndexes[i];
                iterationElement = iterationElements.item(activeIndex);
                if (iterationElement) {
                    iterationElement.classList.add("active");
                    //Mark the rediscovered active index as dirty
                    this._dirtyIndexes[activeIndex] = true;
                }
            }
        }

        this._drawnIndexMap = this._indexMap ? this.indexMap.slice(0) : null;

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
        //        Montage.defineProperty(this, "deserializeProperties", {value: this.deserializeIteration});
        this.deserializeProperties = this.deserializeIteration;
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

        var usefulBindingDescriptor = bindingDescriptor,
            usefulType = type,
            currentIndex,
            descriptorKeys,
            descriptorKeyCount,
            iDescriptorKey,
            i,
            modifiedBoundObjectPropertyPath;

        if (bindingDescriptor && bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
            if (this._currentItem) {
                currentIndex = this._items.length + this._nextDeserializedItemIx - 1;
                usefulBindingDescriptor = {};
                descriptorKeys = Object.keys(bindingDescriptor);
                descriptorKeyCount = descriptorKeys.length;
                for (i = 0; i < descriptorKeyCount; i++) {
                    iDescriptorKey = descriptorKeys[i];
                    usefulBindingDescriptor[iDescriptorKey] = bindingDescriptor[iDescriptorKey];
                }

                //TODO not as simple as replacing this, there may be more to the path maybe? (needs testing)
                modifiedBoundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath.replace(/objectAtCurrentIteration/, 'objects.' + currentIndex);
                usefulBindingDescriptor.boundObjectPropertyPath = modifiedBoundObjectPropertyPath;

                usefulType = type.replace(/objectAtCurrentIteration/, 'objects.' + currentIndex);
            } else {
                return null;
            }
        } else if(bindingDescriptor && bindingDescriptor.boundObjectPropertyPath.match(/selectionAtCurrentIteration/)) {
            if (this._currentItem) {
                currentIndex = this._items.length + this._nextDeserializedItemIx - 1;
                usefulBindingDescriptor = {};
                descriptorKeys = Object.keys(bindingDescriptor);
                descriptorKeyCount = descriptorKeys.length;
                for (i = 0; i < descriptorKeyCount; i++) {
                    iDescriptorKey = descriptorKeys[i];
                    usefulBindingDescriptor[iDescriptorKey] = bindingDescriptor[iDescriptorKey];
                }

                //TODO not as simple as replacing this, there may be more to the path maybe? (needs testing)

                modifiedBoundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath.replace(/selectionAtCurrentIteration/, 'selections.' + currentIndex);
                usefulBindingDescriptor.boundObjectPropertyPath = modifiedBoundObjectPropertyPath;

                usefulType = type.replace(/selectionAtCurrentIteration/, 'selections.' + currentIndex);

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
        serializer.setProperty("element", this.element);
        var childComponents = this.childComponents,
            addObject = serializer.addObject,
            i,
            childComponentCount = childComponents.length;

        for (i = 0; i < childComponentCount; i++) {
            addObject.call(serializer, childComponents[i]);
        }
        // iterations are already expanded
        serializer.setProperty("_isComponentExpanded", true);
    }},
/**
    Description TODO
    @function
    @param {Property} deserializer TODO
    */
    deserializeIteration: {value: function(deserializer) {
        var item = this._itemsToAppend[this._nextDeserializedItemIx++];

        if (item) {
            this._deserializedItem = item;
            item.element = deserializer.get("element");

            this.eventManager.registerEventHandlerForElement(this, item.element);
            if (logger.debug) {
                logger.debug(this._montage_metadata.objectName + ":deserializeIteration", "childNodes: " , item.element);
            }
        } else {
            this._deserializedItem = null;
        }
    }}
});
