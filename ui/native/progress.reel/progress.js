/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/progress.reel"
    @requires montage/ui/commponent
    @requires montage/ui/native-control
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

/**
  The Progress component wraps a native <code>&lt;progress></code> element and exposes its standard attributes as bindable properties.
  @class module:"montage/ui/progress.reel".Progress
  @extends module:montage/ui/native-control.NativeControl

*/
var Progress = exports.Progress =  Montage.create(NativeControl, {

});

Progress.addAttributes( /** @lends module:"montage/ui/progress.reel".Progress# */{

/**
    The value of the id attribute of the form with which to associate the component's element.
    @type string}
    @default null
*/
    form: null,

/**
    The maximum value displayed but the progress control.
    @type {number}
    @default null
*/
    max: {dataType: 'number'},

/**
    The current value displayed but the progress control.
    @type {number}
    @default null
*/
    value: {dataType: 'number'}
});
