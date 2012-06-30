/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/loading.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class module:montage/ui/loading.Loading
 @extends module:montage/ui/component.Component
 */

var Loading = exports.Loading = Montage.create(Component,/** @lends module:"montage/ui/loading.reel".Loading# */ {
/**
  Description TODO
  @private
*/
    _loading: {
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    loading: {
        get: function() {
            return this._loading;
        },
        set: function(isloading) {
            if (this._loading !== isloading) {
                this._loading = isloading;
                this.needsDraw = true;
            }
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
            var classList = this.element.classList, exists = classList.contains("animate");
            if (this.loading) {
                if (!exists) {
                    classList.add("animate");
                }
            } else {
                if (exists) {
                    classList.remove("animate");
                }

            }
        }
    }
});
