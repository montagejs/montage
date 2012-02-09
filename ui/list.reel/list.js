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
        @type {Property}
        @default null
    */
    delegate: {
        enumerable: false,
        value: null
    },
    
    objects: {
        value: null
    },
    
    contentController: {
        value: null
    },
    
    axis: {
        value: null
    },

/**
  Description TODO
  @private
*/
    isSelectionEnabled: {
        value: null
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
        }
    }

});
