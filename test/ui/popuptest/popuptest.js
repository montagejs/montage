/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Button = require("montage/ui/button.reel").Button,
    Popup = require("montage/ui/popup/popup.reel").Popup;

/**
* A Delegate to position the popup using custom logic
*/
var TestPopupPositionDelegate = Montage.create(Montage, {
    positionPopup: {
       value: function(popup, anchor, anchorPosition) {
           if(anchor && anchorPosition) {
               if(window.innerHeight > 500 ){
                   return {
                       top: 10,
                       left: anchorPosition[0]
                   };                   
               } else {
                   return {
                       bottom: 10,
                       left: anchorPosition[0]
                   };
               }
           }
           return {top: 0, left: 0};
       }
    }
});
var TestPopupPositionDelegate = Montage.create(TestPopupPositionDelegate);

var PopupTest = exports.popupTest = Montage.create(Montage, {
    deserializedFromTemplate: {
        value: function() {
            return this;
        }
    },

    handleAction: {
        value: function(evt) {
            if(!this.popup) {
                this.popup = Popup.create();
                this.popup.content = this.testPopup;
                this.popup.anchor = this.popupButton.element;
                this.popup.delegate = TestPopupPositionDelegate;
            }
            this.popup.show();
        }
    },

    popup: {
        value: null
    },

    testPopup: {
        value: null
    },

    popupButton: {
        value: null
    }
});
