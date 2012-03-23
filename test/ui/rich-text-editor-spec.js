/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

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
                            runs(function(){
                                test.editor1.undo();
                                test.editor1.selectAll();
                                expect(test.editor1.bold).toBeFalsy();
                                expect(test.editor1.value).toBe(text);
                            });
                        });
/* Failed on Safari, need to be investigated!
                        it("redo bold", function() {
                            runs(function(){
                                test.editor1.redo();
                                test.editor1.selectAll();
                                expect(test.editor1.bold).toBeTruthy();
                            });
                        });
*/

                    });

                });

            });

        });
    });
});