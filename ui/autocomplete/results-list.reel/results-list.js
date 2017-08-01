var Component = require("montage/ui/component").Component,
    PressComposer = require("montage/composer/press-composer").PressComposer;

exports.ResultsList = Component.specialize({

    textPropertyPath: {value: null},

    // contentController -> this.repetition.contentController
    contentController: {value: null},

    activeIndexes: {value: null},

    enterDocument: {
        value: function() {
            this.element.addEventListener("mouseup", this);
        }
    },

    handleMouseup: {
        value: function(event) {
            //TODO fix this it use PressComposer events
            var content = this.contentController.content,
                index = content.indexOf(event.target.component.value);

            this.contentController.selection = [content[index]];

        }
    }
});
