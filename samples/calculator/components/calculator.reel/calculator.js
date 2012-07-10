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
    Component = require("montage/ui/component").Component,
    Expression = require("model/expression").Expression;

exports.Calculator = Montage.create(Component, {

    _currentNumberStack: {
        enumerable: false,
        value: [],
        distinct: true
    },
    _currentNumberString: {
        value: "0",
        enumerable: false
    },
    _storedMemoryValue: {
        enumerable: false,
        value: 0
    },
    memoryHasValue: {
        value: false
    },
    _previousResultNumber: {
        enumerable: false,
        value: [],
        distinct: true
    },
    _previousOperator: {
        enumerable: false,
        value: "plus"
    },
    _clearAll: {
        value: false,
        enumerable: false
    },
    expression: {
        enumerable: false,
        value: null
    },
    MAX_DISPLAY_LENGTH: {
        value: 10,
        writable: false
    },
    DECIMAL_EXPONENT_LENGTH: {
        value: 5,
        writable: false
    },
    MAX_EXPRESSION_DISPLAY_LENGTH: {
        value: 37,
        writable: false
    },

    // ELEMENT HANDLES
    currentNumberElement: { // Large number in LED
        value: null,
        serializable: true
    },
    currentResultElement: { // Result of expression in small LED
        value: null,
        serializable: true
    },
    LEDElement: { // Expression in LED
        value: null,
        serializable: true
    },

    // Calculator Methods
    draw: {
        value: function(timestamp) {
            var expressionResult = "";
            this.currentNumberElement.innerHTML = this.formatNumberString(this._currentNumberString);
            if (this.expression === null) {
                this.currentResultElement.innerHTML = '';
                this.LEDElement.innerHTML = 0;
            } else {
                if (this.expression.rhs !== null) {
                    expressionResult = "&nbsp;=&nbsp;" + this.expression.result();
                }
                this.currentResultElement.innerHTML = expressionResult;
                this.LEDElement.innerHTML = this.formatExpressionString(this.expression.toString(), ("" + expressionResult).replace(/&nbsp;/g, ' '));
            }
        }
    },

    formatExpressionString: {
        value: function(expressionString, expressionResultString) {
            var trimmedString = expressionString, expressionLength = expressionString.length, resultLength = expressionResultString.length;
            if ((expressionLength + resultLength) > this.MAX_EXPRESSION_DISPLAY_LENGTH) {
                trimmedString = expressionString.slice((expressionLength + resultLength) - this.MAX_EXPRESSION_DISPLAY_LENGTH, expressionLength);
                trimmedString = "..." + trimmedString;
            }
            return trimmedString;
        }
    },

    formatNumberString: {
        value: function(numberString) {
            var returnValue = numberString, numberValue;
            if (numberString.length > this.MAX_DISPLAY_LENGTH) {
                numberValue = parseFloat(numberString);
                returnValue = numberValue.toExponential(this.DECIMAL_EXPONENT_LENGTH);
            }
            return returnValue;
        }
    },

    buildExpression: {
        value: function() {
            if (this.expression == null) {
                this.expression = Montage.create(Expression);
            }
            var aNumberString = this._currentNumberStack.join('');
            if (aNumberString.indexOf(".") != -1) {
                this.expression.build(parseFloat(aNumberString));
            } else {
                this.expression.build(parseInt(aNumberString, 10));
            }
        }
    },

    /* Function to add number to the currentNumberStack (0-9) */
    updateNumber: {
        value: function(val) {
            this._clearAll = false;
            if (!Array.isArray(val)) {
                this._currentNumberStack.push(val);
            } else {
                this._currentNumberStack = this._currentNumberStack.concat(val);
            }
            this._currentNumberString = this._currentNumberStack.join('');
            this.buildExpression();
            this.needsDraw = true;
        }
    },

    /* Function for operators validation */
    addOperatorToExpression: {
        value: function(operatorValue) {
            if (this.expression == null) {
                this.expression = Montage.create(Expression);
                this.expression.build(0);
            }
            this.expression.addOperator(operatorValue);
            this._previousOperator = operatorValue;
            if (this._currentNumberStack.length > 0) {
                this._previousResultNumber = this._currentNumberStack.slice(0);
            }
            this._currentNumberStack = [];
            this.needsDraw = true;
        }
    },

    /* Function for decimal validation */
    addDecimal: {
        value: function() {
            if (this._currentNumberStack.join('').indexOf(".") == -1) {
                if (this._currentNumberStack.length == 0) {
                    this.updateNumber(["0", "."]);
                } else {
                    this.updateNumber(".");
                }
            }
        }
    },

    /* Send result event and reset the calculator */
    result: {
        value: function() {
            var aResult;
            if (this.expression) {
                if (this.expression.operator != null && this.expression.rhs == null) {
                    this._restorePreviousResultToCurrentNumber();
                    this.buildExpression();
                } else if (this.expression.operator == null && this.expression.rhs == null) {
                    this.expression.addOperator(this._previousOperator);
                    this._restorePreviousResultToCurrentNumber();
                    this.buildExpression();
                }
            } else {
                this.expression = Montage.create(Expression);
                this._currentNumberStack = ["0"];
                this.buildExpression();
                this.expression.addOperator(this._previousOperator);
                this._restorePreviousResultToCurrentNumber();
                this.buildExpression();
            }
            this.dispatchResultEvent(this.expression);
            aResult = this.expression.result();
            this.resetCalculator();
            if (aResult != 0 && aResult != "Error") {
                this.updateNumber(Array.prototype.slice.call("" + aResult, ""));
            } else {
                this._currentNumberString = aResult;
            }
            this._clearAll = true;
            this.needsDraw = true;
        }
    },

    _restorePreviousResultToCurrentNumber: {
        value: function() {
            if (this._previousResultNumber.length > 0) {
                this._currentNumberStack = this._previousResultNumber.slice(0);
            } else {
                this._currentNumberStack = ["0"];
            }
        }
    },

    dispatchResultEvent: {
        value: function(expression) {
            var result = {expression: expression},
            anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("calcResult", true, false, result);
            this.dispatchEvent(anEvent);
        }
    },

    resetCalculator: {
        value: function() {
            this.expression = null;
            this._previousResultNumber = this._currentNumberStack.slice(0);
            this._currentNumberStack = [];
            this._currentNumberString = "0";
            this.needsDraw = true;
        }
    },

    /* Function to delete data from LED */
    backspace: {
        value: function() {
            if (this._currentNumberStack.length > 0) {
                this._currentNumberStack.pop();
            }
            if ((this._currentNumberStack.length > 0) && !(this._currentNumberStack.length == 1 && this._currentNumberStack[0] == "-")) {
                this.buildExpression();
                this._currentNumberString = this._currentNumberStack.join('');
            } else {
                this._previousResultNumber = this._currentNumberStack.slice(0);
                this._currentNumberStack = [];
                this._currentNumberString = "0";
                this.expression = null;
            }
            this.needsDraw = true;
        }
    },

    /* Function to recall memory value */
    memoryRecall: {
        value: function() {
            this.resetCalculator();
            if (this._storedMemoryValue != 0) {
                this.updateNumber(Array.prototype.slice.call("" + this._storedMemoryValue, ""));
            }
        }
    },

    memoryCalculation: {
        value: function(operator) {
            var currentNumber = parseFloat(this._currentNumberStack.join('')),
                aMemoryValue = this._storedMemoryValue;
            if (isNaN(currentNumber)) {
                currentNumber = 0;
            }
            if (operator === Expression.OP_MINUS) { // Flip the sign
                currentNumber = currentNumber * (-1);
            }
            this._storedMemoryValue = aMemoryValue + currentNumber;
            this._previousResultNumber = this._currentNumberStack.slice(0);
            this._currentNumberStack = [];
            this.memoryHasValue = true;
        }
    },

    /* Function to clear memory */
    memoryClear: {
        value: function() {
            this._storedMemoryValue = 0;
            this.memoryHasValue = false;
        }
    },

    handleMemoryClearRecallHold: {
        value: function(event) {
            this.memoryClear();
        }
    },

    handleClearHold: {
        value: function(event) {
            this.resetCalculator();
        }
    },

    handleClearAction: {
        value: function(event) {
            if (!this._clearAll) {
                this.backspace();
            } else if (this._clearAll) {
                this.resetCalculator();
                this._clearAll = false;
            }
        }
    },

    handleEqualAction: {
        value: function(event) {
            this.result();
        }
    },

    handleDecimalAction: {
        value: function(event) {
            this.addDecimal();
        }
    },

    handlePlusAction: {
        value: function(event) {
            this.addOperatorToExpression(Expression.OP_PLUS);
        }
    },

    handleMinusAction: {
        value: function(event) {
            this.addOperatorToExpression(Expression.OP_MINUS);
        }
    },

    handleMultiplyAction: {
        value: function(event) {
            this.addOperatorToExpression(Expression.OP_MULTIPLY);
        }
    },

    handleDivideAction: {
        value: function(event) {
            this.addOperatorToExpression(Expression.OP_DIVIDE);
        }
    },

    handleMemoryClearRecallAction: {
        value: function(event) {
            this.memoryRecall();
        }
    },

    handleMemoryAddAction: {
        value: function(event) {
            this.memoryCalculation(Expression.OP_PLUS);
        }
    },

    handleMemoryMinusAction: {
        value: function(event) {
            this.memoryCalculation(Expression.OP_MINUS);
        }
    },

    handleNineAction: {
        value: function(event) {
            this.updateNumber("9");
        }
    },

    handleEightAction: {
        value: function(event) {
            this.updateNumber("8");
        }
    },

    handleSevenAction: {
        value: function(event) {
            this.updateNumber("7");
        }
    },

    handleSixAction: {
        value: function(event) {
            this.updateNumber("6");
        }
    },

    handleFiveAction: {
        value: function(event) {
            this.updateNumber("5");
        }
    },

    handleFourAction: {
        value: function(event) {
            this.updateNumber("4");
        }
    },

    handleThreeAction: {
        value: function(event) {
            this.updateNumber("3");
        }
    },

    handleTwoAction: {
        value: function(event) {
            this.updateNumber("2");
        }
    },

    handleOneAction: {
        value: function(event) {
            this.updateNumber("1");
        }
    },

    handleZeroAction: {
        value: function(event) {
            this.updateNumber("0");
        }
    }

});
