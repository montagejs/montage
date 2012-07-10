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
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.SearchResult = Montage.create(Component, {

    photoListController: {
        value: null
    },

    result: {
        value: null
    },

    resultAlreadyImported: {
        dependencies: ["result", "photoListController.content.count()"],
        get: function() {

            if (!this.result || !this.photoListController) {
                return false;
            }

            var importedIdList = this.photoListController.content.getProperty("id");
            return importedIdList.indexOf(this.result.gphoto$id.$t) >= 0;
        }
    },

    addPhotoAction: {
        value: function() {

            if (this.resultAlreadyImported) {
                return;
            }

            var result = this.result,
                photo;

            // TODO preserve all the original picasa data
            photo = {
                id: result.gphoto$id.$t,
                src: result.content.src,
                thumbnailSrc: result.getProperty("media$group.media$thumbnail.0.url"),
                link: result.id.$t,
                title: result.title.$t,
                source: "Picasa",
                authors: [result.author[0].gphoto$nickname.$t]
            }

            this.photoListController.addObjects(photo);
        }
    }


});

var Converter = require("montage/core/converter/converter").Converter;

exports.ActionSwitchValueConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            return value ? "oldPhoto" : "newPhoto";
        }
    }

});
