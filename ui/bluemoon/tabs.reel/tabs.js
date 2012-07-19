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
	@module "montage/ui/bluemoon/tabs.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/repetition.reel"
    @requires "montage/ui/substitution.reel"
    @requires "montage/ui/dynamic-text.reel"
    @requires "montage/ui/image.reel"
    @requires montage/core/uuid
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Repetition = require("ui/repetition.reel").Repetition,
    Substitution = require("ui/substitution.reel").Substitution,
    DynamicText = require("ui/dynamic-text.reel").DynamicText,
    Image = require("ui/image.reel").Image,
    Uuid = require("core/uuid").Uuid;

/**
    @class module:"montage/ui/bluemoon/tabs.reel".Tabs
*/

var Tabs = exports.Tabs = Montage.create(Component, /** @lends module:"montage/ui/bluemoon/tabs.reel".Tabs# */ {

    _repetition: {
        value: null
    },

    _indicator: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Array} []
    */
    tabs: {
        distinct: true,
        value: []
    },

    navController: {
        value: null
    },
    // optional property. If provided, this will result in wiring tab clicks to switching components in content
    /**
        Description TODO
        @type {Property}
        @default null
    */
    content: {
        value: null
    },

    // @private -
    _selectedTabs: {value: null},
    selectedTabs: {
        get: function() {
            return this._selectedTabs;
        },
        set: function(arr) {
            if(arr && arr.length > 0) {
                this._selectedTabs = arr;
                this.selectedTab = arr[0];
            }
        }
    },

    // selectedTabValue is the value of the Tab, selectedTab returns the object representing the tab

    _selectedTabValue: {value: null},
    selectedTabValue: {
        get: function() {
            return this._selectedTabValue;
        },
        set: function(value) {
            this._selectedTabValue = value;
            if(this.navController) {
                var index = this._indexOf(value);
                this.navController.selectedIndexes = [index];
            }
        }
    },


    _selectedTab: {value: null},
    selectedTab: {
        get: function() {
            return this._selectedTab;
        },
        set: function(value) {
            if(value && value !== this._selectedTab) {
                this._selectedTab = value;
                this.needsDraw = true;
            }
        }
    },

    _indexOf: {
        value: function(value) {
            var index = 0;
            // get the index of the this value element in the tabs array
            var i = 0, len = this.tabs.length;
            for (; i < len; i++) {
                if (this.tabs[i].value === value) {
                    index = i;
                }
            }
            return index;

        }
    },

    propertyChangeBindingListener: {
        value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
            // kishore: same as in list.js
            if (bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
                if (this._repetition) {
                    bindingDescriptor.boundObject = this._repetition;
                    return this._repetition.propertyChangeBindingListener.apply(this._repetition, arguments);
                } else {
                    return null;
                }
            } else {
                return Object.prototype.propertyChangeBindingListener.apply(this, arguments);
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;
        }
    },

    templateDidLoad: {
        value: function() {
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange();
            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();

            this._repetition.element.querySelector('li').appendChild(orphanedFragment);
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.needsDraw = true;

            if(this.content) {
                // substitution
                Object.defineBinding(this.content, "switchValue", {
                    boundObject: this,
                    boundObjectPropertyPath: 'selectedTab.value'
                });
            }
            var index = (this.selectedTabValue ? this._indexOf(this.selectedTabValue) : 0);
            this.navController.selectedIndexes = [index];

        }
    },

    draw: {
        value: function() {
            //console.log("draw current tab = " + value);
        }
    }

});
