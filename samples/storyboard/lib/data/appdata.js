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


    emptySlide: {
        value: { index: 0, data: '<!DOCTYPE html><html><head><title></title> <script type="text/montage-serialization"> {"owner":{"module":"lib/components/slide.reel", "name":"Slide", "properties":{"parentProperty":"parentComponent", "element":{"#":"slide slide"}}} } </script> </head><body><div data-montage-id="slide slide" id="slide" class="slide slide" style="position: relative; width: 1024px; height: 768px; background: blue; overflow: hidden;"></div></body></html>' }

    },


    documentData: {
        value: {

            slides : [
                { index: 0, data: '<!DOCTYPE html><html><head><title></title><script type="text/montage-serialization">{"overlay":{"prototype":"montage/ui/slot.reel", "properties":{"delegate":{"@":"richtext"}, "parentProperty":"parentComponent", "element":{"#":"editor-slot"}}}, "richtext":{"prototype":"montage/ui/rich-text-editor/rich-text-editor.reel", "properties":{"value":"", "parentProperty":"parentComponent", "element":{"#":"rich-text-editor-container"}}}, "textelement":{"prototype":"lib/components/textelement.reel[Textelement]", "properties":{"parentProperty":"parentComponent", "element":{"#":"textelement"}, "_isTemplateInstantiated":true, "_isTemplateLoaded":true, "_isTemplateLoading":false}}, "owner":{"prototype":"lib/components/slide.reel", "properties":{"parentProperty":"parentComponent", "element":{"#":"slide slide"}}} }</script></head><body><div data-montage-id="slide slide" id="slide" class="slide slide" style="position: relative; width: 1024px; height: 768px; background: blue; overflow: hidden;"><div data-montage-id="textelement" id="textelement" class="textelement" style=" position: absolute; width: 800px; height: 200px; top: 30px; left: 162px; background: white;"> <div data-montage-id="rich-text-editor-container" class=" richtext montage-editor-container"> <div class="montage-editor editor-797-26" contenteditable="true"></div> <div data-montage-id="editor-slot" class="montage-editor-overlay"></div> </div> </div></div></body></html>' }
            ]
        }

    }



});