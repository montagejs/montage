/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForPrototype("Project", "data/object/project");

var Project = exports.Project = blueprint.create(Montage, {

    // Token class

});
