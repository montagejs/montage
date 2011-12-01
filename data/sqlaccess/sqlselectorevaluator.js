/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/sqlaccess/sqlselectorevaluator
    @requires montage/core/core
    @requires montage/data/selector
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var SelectorEvaluator = require("data/selector").SelectorEvaluator;
var Selector = require("data/selector").Selector;
var logger = require("core/logger").logger("sqlselectorevaluator");
/**
    @class module:montage/data/sqlaccess/sqlselectorevaluator.SqlSelectorEvaluator
    @extends module:montage/data/selector.SelectorEvaluator
*/
var SqlSelectorEvaluator = exports.SqlSelectorEvaluator = Montage.create(SelectorEvaluator,/** @lends module:montage/data/sqlaccess/sqlselectorevaluator.SqlSelectorEvaluator# */ {


});
Selector.registry.registerEvaluator(SqlSelectorEvaluator);
