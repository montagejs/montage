var AbstractSelect = require("ui/base/abstract-select").AbstractSelect;

exports.Select = AbstractSelect.specialize(/** @lends Select.prototype */{
    hasTemplate: {
        value: false
    },

    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);

            if (firstTime) {
                this.element.addEventListener("change", this, false);
            }
        }
    },

    handleChange: {
        value: function () {
            var organizedContent = this.contentController.organizedContent,
                selectedIndex = this.element.selectedIndex;

            this.value = organizedContent[selectedIndex];
        }
    },

    draw: {
        value: function () {
            var selectedIndex,
                organizedContent = this.contentController.organizedContent;

            if (this._contentIsDirty) {
                this.drawOptions();
                this._contentIsDirty = false;
            }

            // Select the current value.
            selectedIndex = organizedContent.indexOf(this.value);
            if (selectedIndex == -1) {
                selectedIndex = 0;
            }

            if (this.element.selectedIndex !== selectedIndex) {
                this.element.selectedIndex = selectedIndex;
            }
        }
    },

    drawOptions: {
        value: function () {
            var organizedContent = this.contentController.organizedContent,
                option,
                item,
                options = document.createDocumentFragment();

            for (var i = 0, ii = organizedContent.length; i < ii; i++) {
                option = document.createElement('option');
                item = organizedContent[i];

                option.textContent = item && item[this.labelPropertyName];
                options.appendChild(option);
            }

            this.element.innerHTML = "";
            this.element.appendChild(options);
        }
    }
});
