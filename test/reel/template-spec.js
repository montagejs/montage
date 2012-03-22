/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Template = require("montage/ui/template").Template,
    Component = require("montage/ui/component").Component,
    Serializer = require("montage/core/serializer").Serializer,
    objects = require("serialization/testobjects-v2").objects;

var testPage = TestPageLoader.queueTest("template", function() {
    describe("reel/template-spec", function() {
        var eventManager,
            application;

        var querySelector = function(s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function(s) {
            return testPage.querySelectorAll(s);
        };

        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
            application = testPage.window.document.application;
            eventManager = application.eventManager;
        });

        describe("main document template", function() {
            it("should draw all components", function() {
                expect(querySelectorAll("input.textfield0").length).toBe(1);
                expect(querySelectorAll(".content1 > input.textfield").length).toBe(1);
                expect(querySelectorAll(".content2 > input.textfield").length).toBe(1);
            });
        });

        describe("instantiation delegates", function() {
            it("should call templateDidLoad function on the root object", function() {
                var component = objects.Comp.create();
                component.element = document.createElement("div");
                component.element.id = "myDiv";
                component.child = objects.Comp.create();
                var htmlDocument = document.implementation.createHTMLDocument("");

                var script = htmlDocument.createElement("script");
                script.setAttribute("type", Template._SCRIPT_TYPE);
                script.textContent = Serializer.create().initWithRequire(require).serialize({owner: component});
                htmlDocument.head.appendChild(script);

                var template = Template.create().initWithDocument(htmlDocument);
                template.instantiateWithComponent(component, function() {
                    expect(component.templateDidLoadCount).toBe(1);
                    expect(component.child.templateDidLoadCount).toBe(0);
                });
            });

            it("should call deserializedFromTemplate function on the instantiated objects", function() {
                var component = objects.Comp.create();
                component.element = document.createElement("div");
                component.element.id = "myDiv";
                component.child = objects.Comp.create();
                var htmlDocument = document.implementation.createHTMLDocument("");

                var script = htmlDocument.createElement("script");
                script.setAttribute("type", Template._SCRIPT_TYPE);
                script.textContent = Serializer.create().initWithRequire(require).serialize({owner: component});
                htmlDocument.head.appendChild(script);
                var latch,
                    componentDeserializedFromTemplateCount,
                    childDeserializedFromTemplateCount,
                    template = Template.create().initWithDocument(htmlDocument);

                template.instantiateWithComponent(component, function() {
                    componentDeserializedFromTemplateCount = component.deserializedFromTemplateCount;
                    childDeserializedFromTemplateCount = component.child.deserializedFromTemplateCount;
                    latch = true;
                });

                waitsFor(function() { return latch; });
                runs(function() {
                    expect(componentDeserializedFromTemplateCount).toBe(0);
                    expect(childDeserializedFromTemplateCount).toBe(1);
                });
            });
        });

        describe("Styled components", function() {
            it("should import the styles of the component template", function() {
                var element = querySelector(".componentstyle");
                var subelement = querySelector(".componentstyle > div");
                var win = element.ownerDocument.defaultView;
                var style;

                style = win.getComputedStyle(element);
                expect(style.getPropertyValue("position")).toBe("relative");

                style = win.getComputedStyle(subelement);
                expect(style.getPropertyValue("position")).toBe("absolute");
                expect(style.getPropertyValue("border-left-width")).toBe("1px");
                expect(style.getPropertyValue("padding-left")).toBe("5px");
            });

            it("should load the styles of the component before drawing it", function() {
                var component = application.delegate.slowstyle,
                    element = querySelector(".componentslowstyle"),
                    left;

                spyOn(component, 'didDraw').andCallFake(function() {
                    var subelement = querySelector(".componentslowstyle > div"),
                        win = element.ownerDocument.defaultView;
                    style = win.getComputedStyle(subelement);
                    expect(style.getPropertyValue("left")).toBe("300px");
                });

                component.element = element;
                component.needsDraw = true;
                testPage.waitForDraw();
                runs(function() {
                    expect(component.didDraw).toHaveBeenCalled();
                });
            });
        });

        describe("Installation of listeners", function() {
            it("should install bindings", function() {
                var component = querySelector("input.textfield0").controller;
                var listener = eventManager.registeredEventListenersForEventType_onTarget_("change@text", component);

                expect(listener).toBeDefined();
            });

            it("should install action listeners", function() {
                var component = querySelector("input.textfield0").controller;
                spyOn(application.delegate, "listener");

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("action", true, true, null);

                component.dispatchEvent.call(component, anEvent);
                expect(application.delegate.listener).toHaveBeenCalled();
            });
        });

        it("should maintain external references", function() {
            var comp = Montage.create(Component),
                rootComp = Montage.create(Component, {
                    serializeProperties: {value: function(serializer) {
                        serializer.set("object", comp, "reference");
                    }}
                }),
                template = Template.create(),
                newRootComp = Montage.create(Component);

            rootComp.element = document.createElement("div");
            newRootComp.element = document.createElement("div");
            template.initWithComponent(rootComp);
            template.instantiateWithComponent(newRootComp, function() {
                expect(newRootComp.object).toBe(comp);
            });
        });

        it("should be able to reference the template object", function() {
            var component = application.delegate.template;
            
            expect(component.templateReference).toBe(component._template);
        });

        it("should change the draw of a component by extending", function() {
            var element = querySelector(".componentson");

            expect(element.textContent).toBe("Component Son");
        });

        it("should change the markup of a component by extending a template", function() {
            var component = application.delegate.daughter,
                element = component.element;

            expect(element).toBeDefined();
            expect(element.innerHTML).toBe('\n        <div class="header">Component Daughter <span data-montage-id="label">Label</span></div>\n        \n        <div>Component Mother</div>\n        <div>Mother Content</div>\n    \n    ');
            expect(window.getComputedStyle(element).getPropertyValue("color")).toBe("rgb(255, 192, 203)");
            expect(component.motherTemplateLoaded).toBeDefined();
            expect(querySelector(".componentdaughter .partOfMotherTemplate")).toBeDefined();
        });

        it("should call deserializedFromTemplate once on non-owner components of extended templates", function() {
            var component = application.delegate.granddaughter;

            expect(component.label.didDeserializedFromTemplate).toBeTruthy();
        });

        it("should call templateDidLoad only once on the owner component of extended templates", function() {
            var component = application.delegate.granddaughter;

            expect(component.templateDidLoadCallCount).toBe(1);
        });

        it("should", function() {
            var component = application.delegate.granddaughtersister;

            component.element = querySelector(".componentgranddaughtersister");
            component.needsDraw = true;
            testPage.waitForDraw();
            runs(function() {
                expect(component.element.innerHTML).toBe('\n        <div class="header">Component Granddaughter</div>\n        \n        <div class="header">Component Daughter <span data-montage-id="label">Label</span></div>\n        \n        <div>Component Mother</div>\n        <div>Mother Content</div>\n    \n    \n    ');
                expect(component.label).toBeDefined();
                expect(component.label.didDeserializedFromTemplate).toBeTruthy();
                expect(component.templateDidLoadCallCount).toBe(1);
            });
        });

        it("TODO should load external scripts", function() {
            var component = application.delegate.script;
            expect(component).not.toBeUndefined();
            if (component) {
                expect(component._element.ownerDocument.querySelectorAll('script[src$="/componentscript.reel/componentscript-script.js"]').length).toBe(1);
                expect(testPage.window.HeresAGlobalVariableFromComponentScript).toBeTruthy();
            }
        });
    });
});
