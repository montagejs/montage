/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;


/**
* Converter to Turn a justify value into boolean string
*/
exports.ValueConverter = Montage.create(Converter, {
    value: {value: null},
    defaultValue: {value: undefined},

    convert: {
        enumerable: false,
        value: function(value) {
            return value === this.value ? true : false;
        }
    },

    revert: {
        enumerable: false,
        value: function(value) {
            return value === true ? this.value : this.defaultValue;
        }
    }
});

/**
* Converter to Turn a value into a array controller index
*/
exports.IndexesConverter = Montage.create(Converter, {
    component : { value: null },
    debug : { value: false },

    convert: {
        enumerable: false,
        value: function(indexes) {
            var index = indexes && indexes.length ? indexes[0] : 0,
                value = this.component.content[index].value;
            if (this.debug) {console.log("CONVERT:", indexes, value);}
            return value;
        }
    },

    revert: {
        enumerable: false,
        value: function(value) {
            var index = this.component._indexOf(value);
            if (this.debug) {console.log("REVERT:", value, index != -1 ? [index] : [0]);}
            return index != -1 ? [index] : [0];
        }
    }
});

exports.RIndexesConverter = Montage.create(Converter, {
    component : { value: null },


    convert: {
        enumerable: false,
        value: function(value) {
            var index = this.component._indexOf(value);
            if (this.debug) {console.log("CONVERT:", value, index);}
            return index != -1 ? [index] : [0];
        }
    },

    revert: {
        enumerable: false,
        value: function(indexes) {
            if (this.debug) {console.log("REVERT:", value);}
            var index = indexes && indexes.length ? indexes[0] : 0,
                value = this.component.content[index].value;
            return value;
        }
    }
});

exports.FontnameConverter = Montage.create(Converter, {
    component : { value: null },
    debug : { value: false },

    convert: {
        enumerable: false,
        value: function(indexes) {
            var index = indexes && indexes.length ? indexes[0] : 0,
                value = this.component.content[index].value;
            if (this.debug) {console.log("CONVERT:", indexes, value);}
            return value;
        }
    },

    revert: {
        enumerable: false,
        value: function(value) {
            var fontNames = value ? value.replace(" ,", ",").split(",") : null ,
                nbrFontnames = fontNames ? fontNames.length : 0,
                i,
                index = -1;

            for (i = 0; i < nbrFontnames; i ++) {
                index = this.component._indexOf(fontNames[i]);
                if (index !== -1) {
                    break;
                }
            }

            if (this.debug) {console.log("REVERT:", value, index != -1 ? [index] : [0]);}
            return index != -1 ? [index] : [0];
        }
    }
});

exports.RichTextEditorExample = Montage.create(Component, {

    __initvalue: {value: null},
    _initValue: {
        get: function() {
            return this.__initValue;
        },
        set: function(value) {
            this.__initValue = value;
            if(this.editor) {
                this.editor.value = this.__initValue;
            }

            this.needsDraw = true;
        }
    },

    deserializedFromTemplate: {
        value: function() {
            var savedValue = null; //localStorage.getItem("savedValue");
            if (savedValue) {
                this._initValue = savedValue;
            } else {
                this.loadDefaultContent();
            }
            if(this.editor) {

            }
        }
    },

    loadDefaultContent: {
        value: function() {
            var editor = this.editor;

            // Restore the editor content
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'ui/components/rich-text-editor-example.reel/assets/default-text.html', true);
            xhr.responseType = 'text';
            var self = this;

            xhr.onload = function(event) {
                if (this.status == 200) {
                    self._initValue = this.response;
                } else {
                    self._initValue = "";
                }
            };

            xhr.send();
        }
    },

    handleAction: {
        value: function(event) {
            var target = event.target;

            switch (target.identifier) {

                case "undo":
                    this.undoManager.undo();
                    break;

                case "redo":
                    this.undoManager.redo();
                    break;
            }
        }
    },

    prepareForDraw: {
        value: function() {
            if(this._initValue) {
                this.editor.value = this._initValue;
            }
        }
    },

    // Rich Textfield event & delegate methods
    handleEditorChange: {
        enumerable: false,
        value: function(event) {
            var value = this.editor.value,
                selfClosingTags = ["area", "base", "basefont", "br", "bgsound", "col", "command", "embed", "frame", "hr",
                    "input", "img", "isindex", "keygen", "link", "meta", "param", "source", "track", "wbr"],
                indent = 0,
                lastType,
                padding = "                                ",
                div = document.createElement("div"),
                output = "";

            localStorage.setItem("savedValue", value);

            // Reformat the value for the source panel
            value = value.replace(/[\n\r]+/g, "");
            value.replace(/\<(\/?)([a-z0-9]+)[^>]*>|([^<>]+)/g, function(match, closed, tag, text) {
                var currentPadding = padding.substr(0, Math.min(indent * 2, 32));

                if (text) {
                    lastType = "text";
                } else {
                    lastType = tag;
                    if (selfClosingTags.indexOf(tag.toLowerCase()) == -1) {
                        if (closed) {
                            indent --;
                            if (indent < 0) {
                                indent = 0;
                            }
                            currentPadding = padding.substr(0, Math.min(indent * 2, 32));
                        } else {
                            indent ++;
                        }
                    }
                }

                // Convert plain-text to HTML
                div.textContent = match;
                match = div.innerHTML;

                output += '<pre class="type-' + lastType+ '">' + currentPadding + match +'</pre>';
            });

            this.source.innerHTML = output;
        }
    }
});


