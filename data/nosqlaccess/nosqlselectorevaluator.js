/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/nosqlaccess/nosqlselectorevaluator
    @requires montage/core/core
    @requires montage/data/selector
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var SelectorEvaluator = require("data/selector").SelectorEvaluator;
var Selector = require("data/selector").Selector;
var logger = require("core/logger").logger("nosqlselectorevaluator");
/**
    @class module:montage/data/nosqlaccess/nosqlselectorevaluator.NoSqlSelectorEvaluator
    @extends module:montage/data/selector.SelectorEvaluator
*/
var NoSqlSelectorEvaluator = exports.NoSqlSelectorEvaluator = Montage.create(SelectorEvaluator,/** @lends module:montage/data/nosqlaccess/nosqlselectorevaluator.NoSqlSelectorEvaluator# */ {


});
Selector.registry.registerEvaluator(NoSqlSelectorEvaluator);
