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

var parentWindow = window.opener;

// Let's switch to the parent application package context
require.loadPackage(parentWindow.require.location)
.then(function(require) {
    var loadInfo = window.loadInfo,
        module = loadInfo.module,
        name = loadInfo.name,
        callback = loadInfo.callback;

    // Switching the package context back to the parent application
    window.require = require;

    return require.async("montage/ui/component")
    .then(function(exports) {
        return require.async("montage/ui/loader.reel")
        .then(function (exports) {
            var mainComponent = exports["Loader"].create();
            mainComponent.mainModule = module;
            mainComponent.mainName = name;
            mainComponent.element = window.document.body;
            mainComponent.attachToParentComponent();
            mainComponent.needsDraw = true;

            if (callback) {
                mainComponent.addEventListener("componentLoaded", function(event) {
                    mainComponent.removeEventListener("componentLoaded", arguments.callee);
                    callback(window, event.detail);
                });
            }
        })
    });

})
.done();

