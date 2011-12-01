/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/nosqlaccess/nosqlobjectid
    @requires montage/core/core
    @requires montage/data/objectid
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var ObjectId = require("data/objectid").ObjectId;
var logger = require("core/logger").logger("nosqlobjectid");
/**
    @class module:montage/data/nosqlaccess/nosqlobjectid.NoSqlObjectId
    @extends module:montage/data/objectid.ObjectId
*/
var NoSqlObjectId = exports.NoSqlObjectId = Montage.create(ObjectId,/** @lends module:montage/data/nosqlaccess/nosqlobjectid.NoSqlObjectId# */ {


});
