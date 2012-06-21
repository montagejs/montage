/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    SwipeComposer = require("montage/ui/composer/swipe-composer").SwipeComposer;

exports.Swipe = Montage.create(Montage, {

    deserializedFromTemplate: {
        value: function() {
            var dummyComponent = Montage.create(Component);
            dummyComponent.hasTemplate = false;
            dummyComponent.element = document.body;
            dummyComponent.needsDraw = true;
            this.swipeComposer = SwipeComposer.create();
            dummyComponent.addComposer(this.swipeComposer);
            this.swipeComposer.addEventListener("swipe", this, false);
            this.swipeComposer.addEventListener("swipemove", this, false);
        }
    },

    handleSwipe: {
        value: function(event) {
        }
    },

    handleSwipemove: {
        value: function(event) {
        }
    }

});
