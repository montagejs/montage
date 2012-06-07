/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
Component = require("ui/component").Component;

exports.Container = Montage.create(Component, {
    
    layout: {
        value: null
    },
    
    _createLayoutContainer: {
        value: function() {
            if(this.layout && !this.layout.element) {
                var el = document.createElement('div');
                this.element.appendChild(el);
            
                this.layout.element = el;
                this.layout.needsDraw = true;
            }            
        }
    },
    
    prepareForDraw: {
        value: function() {
            
            
            
        }
    },
    
    draw: {
        value: function() {
            if(this.layout) {
                
            }
        }
    }

});
