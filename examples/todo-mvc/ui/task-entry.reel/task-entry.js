/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.TaskEntry = Montage.create(Component, {

    _task: {
        value: null
    },

    task: {
        get: function() {
            return this._task;
        },
        set: function(value) {

            if (this._task === value) {
                return;
            }

            if (this._task) {
                this._task.removePropertyChangeListener("completed", this, false);
            }

            this._task = value;
            this.needsDraw = true;

            if (this.task) {
                this._task.addPropertyChangeListener("completed", this, false);
            }
        }
    },

    completedCheckbox: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            this.completedCheckbox.identifier = "completedCheckbox";
            this.completedCheckbox.addEventListener("change", this, false);
        }
    },

    handleCompletedCheckboxChange: {
        value: function() {
            this.task.completed = !!this.completedCheckbox.checked;
        }
    },

    handleChange: {
        value: function() {
             this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            if (this.task && this.task.completed) {
                this.completedCheckbox.checked = true;
                this.element.classList.add("completed");
            } else {
                this.completedCheckbox.checked = false;
                this.completedCheckbox.removeAttribute("checked");
                this.element.classList.remove("completed");
            }
        }
    }

});
