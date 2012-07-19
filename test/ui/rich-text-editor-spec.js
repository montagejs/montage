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
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    EventInfo = require("support/testpageloader").EventInfo;

var testPage = TestPageLoader.queueTest("rich-text-editor-test", function() {
    var test = testPage.test;

    describe("ui/rich-text-editor-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("RichTextEditor", function(){
            it("can be created", function() {
                expect(test.editor1).toBeDefined();
                expect(test.editor2).toBeDefined();
            });

            describe("Once loaded", function() {
                describe ("value and textValue testing", function() {
                    it("origal content has been injected", function() {
                        expect(test.editor1.value).toBe("Hello Montage");
                    });

                    it("value from serialization has been set", function() {
                        expect(test.editor2.value).toBe("Montage Rocks!");
                    });

                    it("can set a new value", function() {
                        runs(function(){
                            var text = "Do you speak HTML?";
                            test.editor1.value = text;
                            testPage.waitForDraw();
                            expect(test.editor1.value).toBe(text);
                        });
                    });

                    it("can set a value as plain text and retrieve it as HTML", function() {
                        test.editor1.textValue = "This is not a an HTML <tag>";
                        testPage.waitForDraw();
                        runs(function(){
                            expect(test.editor1.value).toBe("This is not a an HTML &lt;tag&gt;");
                        });
                    });

                    it("can set a value as HTML and retrieve it as plain text", function() {
                        var text = "Can you convert HTML to plain text?";
                        test.editor1.value = "<b>" + text + "</b>";
                        testPage.waitForDraw();
                        runs(function(){
                            expect(test.editor1.textValue).toBe(text);
                        });
                    });
                });

                describe ("style properties testing", function() {
                    it("set to bold", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.bold = true;
                            expect(test.editor1.bold).toBeTruthy();
                            expect(test.getStyleOfSelectedElement(test.editor1).fontWeight).toMatch(/bold|700/);
                        });
                    });
                    it("remove bold", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.bold = false;
                            expect(test.editor1.bold).toBeFalsy();
                            expect(test.getStyleOfSelectedElement(test.editor1).fontWeight).toMatch(/normal|400/);
                        });
                    });

                    it("set to italic", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.italic = true;
                            expect(test.editor1.italic).toBeTruthy();
                            expect(test.getStyleOfSelectedElement(test.editor1).fontStyle).toBe("italic");
                        });
                    });
                    it("remove italic", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.italic = false;
                            expect(test.editor1.bold).toBeFalsy();
                            expect(test.getStyleOfSelectedElement(test.editor1).fontStyle).toBe("normal");
                        });
                    });

                    it("set to underline", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.underline = true;
                            expect(test.editor1.underline).toBeTruthy();
                            expect(test.getStyleOfSelectedElement(test.editor1).textDecoration).toBe("underline");
                        });
                    });
                    it("remove underline", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.underline = false;
                            expect(test.editor1.underline).toBeFalsy();
                            expect(test.getStyleOfSelectedElement(test.editor1).textDecoration).toBe("none");
                        });
                    });

                    it("set to strikethrough", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.strikeThrough = true;
                            expect(test.editor1.strikeThrough).toBeTruthy();
                            expect(test.getStyleOfSelectedElement(test.editor1).textDecoration).toBe("line-through");
                        });
                    });
                    it("remove strikethrough", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.strikeThrough = false;
                            expect(test.editor1.strikeThrough).toBeFalsy();
                            expect(test.getStyleOfSelectedElement(test.editor1).textDecoration).toBe("none");
                        });
                    });
                    it("set baselineShift to subscript", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.baselineShift = "subscript";
                            expect(test.editor1.baselineShift).toBe("subscript");
                            expect(test.getStyleOfSelectedElement(test.editor1).verticalAlign).toBe("sub");
                        });
                    });
                    it("set baselineShift to superscript", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.baselineShift = "superscript";
                            expect(test.editor1.baselineShift).toBe("superscript");
                            expect(test.getStyleOfSelectedElement(test.editor1).verticalAlign).toBe("super");
                        });
                    });
                    it("set baselineShift to baseline", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.baselineShift = "baseline";
                            expect(test.editor1.baselineShift).toBe("baseline");
                            expect(test.getStyleOfSelectedElement(test.editor1).verticalAlign).toBe("baseline");
                        });
                    });

                    it("indent", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.indent();
                            expect(test.getStyleOfSelectedElement(test.editor1).marginLeft).toBe("40px");
                        });
                    });
                    it("outdent", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.outdent();
                            expect(test.getStyleOfSelectedElement(test.editor1).marginLeft).toMatch(/0|0px/);
                        });
                    });

                    it("set listStyle to unordered", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.listStyle = "unordered";
                            expect(test.editor1.listStyle).toBe("unordered");
                            var element = test.getSelectedElement(test.editor1);
                            // Safari add an extra span
                            if (element.nodeName == "SPAN") {
                                element = element.parentNode.parentNode;
                            } else {
                                element = element.parentNode;
                            }
                            expect(element.nodeName).toBe("UL");
                        });
                    });
                    it("set listStyle to ordered", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.listStyle = "ordered";
                            expect(test.editor1.listStyle).toBe("ordered");
                            var element = test.getSelectedElement(test.editor1);
                            // Safari add an extra span
                            if (element.nodeName == "SPAN") {
                                element = element.parentNode.parentNode;
                            } else {
                                element = element.parentNode;
                            }
                            expect(element.nodeName).toBe("OL");
                        });
                    });
                    it("set listStyle to none", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.listStyle = "none";
                            expect(test.editor1.listStyle).toBe("none");
                            var element = test.getSelectedElement(test.editor1);
                            // Safari add an extra span
                            if (element.nodeName == "SPAN") {
                                element = element.parentNode;
                            }
                            expect(element.nodeName).not.toBe("IL");
                        });
                    });

                    it("set justify to center", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.justify = "center";
                            expect(test.editor1.justify).toBe("center");
                            expect(test.getStyleOfSelectedElement(test.editor1).textAlign).toBe("center");
                        });
                    });

                    it("set justify to right", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.justify = "right";
                            expect(test.editor1.justify).toBe("right");
                            expect(test.getStyleOfSelectedElement(test.editor1).textAlign).toBe("right");
                        });
                    });

                    it("set justify to full", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.justify = "full";
                            expect(test.editor1.justify).toBe("full");
                            expect(test.getStyleOfSelectedElement(test.editor1).textAlign).toBe("justify");
                        });
                    });

                    it("set justify to left", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.justify = "left";
                            expect(test.editor1.justify).toBe("left");
                            expect(test.getStyleOfSelectedElement(test.editor1).textAlign).toBe("left");
                        });
                    });

                    it("set font name to Arial Black", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.fontName = "Arial Black";
                            expect(test.editor1.fontName).toBe("Arial Black");
                            expect(test.getStyleOfSelectedElement(test.editor1).fontFamily).toBe("'Arial Black'");
                        });
                    });

                    it("set font size to 7", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.fontSize = "7";
                            expect(test.editor1.fontSize).toBe("7");
                            expect(test.getStyleOfSelectedElement(test.editor1).fontSize).toBe("48px");
                        });
                    });

                    it("set foreColor to red", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.foreColor = "red";
                            expect(test.editor1.foreColor).toBe("rgb(255, 0, 0)");
                            expect(test.getStyleOfSelectedElement(test.editor1).color).toBe("rgb(255, 0, 0)");
                        });
                    });
                    it("set foreColor to rgb(0, 139, 0)", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.foreColor = "rgb(0, 139, 0)";
                            expect(test.editor1.foreColor).toBe("rgb(0, 139, 0)");
                            expect(test.getStyleOfSelectedElement(test.editor1).color).toBe("rgb(0, 139, 0)");
                        });
                    });
                    it("set foreColor to #888", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.foreColor = "#888";
                            expect(test.editor1.foreColor).toBe("rgb(136, 136, 136)");
                            expect(test.getStyleOfSelectedElement(test.editor1).color).toBe("rgb(136, 136, 136)");
                        });
                    });

                    it("set backColor to red", function() {
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.backColor = "red";
                            expect(test.editor1.backColor).toBe("rgb(255, 0, 0)");
                            expect(test.getStyleOfSelectedElement(test.editor1).backgroundColor).toBe("rgb(255, 0, 0)");
                        });
                    });
                    it("set backColor to rgb(0, 139, 0)", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.backColor = "rgb(0, 139, 0)";
                            expect(test.editor1.backColor).toBe("rgb(0, 139, 0)");
                            expect(test.getStyleOfSelectedElement(test.editor1).backgroundColor).toBe("rgb(0, 139, 0)");
                        });
                    });
                    it("set backColor to #888", function() {
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.backColor = "#888";
                            expect(test.editor1.backColor).toBe("rgb(136, 136, 136)");
                            expect(test.getStyleOfSelectedElement(test.editor1).backgroundColor).toBe("rgb(136, 136, 136)");
                        });
                    });

                });

                describe ("undo/redo testing", function() {
                    var text = "sample text";

                    it("reset the undoManager's stacks", function() {
                        test.resetUndoManager(test.editor1);
                        expect(test.editor1.undoManager.undoStack.length).toBe(0);
                        expect(test.editor1.undoManager.redoStack.length).toBe(0);
                    });

                    it("set content bold", function() {
                        test.editor1.value = text;
                        testPage.waitForDraw();
                        runs(function(){
                            test.editor1.selectAll();
                            test.editor1.bold = true;
                            expect(test.editor1.bold).toBeTruthy();
                            expect(test.editor1.value).not.toBe(text);
                        });
                    });
                    it("undo bold", function() {
                        test.editor1.undo();
                        waits(150);
                        runs(function(){
                            test.editor1.selectAll();
                            expect(test.editor1.bold).toBeFalsy();
                            expect(test.editor1.value).toBe(text);
                        });
                    });
                    it("redo bold", function() {
                        test.editor1.redo();
                        waits(150);
                        runs(function(){
                            test.editor1.selectAll();
                            expect(test.editor1.bold).toBeTruthy();
                        });
                    });

                    it("test undo/redo stacks consistency", function() {
                        runs(function(){
                            expect(test.editor1.undoManager.undoStack.length).toBe(1);
                            expect(test.editor1.undoManager.redoStack.length).toBe(0);
                        });
                    });
                });

                describe ("focus testing", function() {
                    it("set focus on editor 1", function() {
                        test.editor1.focus();
                        waits(150);
                        runs(function() {
                            expect(test.editor1.hasFocus).toBeTruthy();
                            expect(test.editor1.isActiveElement).toBeTruthy();
                            expect(test.editor2.hasFocus).toBeFalsy();
                            expect(test.editor2.isActiveElement).toBeFalsy();
                        });
                    });
                    it("set focus on editor 2", function() {
                        test.editor2.focus();
                        waits(150);
                        runs(function() {
                            expect(test.editor1.hasFocus).toBeFalsy();
                            expect(test.editor1.isActiveElement).toBeFalsy();
                            expect(test.editor2.hasFocus).toBeTruthy();
                            expect(test.editor2.isActiveElement).toBeTruthy();
                        });
                    });
                    it("blur editor 2", function() {
                        var testwindow = window.open ("about:blank","testWindow", "height=0, width=0");
                        testwindow.moveTo(0, 0);
                        testwindow.focus();
                        waits(150);
                        runs(function() {
                            expect(test.editor1.hasFocus).toBeFalsy();
                            expect(test.editor1.isActiveElement).toBeFalsy();
                            expect(test.editor2.hasFocus).toBeFalsy();
                            expect(test.editor2.isActiveElement).toBeTruthy();
                            testwindow.close();
                        });
                    });

                });

                describe ("read only testing", function() {
                    it("set the editor read only", function() {
                        test.editor1.readOnly = true;
                        waits(150);
                        runs(function() {
                            expect(test.editor1.readOnly).toBeTruthy();
                        });
                    });
                    it("check if the innerElement is read only", function() {
                        runs(function() {
                            expect(test.editor1.innerElement).toBeDefined();
                            expect(test.editor1.innerElement.getAttribute("contenteditable")).toBe("false");
                        });
                    });
                    it("set the editor writable", function() {
                        test.editor1.readOnly = false;
                        waits(150);
                        runs(function() {
                            expect(test.editor1.readOnly).toBeFalsy();
                        });
                    });
                    it("check if the innerElement is editable", function() {
                        runs(function() {
                            expect(test.editor1.innerElement).toBeDefined();
                            expect(test.editor1.innerElement.getAttribute("contenteditable")).toBe("true");
                        });
                    });
                });

                describe ("editor events testing", function() {
                    var receiveEvent = false,
                        method = function(event) {receiveEvent = true;},
                        sampleText = "let's move the selection...";

                    it("install editorChange event", function() {
                        test.editor1.addEventListener("editorChange", method);
                        test.editor1.value = "sample text";
                        testPage.waitForDraw();
                        runs(function() {
                        });
                    });
                    it("make sure we receive and editorChange event", function() {
                        waits(150);
                        runs(function() {
                            expect(receiveEvent).toBeTruthy();
                            test.editor1.removeEventListener("editorChange", method);
                        });
                    });

                    it("install editorSelect event", function() {
                        receiveEvent = false;
                        test.editor1.value = "";
                        testPage.waitForDraw();
                        runs(function() {
                            test.editor1.selectAll();
                            test.editor1.addEventListener("editorSelect", method);
                            test.editor1.execCommand("inserthtml", false, sampleText);
                        });
                    });
                    it("make sure the html fragment has been inserted to the correct editor and that we have receive an editorSelect event", function() {
                        waits(150);
                        runs(function() {
                            expect(test.editor1.textValue).toBe(sampleText);
                            expect(receiveEvent).toBeTruthy();
                            test.editor1.removeEventListener("editorSelect", method);
                        });
                    });
                });
                describe ("overlays testing", function() {
                    it("reset the editor and make sure we have the right overlays installed", function() {
                        test.editor1.focus();
                        test.editor1.value = '<img src="http://www.w3.org/html/logo/downloads/HTML5_Logo_64.png"><div><a href="http://www.w3.org/">www.W3.org</a></div><span>need some text to positioning the caret in a neutral element</span>';
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.editor1.overlays).toBeDefined();
                            expect(test.editor1.overlays.length).toBe(2);
                            expect(test.editor1.overlays[0]._montage_metadata.objectName).toBe("RichTextResizer");
                            expect(test.editor1.overlays[1]._montage_metadata.objectName).toBe("RichTextLinkPopup");
                        });
                    });
                    it("click on an image, test the image overlay is active", function() {
                        var element = test.editor1.innerElement.getElementsByTagName("IMG")[0],
                            eventInfo = {
                               target: element,
                               clientX: element.offsetLeft + 5,
                               clientY: element.offsetTop + 5
                            };
                        testPage.clickOrTouch(eventInfo);
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.editor1.activeOverlay).toBe(test.editor1.overlays[0]);
                        });
                    });
                    it("hide the resizer overlay", function() {
                        test.editor1.hideOverlay();
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.editor1.activeOverlay).toBeNull();
                        });
                    });
                    it("select an anchor, test the link popup overlay is active", function() {
                        var element = test.editor1.innerElement.getElementsByTagName("A")[0],
                            range;

                        range = document.createRange();
                        range.selectNodeContents(element);
                        range.collapse(true);

                        test.editor1._selectedRange = range;
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.editor1.activeOverlay).toBe(test.editor1.overlays[1]);
                        });
                    });
                    it("hide the link popup overlay", function() {
                        test.editor1.hideOverlay();
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.editor1.activeOverlay).toBeNull();
                        });
                    });
                });
            });
        });
    });
});
