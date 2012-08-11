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

var Montage     = require("montage/core/core").Montage,
    Component   = require("montage/ui/component").Component;

exports.Appdata = Montage.create( Component, {

    pages: {

        value: [

            { index: 0, image: "resources/page-images/frontpage.jpg"},
            { index: 1, component: "MontageLogo"},
            { index: 2, component: "MontageText"},
            { index: 3, component: "Architecture1"},
            { index: 4, component: "Architecture2"},
            { index: 5, component: "Architecture13"},
            { index: 6, component: "Architecture14"},
            { index: 7, component: "Architecture7"},
            { index: 8, component: "Architecture8"},
            { index: 9, component: "Architecture9"},
            { index: 10, component: "Architecture10"},
            { index: 11, component: "Architecture11"},
            { index: 12, component: "Architecture12"},
            { index: 13, component: "Architecture3"},
            { index: 14, component: "Architecture4"},
            { index: 15, component: "Architecture5"},
            { index: 16, component: "Architecture6"},
            { index: 17, component: "ScreeningLogo"},
            { index: 18, component: "ScreeningText"},
            { index: 19, image: "resources/page-images/screening-1.jpg"},
            { index: 20, image: "resources/page-images/screening-2.jpg"},
            { index: 21, component: "TempconverterText"},
            { index: 22, component: "Tempconverter"},
            { index: 23, component: "NinjaLogo"},
            { index: 24, component: "NinjaText"},
            { index: 25, component: "ScratchpadLogo"},
            { index: 26, component: "ScratchpadText"},
            { index: 27, component: "GSGLogo"},
            { index: 28, component: "GSGText"},
            { index: 29, component: "End"},
            { index: 30, component: "EndLogo"}
        ]
    }


});