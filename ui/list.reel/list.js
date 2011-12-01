/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/list.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class module:"montage/ui/list.reel".List
 @extends module:montage/ui/component.Component
 */
var List = exports.List = Montage.create(Component,/** @lends module:"montage/ui/list.reel".List# */ {
/**
  Description TODO
  @private
*/
    _repetition: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _scrollview: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _orphanedChildren: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        enumerable: false,
        value: null
    },

    //TODO make some convenient forwarding property or something, this is a little tedious

    // Properties to forward to the scrollview
 /**
  Description TODO
  @private
*/
    _axisForScrollview: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    axis: {
        enumerable: false,
        get: function() {
            if (this._scrollview) {
                return this._scrollview.axis;
            } else {
                return this._axisForScrollview;
            }
        },
        set: function(value) {
            if (this._scrollview) {
                this._scrollview.axis = value;
            } else {
                this._axisForScrollview = value;
            }
        }
    },

    //Properties to forward to the repetition
/**
  Description TODO
  @private
*/
    _objectsForRepetition: {
        enumerable: false,
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
            if (this._repetition) {
                return this._repetition.objects;
            } else {
                return this._objectsForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.objects = value;
            } else {
                this._objectsForRepetition = value;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _contentControllerForRepetition: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    contentController: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.contentController;
            } else {
                return this._contentControllerForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.contentController = value;
            } else {
                this._contentControllerForRepetition = value;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _isSelectionEnabledForRepetition: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    isSelectionEnabled: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.isSelectionEnabled;
            } else {
                return this._isSelectionEnabledForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.isSelectionEnabled = value;
            } else {
                this._isSelectionEnabledForRepetition = value;
            }
        }
    },

    // Initialization

    // TODO we should probably support the programmatic initialization of a list; forwarding the childComponents
    // along to the repetition
    // I want to say that if somebody knows enough to do that they know enough to append the child components' elements
    // into the repetition, not the list
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
    @returns null or object
    */
    propertyChangeBindingListener: {
        value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {

            // TODO could forward along less-special bindings this way such as "objects" in general, just to reduce an extra
            // hop in the derived property path
            if (bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
                if (this._repetition) {
                    // TODO not sure how safe this is, but I may want to use it in the repetition's oimplementation of
                    // this method as well as it looks like it should obviously be faster than replicating the descriptor
                    bindingDescriptor.boundObject = this._repetition;
                    return this._repetition.propertyChangeBindingListener.apply(this._repetition, arguments);
                } else {
                    // Don't install this binding; we'll deal with that when the children are actually used inside
                    // the repetition and try to bind to the list directly in the future
                    // TODO maybe we could rewrite the bindingDescriptor at this point on the bindingOrigin
                    // to prevent this man-in-the-middle game we're playing with the list later on
                    return null;
                }
            } else {
                return Object.prototype.propertyChangeBindingListener.apply(this, arguments);
            }
        }},

/**
    Description TODO
    @function
*/
    deserializedFromTemplate: {
        value: function() {
            // The childComponents of the list need to be pulled aside for a moment so we can give them to the repetition
            // This is logically where people think these components are ending up anyway
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;
        }
    },

/**
    Description TODO
    @function
 */
    templateDidLoad: {
        value: function() {
            // Once we know that the template for the list itself has been deserialized we actually
            // move the orphaned children of the list into the repetition
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange();
            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();

            this._repetition.element.appendChild(orphanedFragment);
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.needsDraw = true;

            if (this._objectsForRepetition !== null) {
                this._repetition.objects = this._objectsForRepetition;
                this._objectsForRepetition = null;
            }

            if (this._contentControllerForRepetition !== null) {
                this._repetition.contentController = this._contentControllerForRepetition;
                this._contentControllerForRepetition = null;
            }

            if (this._isSelectionEnabledForRepetition !== null) {
                this._repetition.isSelectionEnabled = this._isSelectionEnabledForRepetition;
                this._isSelectionEnabledForRepetition = null;
            }

            // Don't forget to pass along properties to the scrollview
            if (this._axisForScrollview !== null) {
                this._scrollview.axis = this._axisForScrollview;
                this._axisForScrollview = null;
            }
        }
    }

});
