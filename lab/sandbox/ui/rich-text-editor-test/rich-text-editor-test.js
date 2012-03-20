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
            if (this.debug) {console.log("CONVERT:", indexes, value)}
            return value;
        }
    },

    revert: {
        enumerable: false,
        value: function(value) {
            var index = this.component._indexOf(value);
            if (this.debug) {console.log("REVERT:", value, index != -1 ? [index] : [0])}
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
            if (this.debug) {console.log("CONVERT:", indexes, value)}
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

            if (this.debug) {console.log("REVERT:", value, index != -1 ? [index] : [0])}
            return index != -1 ? [index] : [0];
        }
    }
});

exports.RichTextEditorTest = Montage.create(Component, {

    deserializedFromTemplate: {
        value: function() {
            var savedValue = localStorage.getItem("savedValue"),
                savedShowSource = localStorage.getItem("savedShowSource");

            if (savedValue) {
                this.editor.value = savedValue;
                this.editor.focus();
            } else {
                this.loadDefaultContent();
            }

            if (savedShowSource === "true") {
                this.showSource.checked = savedShowSource;
            }

            // For debugging purpose only...
            editor = this.editor;

            this.draw();
        }
    },

    loadDefaultContent: {
        value: function() {
            var editor = this.editor;

            // Restore the editor content
            var xhr = new XMLHttpRequest();
            xhr.open('GET', './assets/default-text.html', true);
            xhr.responseType = 'text';

            xhr.onload = function(event) {
                if (this.status == 200) {
                    editor.value = this.response;
                } else {
                    editor.value = "";
                }
                editor.focus();
            };

            xhr.send();
        }
    },

    _readOnly: { value: false },
    readOnly: {
        get: function() { return this._readOnly },
        set: function(value) {
            this._readOnly = value;
            if (value) {
                this.editor.element.parentNode.classList.add("readonly");
            } else {
                this.editor.element.parentNode.classList.remove("readonly");
            }
        }
    },

    handleAction: {
        value: function(event) {
            var target = event.target;

            switch (target.identifier) {
                case "reset":
                    this.loadDefaultContent();
                    break;

                case "undo":
                    this.undoManager.undo();
                    break;

                case "redo":
                    this.undoManager.redo();
                    break;

                case "showRawSource":
                    localStorage.setItem("savedShowSource", this.showSource.checked);
                    this.draw();
                    break;
            }
        }
    },

    draw: {
        value: function() {
            if (this.showSource.checked) {
                this.source.parentNode.classList.remove("hideSource");
            } else {
                this.source.parentNode.classList.add("hideSource");
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
                                indent = 0
                            }
                            currentPadding = padding.substr(0, Math.min(indent * 2, 32))
                        } else {
                            indent ++;
                        }
                    }
                }

                // Convert plain-text to HTML
                div.textContent = match;
                match = div.innerHTML;

                output += '<pre class="type-' + lastType+ '">' + currentPadding + match +'</pre>'
            });

            this.source.innerHTML = output;

 //           this.source.innerText = this.editor.textValue;

        }
    },

    handleEditorSelect: {
        enumerable: false,
        value: function(editor) {
            /*
                the delegate provide a change for the consumer to do something when the selection has changed
             */
        }
    },

    editorCanDrag: {
        enumerable: false,
        value: function(editor, source) {
            return true;
        }
    },

    editorCanDrop: {
        enumerable: false,
        value: function(editor, source, event) {
            return true;
        }
    },

    editorFileDrop: {
        enumerable: false,
        value: function(editor, file, data) {
            /*
                the delegate provide a change for the consumer to handle the drop itself, refuse the drop or accept it

                possible return values:

                true: the richtext field will handle the drop itself
                false or null: the drop is canceled
             */

            console.log("DROP FILE:", file)
            if (!data) {
                data = '<html><body><div style="padding: 4px; border: 1px solid gray;">' + file.name + ' (FileReader not supported)</div></body></html>';
                console.log("DATA:", data)
                return data;
            }
            return true;
        }
    },

    editorDrop: {
        enumerable: false,
        value: function(editor, data, contentType) {
            /*
                the delegate provide a change for the consumer to handle the drop itself, refuse the drop, accept the
                drop or change the drop data

                possible return values:

                true: the richtext field will handle the drop itself
                false or null: the drop is canceled
                <string>: the richtext field will insert the string as html
             */
            return true;
        }
    },

    editorPaste: {
        enumerable: false,
        value: function(editor, data, contentType) {
            /*
                the delegate provide a change for the consumer to handle the paste itself, refuse the paste, accept the
                paste or change the paste data.

                possible return values:

                true: the richtext field will handle the paste itself
                false or null: the paste is canceled
                <string>: the richtext field will insert the string as html
             */
            return true;
        }
    },

    editorFilePaste: {
        enumerable: false,
        value: function(editor, file, data) {
            /*
                the delegate provide a change for the consumer to handle the paste itself, refuse the paste or accept the
                paste.

                possible return values:

                true: the richtext field will handle the paste itself
                false or null: the paste is canceled
                <string>: the richtext field will insert the string as html
             */
            return true;
        }
    }
});
