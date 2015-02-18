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
var querySelector = function (e){return document.querySelector(e);}

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

var TemplateTest = exports.TemplateTest = Montage.specialize( {
    loadComponents: {value: function () {
//        var component = new Component();
//        component.hasTemplate = true;
//        component.element = document.body;
//
//        TemplateTest.topComponent = component;
    }},
    listener: {value: function () {

    }}
});

//window.test = new TemplateTest();

// Setup up test buttons if we're running in the browser and not in jasmine.
if (window.parent === window) {
    //var component = new Component();
    //component.hasTemplate = true;
    //component.element = document.body;
    //component.needsDraw = true;

    var component;

    setTimeout(function () {
        component = window.defaultEventManager.application.delegate;
    }, 1000);
    /*
    querySelector("#add-list1").onclick = function () {
        //var list1 = eventManager.eventHandlerForElement(querySelector("#list1"));
        component.list1Objects.push("");
    };

    querySelector("#remove-list1").onclick = function () {
        component.list1Objects.pop();
    }

    querySelector("#add5-list1").onclick = function () {
        component.list1Objects.splice(component.list1Objects.length-1, 0, 1, 2, 3, 4, 5);
    };

    querySelector("#remove5-list1").onclick = function () {
        component.list1Objects.splice(component.list1Objects.length-5, 5);
    }

    querySelector("#add-list2").onclick = function () {
        component.list2Objects.push("");
    };

    querySelector("#remove-list2").onclick = function () {
        component.list2Objects.pop();
    }

    querySelector("#add5-list2").onclick = function () {
        component.list2Objects.splice(component.list2Objects.length-1, 0, 1, 2, 3, 4, 5);
    };

    querySelector("#remove5-list2").onclick = function () {
        component.list2Objects.splice(component.list2Objects.length-6, 5);
    }

    querySelector("#add11-list3").onclick = function () {
        component.list3Objects.push([1]);
    };

    querySelector("#remove1-list3").onclick = function () {
        component.list3Objects.pop();
    }

    querySelector("#remove01-list3").onclick = function () {
        var innerArray = component.list3Objects[component.list3Objects.length-1];
        innerArray.pop();
    }

    querySelector("#add15-list3").onclick = function () {
        component.list3Objects.push([1, 2, 3, 4, 5]);
    };

    querySelector("#add11-list5").onclick = function () {
        component.list5Objects.push([1]);
    };

    querySelector("#remove1-list5").onclick = function () {
        component.list5Objects.pop();
    }

    querySelector("#remove01-list5").onclick = function () {
        var innerArray = component.list5Objects[component.list5Objects.length-1];
        innerArray.pop();
    }

    querySelector("#add15-list5").onclick = function () {
        component.list5Objects.push([1, 2, 3, 4, 5]);
    };

    querySelector("#add11-list6").onclick = function () {
        component.list6Objects.push([1]);
    };

    querySelector("#remove1-list6").onclick = function () {
        component.list6Objects.pop();
    }

    querySelector("#remove01-list6").onclick = function () {
        var innerArray = component.list6Objects[component.list6Objects.length-1];
        innerArray.pop();
    }

    querySelector("#add15-list6").onclick = function () {
        component.list6Objects.push([1, 2, 3, 4, 5]);
    };
/*
    querySelector("#add-componentit1").onclick = function () {
        var componentit1 = eventManager.eventHandlerForElement(querySelector("#componentit1"));
        componentit1.listObjects.push(1);
    };

    querySelector("#remove-componentit1").onclick = function () {
        var componentit1 = eventManager.eventHandlerForElement(querySelector("#componentit1"));
        componentit1.listObjects.pop();
    }

    querySelector("#add5-componentit1").onclick = function () {
        var componentit1 = eventManager.eventHandlerForElement(querySelector("#componentit1"));
        componentit1.listObjects.push(1, 2, 3, 4, 5);
    };

    querySelector("#remove5-componentit1").onclick = function () {
        var componentit1 = eventManager.eventHandlerForElement(querySelector("#componentit1"));
        componentit1.listObjects.splice(componentit1.listObjects.length-5, 5);
    }

    querySelector("#add-componentit2").onclick = function () {
        var componentit2 = eventManager.eventHandlerForElement(querySelector("#componentit2"));
        componentit2.listObjects.push(1);
    };

    querySelector("#remove-componentit2").onclick = function () {
        var componentit2 = eventManager.eventHandlerForElement(querySelector("#componentit2"));
        componentit2.listObjects.pop();
    }

    querySelector("#add5-componentit2").onclick = function () {
        var componentit2 = eventManager.eventHandlerForElement(querySelector("#componentit2"));
        componentit2.listObjects.push(1, 2, 3, 4, 5);
    };

    querySelector("#remove5-componentit2").onclick = function () {
        var componentit2 = eventManager.eventHandlerForElement(querySelector("#componentit2"));
        componentit2.listObjects.splice(componentit2.listObjects.length-5, 5);
    }
    */
}
//
//if (window.parent && typeof window.parent.loaded === "function") {
//    window.parent.loaded();
//}
