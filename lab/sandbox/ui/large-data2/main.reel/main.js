/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController,
    Converter= require("montage/core/converter/converter").Converter;

exports.Main = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            var self = this,
                i = 0,
                repetitionDraw = this.list.draw;

            setInterval(function () {
                if (i % 2) {
                    self.list.indexMap = [1,2];
                } else {
                    self.list.indexMap = [3,2,1];
                }
                i++;
            }, 20);
            
            this.list.draw = function () {
                var i, time = new Date().getTime() / 1000;
                
                for (i = 0; i < self.list.indexMap.length; i++) {
                    self.list._childComponents[i].element.style.webkitTransform = "translate3d(" + (self.list.indexMap[i] * 210+Math.cos(time)*30) + "px, 0, 0) rotateY(20deg)";
                }
                repetitionDraw.call(self.list);
            }
        }
    }

});
