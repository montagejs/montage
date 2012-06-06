/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/rest-object-id
    @requires montage/data/object-id
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var ObjectId = require("data/object-id").ObjectId;
var logger = require("core/logger").logger("rest-object-id");
/**
    @class module:montage/data/rest-access/rest-object-id.RestObjectId
    @extends module:montage/data/-object-id.ObjectId
*/
var RestObjectId = exports.RestObjectId = Montage.create(ObjectId,/** @lends module:montage/data/rest-access/rest-object-id.RestObjectId# */ {


});
