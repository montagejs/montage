/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core").Montage;
var logger = require("montage/logger").logger("project");

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForPrototype("Project", "data/object/project");

var Project = exports.Project = blueprint.create(Montage, {

    // Token class

});