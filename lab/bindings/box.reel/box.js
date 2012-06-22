/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;
    
require("montage/core/change-notification");

exports.Box = Montage.create(Component, {
    templateDidLoad: {
        value: function() {
            var self = this,
                mainComponent = this.mainComponent;
            this.mainComponent.addPropertyChangeListener("color", function(notification) {
                self.color = notification.target.color;
            });
            this.mainComponent.addPropertyChangeListener("left", function(notification) {
                self.left = notification.target.left;
            });
            this.mainComponent.addPropertyChangeListener("top", function(notification) {
                self.top = notification.target.top;
            });
            this.mainComponent.addPropertyChangeListener("content", function(notification) {
                self.content = notification.target.content;
            });
            this.addPropertyChangeListener("content", function(notification) {
                self.number.value = self.content;
            });
            
            //mainComponent.addEventListener("change@color", function() {
            //    self.color = mainComponent.color;
            //});
            //mainComponent.addEventListener("change@left", function() {
            //    self.left = mainComponent.left;
            //});
            //mainComponent.addEventListener("change@top", function() {
            //    self.top = mainComponent.top;
            //});
            //mainComponent.addEventListener("change@content", function() {
            //    self.number.value = mainComponent.content;
            //});
            
            //Object.defineBinding(this, "color", {
            //    boundObject: mainComponent,
            //    boundObjectPropertyPath: "color",
            //    oneway: true
            //});
            //Object.defineBinding(this, "left", {
            //    boundObject: mainComponent,
            //    boundObjectPropertyPath: "left",
            //    oneway: true
            //});
            //Object.defineBinding(this, "top", {
            //    boundObject: mainComponent,
            //    boundObjectPropertyPath: "top",
            //    oneway: true
            //});
            //Object.defineBinding(this.number, "value", {
            //    boundObject: mainComponent,
            //    boundObjectPropertyPath: "content",
            //    oneway: true
            //});            
        }
    },

    mainComponent: {
        serializable: "reference",
        value: null
    },

    _top: {
        value: 0
    },

    top: {
        get: function() {
            return this._top;
        },
        set: function(value) {
            this._top = value;
            this.needsDraw = true;
        }
    },

    _left: {
        value: 0
    },

    left: {
        get: function() {
            return this._left;
        },
        set: function(value) {
            this._left = value;
            this.needsDraw = true;
        }
    },

    _color: {
        value: 0
    },

    color: {
        get: function() {
            return this._color;
        },
        set: function(value) {
            this._color = value;
            this.needsDraw = true;
        }
    },

    _content: {
        value: 0
    },

    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            this._content = value;
        }
    },

//    parentProperty: {
//        value: null
//    },

    draw: {
        value: function(timestamp) {
            this.element.style.top = this.top+"px";
            this.element.style.left = this.left+"px";
            this.element.style.backgroundColor = "rgb(0,0,"+this.color+")";
        }
    }

});
