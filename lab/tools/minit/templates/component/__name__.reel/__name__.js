/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/{{name}}.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    Description TODO
    @class module:"montage/ui/{{name}}.reel".{{exportedName}}
    @extends module:montage/ui/component.Component
*/
exports.{{exportedName}} = Montage.create(Component, /** @lends module:"montage/ui/{{name}}.reel".{{exportedName}}# */ {

    hasTemplate: {
        value: true
    }

});
