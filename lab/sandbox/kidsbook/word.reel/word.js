/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;


exports.Word = Montage.create(Component, {

    wordData: {
        value: null,
        serializable: true
    },

    draw: {
        value: function() {

            if( this.wordData )
            {

                this.element.style.marginLeft = this.wordData.x + "px";
                this.element.style.marginTop = this.wordData.y + "px";
                this.element.style.width = this.wordData.width + "px";
                this.element.style.height = this.wordData.height + "px";

                if( !this.wordData.hide )
                {
                    this.element.innerHTML = this.wordData.text;
                }

            }
            

		}
	}

});
