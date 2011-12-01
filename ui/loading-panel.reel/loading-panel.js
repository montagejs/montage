/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
	@module "montage/ui/loading-panel.reel"
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class module:montage/ui/loading-panel.LoadingPanel
 @extends module:montage/ui/component.Component
 */

exports.LoadingPanel = Montage.create(Component, /** @lends module:montage/ui/loading-panel.LoadingPanel# */ {

/**
	The number of modules that are required to load.
*/
    requiredModuleCount: {
        enumerable: false,
        value: 0
    },

/**
	The number of modules that have been initialized.
*/
    initializedModuleCount: {
        enumerable: false,
        value: 0
    }


});
