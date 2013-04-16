/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Template = require("montage/core/template").Template,
    TemplateResources = require("montage/core/template").TemplateResources,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/q"),
    objects = require("serialization/testobjects-v2").objects;

var DelegateMethods = require("reel/template/delegate-methods").DelegateMethods;

function createPage(url) {
    var iframe = document.createElement("iframe"),
        deferred = Promise.defer();

    iframe.src = url;
    iframe.onload = function() {
        deferred.resolve(iframe.contentWindow);
    };
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    iframe.contentWindow.__iframe__ = iframe;

    return deferred.promise;
}

function deletePage(page) {
    var iframe = page.__iframe__;

    iframe.parentNode.removeChild(iframe);
}

describe("reel/template-spec", function() {
    var template;

    beforeEach(function() {
        template = Template.create();
    });

    describe("initialization", function() {
        it("should initialize document and objects with the default", function() {
            template.initWithRequire(require);

            expect(template.objectsString).toBe("");
            expect(template.document.body.childNodes.length).toBe(0);
        });

        it("should initialize document and objects with HTML", function() {
            var html = require("reel/template/simple-template.html").content,
                expectedObjects = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            return template.initWithHtml(html)
            .then(function() {
                var children = template.document.body.children,
                    objects = JSON.parse(template.objectsString);

                expect(objects).toEqual(expectedObjects);
                expect(children.length).toBe(1);
                // there must be a better way to compare DOM tree's...
                expect(children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should initialize document and objects with a document", function() {
            var html = require("reel/template/simple-template.html").content,
                htmlDocument = document.implementation.createHTMLDocument(""),
                expectedObjects = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            htmlDocument.documentElement.innerHTML = html;

            return template.initWithDocument(htmlDocument)
            .then(function() {
                var children = template.document.body.children,
                    objects = JSON.parse(template.objectsString);

                expect(objects).toEqual(expectedObjects);
                expect(children.length).toBe(1);
                // there must be a better way to compare DOM tree's...
                expect(children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should initialize document and objects with objects and a document fragment", function() {
            var fragment = document.createDocumentFragment(),
                children,
                objects,
                expectedObjects = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            fragment.appendChild(document.createElement("span"))
                .setAttribute("data-montage-id", "text");

            template.initWithObjectsAndDocumentFragment(expectedObjects, fragment);

            children = template.document.body.children;
            objects = JSON.parse(template.objectsString);

            expect(objects).toEqual(expectedObjects);
            expect(children.length).toBe(1);
            // there must be a better way to compare DOM tree's...
            expect(children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
        });

        it("should initialize document and objects with a module id", function() {
            var moduleId = "reel/template/simple-template.html",
                expectedObjects = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            return template.initWithModuleId(moduleId, require)
            .then(function() {
                var children = template.document.body.children,
                    objects = JSON.parse(template.objectsString);

                expect(objects).toEqual(expectedObjects);
                expect(children.length).toBe(1);
                // there must be a better way to compare DOM tree's...
                expect(children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should reuse the same template instance for the same module id", function() {
            var moduleId = "reel/template/simple-template.html";

            return Template.getTemplateWithModuleId(moduleId, require)
            .then(function(template1) {
                return Template.getTemplateWithModuleId(moduleId, require)
                .then(function(template2) {
                    expect(template1).toBe(template2);
                });
            });
        });
    });

    describe("objects", function() {
        it("should change the objects of a template", function() {
            var expectedObjects = {
                "array": {
                    "value": [1, 2, 3]
                },

                "object": {
                    "value": {
                        "array": {"@": "array"}
                    }
                },

                "repetition": {
                    "prototype": "montage/ui/repetition.reel",
                    "properties": {
                        "element": {"#": "repetition"}
                    }
                }
            };

            template.initWithRequire(require);

            template.setObjects(expectedObjects);
            expect(JSON.parse(template.objectsString)).toEqual(expectedObjects);
        });

        it("should instantiate the objects with an document fragment", function() {
            var html = require("reel/template/simple-template.html").content,
                div = document.createElement("div"),
                fragment = document.createDocumentFragment();

            fragment.appendChild(div)
                .setAttribute("data-montage-id", "text");

            return template.initWithHtml(html, require)
            .then(function() {
                return template._instantiateObjects(null, fragment)
                .then(function(objects) {
                    var text = objects.text;

                    expect(text).toBeDefined();
                    expect(text.value).toBe("Hello, World!");
                    expect(text.element).toBe(div);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should read the objects from an external file", function() {
            var moduleId = "reel/template/external-objects-file.html",
                expectedSerialization = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            return Template.getTemplateWithModuleId(moduleId, require)
            .then(function(template) {
                var serialization = template.getSerialization()
                    .getSerializationObject();

                expect(serialization).toEqual(expectedSerialization);
            });
        });
    });

    describe("markup", function() {
        it("should change the markup of a template", function() {
            var html = require("reel/template/simple-template.html").content,
                htmlDocument = document.implementation.createHTMLDocument(""),
                expectedObjects = {
                    "owner": {
                        "properties": {
                            "element": {"#": "owner"},
                        }
                    }
                };

            htmlDocument.documentElement.innerHTML = html;
            template.initWithRequire(require);
            template.setObjects(expectedObjects);

            template.setDocument(htmlDocument);

            var children = template.document.body.children,
                objects = JSON.parse(template.objectsString);

            expect(objects).toEqual(expectedObjects);
            expect(children.length).toBe(1);
            // there must be a better way to compare DOM tree's...
            expect(children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
        });

        it("should clone the markup out of the document", function() {
            var html = require("reel/template/simple-template.html").content,
                expectedObjects = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "text"},
                            "value": "Hello, World!"
                        }
                    }
                };

            return template.initWithHtml(html)
            .then(function() {
                var fragment = template._createMarkupDocumentFragment(document),
                    element = document.createElement("div"),
                    children = template.document.body.children;

                // fragment doesn't have the "children" interface
                element.appendChild(fragment);

                expect(element.children.length).toBe(1);
                expect(element.children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
                expect(element.children[0]).toNotBe(children[0]);
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should add a node to the template without collisions", function() {
            var html = require("reel/template/modification.html").content,
                htmlModification = require("reel/template/modification-elements.html").content,
                htmlDocument = document.implementation.createHTMLDocument(""),
                collisionTable;

            template.initWithHtml(html, require);
            htmlDocument.documentElement.innerHTML = htmlModification;

            node = htmlDocument.getElementById("noCollision");
            reference = template.getElementById("title");

            collisionTable = template.insertNodeBefore(node, reference);

            expect(collisionTable).toBeUndefined();
            expect(reference.previousSibling).toBe(node);
        });

        it("should add a node to the template with collisions", function() {
            var html = require("reel/template/modification.html").content,
                htmlModification = require("reel/template/modification-elements.html").content,
                htmlDocument = document.implementation.createHTMLDocument(""),
                children,
                collisionTable,
                expectedCollisionTable;

            template.initWithHtml(html, require);
            htmlDocument.documentElement.innerHTML = htmlModification;

            node = htmlDocument.getElementById("collisions");
            reference = template.getElementById("title");

            title = htmlDocument.getElementById("title");

            collisionTable = template.insertNodeBefore(node, reference);
            expectedCollisionTable = {
                "repetition": node.getAttribute("data-montage-id"),
                "title": title.getAttribute("data-montage-id")
            };

            expect(collisionTable).toEqual(expectedCollisionTable);
        });

        it("should append a node to the template", function() {
            var html = require("reel/template/modification.html").content,
                htmlModification = require("reel/template/modification-elements.html").content,
                htmlDocument = document.implementation.createHTMLDocument("");

            template.initWithHtml(html, require);
            htmlDocument.documentElement.innerHTML = htmlModification;

            node = htmlDocument.getElementById("noCollision");
            reference = template.getElementById("title").parentNode;

            template.appendNode(node, reference);

            expect(reference.children.length).toBe(2);
            expect(reference.lastChild).toBe(node);
        });
    });

    describe("instantiation", function() {
        it("should have the same markup as the template", function() {
            var html = require("reel/template/simple-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    var _document = documentPart.fragment.ownerDocument,
                        element;

                    element = _document.createElement("div");
                    element.appendChild(documentPart.fragment);

                    expect(element.children.length).toBe(1);
                    expect(element.children[0].outerHTML).toBe('<span data-montage-id="text"></span>');
                })
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should reference the template", function() {
            var html = require("reel/template/simple-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    expect(documentPart.template).toBe(template);
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should only reference objects that were declared in the template", function() {
            var html = require("reel/template/simple-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    expect(Object.keys(documentPart.objects).length).toBe(1);
                    expect(documentPart.objects.text).toBeDefined();
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should instantiate an empty template", function() {
            var html = require("reel/template/empty-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    expect(documentPart.objects).toEqual({});
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should have the correct child components", function() {
            var html = require("reel/template/component-tree-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(documentPart.childComponents)
                        .toEqual([objects.title, objects.rows]);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should instantiate a template with instances", function() {
            var html = require("reel/template/simple-template.html").content,
                text = {},
                instances = {
                    text: text
                };

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    expect(documentPart.objects.text).toBe(text);
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should use the object instances set when none is given", function() {
            var html = require("reel/template/simple-template.html").content,
                text = {},
                instances = {
                    text: text
                };

            return template.initWithHtml(html, require)
            .then(function() {
                template.setInstances(instances);

                return template.instantiate(document)
                .then(function(documentPart) {
                    expect(documentPart.objects.text).toBe(text);
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should ignore the object instances set when one is given", function() {
            var html = require("reel/template/simple-template.html").content,
                text = {},
                instances = {
                    text: text
                };

            return template.initWithHtml(html, require)
            .then(function() {
                template.setInstances({text: {}});

                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    expect(documentPart.objects.text).toBe(text);
                })
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });
    });

    describe("delegate methods", function() {
        var DelegateMethods = require("reel/template/delegate-methods").DelegateMethods;

        it("should call deserializedFromTemplate", function() {
            var html = require("reel/template/delegate-methods-template.html").content,
                instances = {
                    two: DelegateMethods.create()
                };

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.owner.deserializedFromTemplateCount).toBe(1);
                    expect(objects.one.deserializedFromTemplateCount).toBe(1);
                    expect(objects.two.deserializedFromTemplateCount).toBe(0);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should not call deserializedFromTemplate on null values", function() {
            var html = require("reel/template/delegate-methods-null-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    expect(true).toBe(true);
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should call templateDidLoad on owner object", function() {
            var html = require("reel/template/delegate-methods-template.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiate(document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.owner.templateDidLoadCount).toBe(1);
                    expect(objects.one.templateDidLoadCount).toBe(0);
                    expect(objects.two.templateDidLoadCount).toBe(0);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should not call templateDidLoad on external objects", function() {
            var html = require("reel/template/delegate-methods-template-external.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                var instances = {
                    owner: DelegateMethods.create(),
                    one: DelegateMethods.create()
                }
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.owner.templateDidLoadCount).toBe(0);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });

        it("should not call deserializedFromTemplate on external objects", function() {
            var html = require("reel/template/delegate-methods-template-external.html").content;

            return template.initWithHtml(html, require)
            .then(function() {
                var instances = {
                    owner: DelegateMethods.create(),
                    one: DelegateMethods.create()
                }
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.one.deserializedFromTemplateCount).toBe(0);
                });
            }).fail(function() {
                expect("test").toBe("executed");
            });
        });
    });

    describe("external objects", function() {
        it("should have access to application object", function() {
            var html = require("reel/template/external-objects-template.html").content,
                instances = {
                    one: {}
                };

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.one.application).toBeDefined();
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should have access to template object", function() {
            var html = require("reel/template/external-objects-template.html").content,
                instances = {
                    one: {}
                };

            return template.initWithHtml(html, require)
            .then(function() {
                return template.instantiateWithInstances(instances, document)
                .then(function(documentPart) {
                    var objects = documentPart.objects;

                    expect(objects.one.template).toBe(template);
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    });

    describe("template resources", function() {
        it("should load all scripts except montage serialization", function() {
            var html = require("reel/template/resources-template.html").content,
                resources = TemplateResources.create();

            return createPage("reel/template/page.html")
            .then(function(page) {
                return template.initWithHtml(html)
                .then(function() {
                    resources.initWithTemplate(template);

                    return resources.loadScripts(page.document)
                    .then(function() {
                        expect(page.ReelTemplateResourceLoadCount).toBe(1);
                        expect(page.document.scripts.length).toBe(2);
                        deletePage(page);
                    });
                });
            }).fail(function(reason) {
                expect("test").toBe("executed");
            });
        });

        it("should load all scripts in two different documents in serial", function() {
            var html = require("reel/template/resources-template.html").content,
                resources = TemplateResources.create();

            return Promise.all([
                createPage("reel/template/page.html"),
                createPage("reel/template/page.html")])
            .then(function(pages) {
                var page1 = pages[0],
                    page2 = pages[1];

                return template.initWithHtml(html)
                .then(function() {
                    resources.initWithTemplate(template);

                    return resources.loadScripts(page1.document)
                    .then(function() {
                        return resources.loadScripts(page2.document)
                        .then(function() {
                            expect(page1.ReelTemplateResourceLoadCount).toBe(1);
                            expect(page2.ReelTemplateResourceLoadCount).toBe(1);
                            expect(page1.document.scripts.length).toBe(2);
                            expect(page2.document.scripts.length).toBe(2);
                            deletePage(page1);
                            deletePage(page2);
                        });
                    });
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });


        it("should load all scripts in two different documents in parallel", function() {
            var html = require("reel/template/resources-template.html").content,
                resources = TemplateResources.create();

            return Promise.all([
                createPage("reel/template/page.html"),
                createPage("reel/template/page.html")])
            .then(function(pages) {
                var page1 = pages[0],
                    page2 = pages[1];

                return template.initWithHtml(html)
                .then(function() {
                    resources.initWithTemplate(template);
                    return Promise.all([
                        resources.loadScripts(page1.document),
                        resources.loadScripts(page2.document)])
                    .then(function() {
                        expect(page1.ReelTemplateResourceLoadCount).toBe(1);
                        expect(page2.ReelTemplateResourceLoadCount).toBe(1);
                        expect(page1.document.scripts.length).toBe(2);
                        expect(page2.document.scripts.length).toBe(2);
                        deletePage(page1);
                        deletePage(page2);
                    });
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should load all styles", function() {
            var html = require("reel/template/resources-template.html").content,
                resources = TemplateResources.create();

            return createPage("reel/template/page.html")
            .then(function(page) {
                return template.initWithHtml(html)
                .then(function() {
                    resources.initWithTemplate(template);

                    return resources.loadStyles(page.document)
                    .then(function() {
                        expect(resources.getStyles().length).toBe(2);
                        deletePage(page);
                    });
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    });

    describe("sub templates", function() {
        describe("find element ids in DOM tree", function() {
            it("should find no element ids", function() {
                var moduleId = "reel/template/sub-template.html",
                    expectedIds = [],
                    elementIds,
                    node;

                return template.initWithModuleId(moduleId, require)
                .then(function() {
                    node = template.document.getElementById("title");
                    elementIds = template._getChildrenElementIds(node);
                    expect(elementIds.length).toBe(0);
                }).fail(function(reason) {
                    console.log(reason.stack);
                    expect("test").toBe("executed");
                });
            });

            it("should find a single element id", function() {
                var moduleId = "reel/template/sub-template.html",
                    expectedIds = [],
                    elementIds,
                    node;

                return template.initWithModuleId(moduleId, require)
                .then(function() {
                    node = template.document.getElementById("list");
                    elementIds = template._getChildrenElementIds(node);

                    expect(elementIds.length).toBe(1);
                    expect(elementIds).toContain("item")
                }).fail(function(reason) {
                    console.log(reason.stack);
                    expect("test").toBe("executed");
                });
            });

            it("should find all element ids of a populated tree", function() {
                var moduleId = "reel/template/sub-template.html",
                    expectedIds = [],
                    elementIds,
                    node;

                return template.initWithModuleId(moduleId, require)
                .then(function() {
                    node = template.document.getElementById("rows");
                    elementIds = template._getChildrenElementIds(node);

                    expect(elementIds.length).toBe(3);
                    expect(elementIds).toContain("row");
                    expect(elementIds).toContain("columns");
                    expect(elementIds).toContain("column");
                }).fail(function(reason) {
                    console.log(reason.stack);
                    expect("test").toBe("executed");
                });
            });
        });

        it("should create a sub template from a leaf element", function() {
            var moduleId = "reel/template/sub-template.html",
                expectedObjects = {
                    "item": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "item"}
                        }
                    },

                    "owner": {}
                },
                subTemplate,
                objects;

            return template.initWithModuleId(moduleId, require)
            .then(function() {
                subTemplate = template.createTemplateFromElementContents("list");
                objects = JSON.parse(subTemplate.objectsString);

                expect(objects).toEqual(expectedObjects);
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should create a sub template from a leaf element", function() {
            var moduleId = "reel/template/sub-template.html",
                expectedObjects = {
                    "list": {
                        "prototype": "montage/ui/repetition.reel",
                        "properties": {
                            "element": {"#": "list"}
                        }
                    },
                    "item": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "item"}
                        }
                    },

                    "owner": {}
                },
                subTemplate,
                objects;

            return template.initWithModuleId(moduleId, require)
            .then(function() {
                subTemplate = template.createTemplateFromElement("list");
                objects = JSON.parse(subTemplate.objectsString);

                expect(objects).toEqual(expectedObjects);
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should create a sub template with composed components", function() {
            var moduleId = "reel/template/sub-template.html",
                expectedObjects = {
                    "row": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "row"}
                        }
                    },

                    "columns": {
                        "prototype": "montage/ui/repetition.reel",
                        "properties": {
                            "element": {"#": "columns"}
                        }
                    },

                    "column": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "element": {"#": "column"}
                        }
                    },

                    "owner": {}
                },
                subTemplate,
                objects;

            return template.initWithModuleId(moduleId, require)
            .then(function() {
                subTemplate = template.createTemplateFromElementContents("rows");
                objects = JSON.parse(subTemplate.objectsString);

                expect(objects).toEqual(expectedObjects);
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    });

    describe("document (live) templates", function() {
        it("should instantiate in a live page", function() {
            var module = require("montage/core/template");

            return createPage("reel/template/simple-template.html")
            .then(function(page) {
                return module.instantiateDocument(page.document, require)
                .then(function(part) {
                    expect(part.template).toBeDefined();
                    expect(part.objects.text).toBeDefined();
                    //expect(part.fragment).toBe(page.document.documentElement);
                    //expect(part.childComponents.length).toBe(1);
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    })

    describe("template parameters", function() {
        it("should find the star parameter", function() {
            var html = require("reel/template/template-star-parameter.html").content;

            return template.initWithHtml(html)
            .then(function() {
                var templateParameters = template.getParameters(),
                    templateParameterKeys = Object.keys(templateParameters);

                expect(templateParameterKeys.length).toBe(1);
                expect(templateParameterKeys).toContain("*");
            })
        });

        it("should find all parameters", function() {
            var html = require("reel/template/template-parameters.html").content;

            return template.initWithHtml(html)
            .then(function() {
                var templateParameters = template.getParameters(),
                    templateParameterKeys = Object.keys(templateParameters);

                expect(templateParameterKeys.length).toBe(2);
                expect(templateParameterKeys).toContain("leftSide");
                expect(templateParameterKeys).toContain("rightSide");
            })
        });

        it("should fail when star and other parameters were declared", function() {
            var html = require("reel/template/template-parameters-error.html").content;

            return template.initWithHtml(html)
            .then(function() {
                try {
                    template.getParameters();
                    expect("call").toBe("fail");
                } catch (ex) {
                    expect(true).toBe(true);
                }
            })
        });

        it("should fail when the same parameter is declared more than once", function() {
            var html = require("reel/template/template-duplicate-parameters.html").content;

            return template.initWithHtml(html)
            .then(function() {
                try {
                    template.getParameters();
                    expect("call").toBe("fail");
                } catch (ex) {
                    expect(true).toBe(true);
                }
            })
        });
    });

    describe("expanding template parameters", function() {
        var parametersTemplate,
            argumentsTemplate;

        beforeEach(function() {
            parametersTemplate = Template.create();
            argumentsTemplate = Template.create();
        });

        it("should expand a parameter with non-colliding element", function() {
            var parametersHtml = require("reel/template/template-star-parameter.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(template.getElementById("list"));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    args;

                parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                repetition = parametersTemplate.getElementById("repetition");
                args = repetition.children[0].children;

                expect(args.length).toBe(2);
                expect(args[0].textContent).toBe("Section");
                expect(args[1].textContent).toBe("Paragraph");
            });
        });

        it("should expand a parameter with colliding element", function() {
            var parametersHtml = require("reel/template/template-star-parameter.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("element-id-collision"));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    args;

                parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                repetition = parametersTemplate.getElementById("repetition");
                args = repetition.children[0].children;

                expect(parametersTemplate.getElementId(args[0]))
                    .not.toBe("repetition");
            });
        });

        it("should expand multiple parameters with non-colliding element", function() {
            var parametersHtml = require("reel/template/template-parameters.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("multiple-elements-" + name));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    side;

                parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                side = parametersTemplate.getElementById("leftSide");
                expect(side.children.length).toBe(1);
                expect(side.children[0].textContent).toBe("Left Side");

                side = parametersTemplate.getElementById("rightSide");
                expect(side.children.length).toBe(1);
                expect(side.children[0].textContent).toBe("Right Side");
            });
        });

        it("should expand multiple parameters with colliding elements", function() {
            var parametersHtml = require("reel/template/template-parameters.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("multiple-elements-colliding-" + name));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    side,
                    leftSideElementId,
                    rightSideElementId;

                parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                side = parametersTemplate.getElementById("leftSide");
                leftSideElementId = parametersTemplate.getElementId(
                    side.children[0]);

                side = parametersTemplate.getElementById("rightSide");
                rightSideElementId = parametersTemplate.getElementId(
                    side.children[0]);

                expect(leftSideElementId).not.toBe("leftSide");
                expect(rightSideElementId).not.toBe("rightSide");
                expect(leftSideElementId).not.toBe(rightSideElementId);
            });
        });

        it("should expand a parameter with element and non-colliding objects", function() {
            var parametersHtml = require("reel/template/template-star-parameter.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate,
                serialization;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("objects-no-collision"));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    args,
                    expansionResult;

                expansionResult = parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                serialization = parametersTemplate.getSerialization();
                labels = serialization.getSerializationLabels();

                expect(expansionResult.labelsCollision).toBeFalsy();
                expect(labels).toContain("section");
            });
        });

        it("should expand a parameter with element and colliding objects", function() {
            var parametersHtml = require("reel/template/template-star-parameter.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate,
                serialization;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("objects-collision"));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    args,
                    collisionTable;

                collisionTable = parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                serialization = parametersTemplate.getSerialization();
                labels = serialization.getSerializationLabelsWithElements(
                    ["foo"]);

                expect(labels).not.toContain("foo");
            });
        });

        it("should expand multiple parameters with elements and colliding objects", function() {
            var parametersHtml = require("reel/template/template-parameters.html").content,
                argumentsHtml = require("reel/template/template-arguments.html").content,
                delegate,
                serialization;

            delegate = {
                getTemplateParameterArgument: function(template, name) {
                    range = document.createRange();
                    range.selectNodeContents(
                        template.getElementById("multiple-objects-" + name));
                    return range.extractContents();
                }
            };

            return Promise.all([
                parametersTemplate.initWithHtml(parametersHtml),
                argumentsTemplate.initWithHtml(argumentsHtml)
            ]).then(function() {
                var repetition,
                    expansionResult,
                    labelsCollisions,
                    labels,
                    serializationObject,
                    leftSide,
                    rightSide;

                expansionResult = parametersTemplate.expandParameters(
                    argumentsTemplate, delegate);

                serialization = parametersTemplate.getSerialization();
                serializationObject = serialization.getSerializationObject();
                labelsCollisions = expansionResult.labelsCollisions;
                labels = Object.keys(labelsCollisions);

                expect(labels.length).toBe(2);
                expect(labels).toContain("leftSide");
                expect(labels).toContain("rightSide");

                leftSide = serializationObject[labelsCollisions.leftSide];
                rightSide = serializationObject[labelsCollisions.rightSide];

                // Make sure the binding from rightSide to leftSide was
                // changed to the new label.
                expect(rightSide.bindings.value["<-"])
                    .toBe("@" + labelsCollisions.leftSide + ".value");
            });
        });
    });

    describe("cache", function() {
        it("should treat same module id in different package as different templates", function() {
            return require.loadPackage("package-a").then(function(pkg1) {
                return require.loadPackage("package-b").then(function(pkg2) {
                    return Template.getTemplateWithModuleId("ui/main.reel/main.html", pkg1)
                    .then(function(template1) {
                        return Template.getTemplateWithModuleId("ui/main.reel/main.html", pkg2)
                        .then(function(template2) {
                            expect(template1).toNotBe(template2);
                        });
                    });
                });
            }).fail(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    });
});
