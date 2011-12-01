/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var logger = require("montage/core/logger").logger("Company");

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForPrototype("Company", "data/object/company");

var Company = exports.Company = blueprint.create(Montage, {

    // Token class

});
