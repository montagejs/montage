/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

/**
    @module "montage/ui/native/input-date.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/text-input
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;

/**
  	Wraps an &lt;input type="date"> element as a component.
    @class module:"montage/ui/native/input-date.reel".InputDate
    @extends module:montage/ui/text-input.TextInput
 */
var InputDate = exports.InputDate = Montage.create(TextInput, {
});

InputDate.addAttributes( /** @lends module:"montage/ui/native/input-date.reel".InputDate# */{

/**
	The upper bound for the element’s value represented in the "full-date" format, (for example, 2001-05-24).
	@type {string}
	@default: null
*/
    max: null,
/**
	The lower bound for the element’s value represented in the "full-date" format, (for example, 2001-05-24).
	@type {string}
	@default: null
*/
    min: null,

/**
	The amount the date changes with each step.
	@type {string|number}
	@default null
*/
    step: null
});
