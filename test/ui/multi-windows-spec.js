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
var Montage = require("montage").Montage,
TestPageLoader = require("support/testpageloader").TestPageLoader;


var testPage = TestPageLoader.queueTest("multi-windows-test", {newWindow: false}, function() {
    var test = testPage.test,
        mainApplication,
        mainWindow,
        childWindow,
        title = "Montage";

    describe("ui/multi-windows-spec", function() {

        it("should load", function() {
            expect(testPage.loaded).toBe(true);

            describe("mainApplication [before]", function() {
                mainApplication = test.application

                it("should be defined", function() {
                    expect(mainApplication).toBeDefined();
                });

                it("should be the main application", function() {
                    expect(mainApplication.mainApplication).toBe(mainApplication);
                });

                it("parent should be null", function() {
                    expect(mainApplication.parentApplication).toBeNull();
                });

                it("windows array should have only the main window", function() {
                    expect(mainApplication.windows.length).toBe(1);
                    expect(mainApplication.windows[0]).toBe(mainWindow);
                });

                it("should not have any attached window", function() {
                    expect(mainApplication.attachedWindows.length).toBe(0);
                });
            });

            describe("main window", function() {
                mainWindow = mainApplication.window;

                it("should be defined", function() {
                    expect(mainWindow).toBeDefined();
                });

                it("should be focused", function() {
                    expect(mainWindow.focused).toBeTruthy();
                });

                it("title should be '" + title + "' (and document defined)", function() {
                    mainWindow.title = title;
                    expect(mainWindow.document.title).toBe(title);
                    expect(mainWindow.title).toBe(title);
                });

                it("application should be the main Application", function() {
                    expect(mainWindow.application).toBe(mainApplication);
                });

                it("window should be the document's window", function() {
                    expect(mainWindow.window).toBe(mainWindow.document.defaultView);
                });

                it("component for the main window should be undefined", function() {
                    expect(mainWindow.component).toBeDefined();
                });
            });

            describe("child window", function() {
                var trigger = false,
                    text = "Hello World",
                    element;

                it("openWindow to return a MontageWindow object", function() {
                    childWindow = mainApplication.openWindow("ui/multi-windows-test/sample.reel", "Sample", {left:0, top:0, height:100, width:100});
                    expect(childWindow).toBeDefined();
                    expect(Montage.getInfoForObject(childWindow).objectName).toBe("MontageWindow");
                });

                it("child window should dispatch a load event", function() {
                    expectationToDispatch(childWindow, "load", function(event) {
                        childWindow.component.label.value = text;
                        trigger = true;
                    })(true);

                    waitsFor(function() { return trigger; });
                    runs(function() {
                        expect(trigger).toBeTruthy();
                    });
                });

                it("child parent application should be the main application", function() {
                    expect(childWindow.application).not.toBeNull();
                    expect(childWindow.application.parentApplication).toBe(mainApplication);
                    element = childWindow.document.getElementById("label");
                });

                it("child window component should be not null", function() {
                    expect(childWindow.component).not.toBeNull();
                    element = childWindow.document.getElementById("label");
                });

                it("child window label to be set", function() {
                    waitsFor(function() { return !childWindow.component.label.needsDraw; });

                    runs(function(){
                        expect(element.textContent).toBe(text);
                    });
                });

                it("child window inner size to be 100x100", function() {
                    expect(childWindow.window.innerWidth).toBe(100);
                    expect(childWindow.window.innerHeight).toBe(100);
                });

                it("should be focused", function() {
                    expect(childWindow.focused).toBeTruthy();
                    expect(mainWindow.focused).toBeFalsy();
                });

                it("resize child window to be 200x300", function() {
                    childWindow.resizeTo(200, 300);
                    waitsFor(function() { return childWindow.window.outerWidth == 200; });

                    runs(function() {
                        expect(childWindow.window.outerWidth).toBe(200);
                        expect(childWindow.window.outerHeight).toBe(300);
                    });
                });

                it("move child window to be [200,300]", function() {
                    childWindow.moveTo(200, 300);
                    waitsFor(function() {
                        return childWindow.window.screenX >= 200;
                    });

                    runs(function() {
                        // Some browser count the position starting from the toolbar and not the top of the screen
                        expect(childWindow.window.screenX).toBeGreaterThan(200 - 1);
                        expect(childWindow.window.screenY).toBeGreaterThan(300 - 1);
                    });
                });

                it("windows array should have 2 windows", function() {
                    expect(childWindow.application.windows.length).toBe(2);
                    expect(childWindow.application.windows[1]).toBe(childWindow);
                });

                it("main application should have an attached window", function() {
                    expect(mainApplication.attachedWindows.length).toBe(1);
                });

                it ("close", function() {
                    childWindow.close();
                    waitsFor(function() {
                        return childWindow.closed;
                    });
                    runs(function() {
                        expect(childWindow.closed).toBeTruthy();
                    });

                });

            });

            describe("mainApplication [after]", function() {
                it("windows array should have only the main window", function() {
                    expect(mainApplication.windows.length).toBe(1);
                    expect(mainApplication.windows[0]).toBe(mainWindow);
                });

                it("should not have any attached window", function() {
                    expect(mainApplication.attachedWindows.length).toBe(0);
                });
            });

        });

    });
});


