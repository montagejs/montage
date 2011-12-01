/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var SelectorEvaluator = require("montage/data/selector").SelectorEvaluator;
var Selector = require("montage/data/selector").Selector;
var logger = require("montage/core/logger").logger("testselectorevaluator");

var TestSelectorEvaluator = exports.TestSelectorEvaluator = Montage.create(SelectorEvaluator, {


});
Selector.registry.registerEvaluator(TestSelectorEvaluator);
