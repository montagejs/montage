/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/input-text.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;
/**
 * Wraps the a &lt;input type="text"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-text.reel".InputText
   @extends module:montage/ui/text-input.TextInput

 */
var InputText = exports.InputText = Montage.create(TextInput, {

    select: { value: function() { this._element.select(); } }

});

