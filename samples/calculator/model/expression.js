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
var Montage = require("montage").Montage;

var Expression = exports.Expression = Montage.create(Montage, {

    OP_MINUS: {
        writable: false,
        value: "minus"
    },

    OP_PLUS: {
        writable: false,
        value: "plus"
    },

    OP_MULTIPLY: {
        writable: false,
        value: "multiply"
    },

    OP_DIVIDE: {
        writable: false,
        value: "divide"
    },

    TYPE_COMPOUND: {
        writable: false,
        value: "Compound"
    },

    TYPE_NUMBER: {
        writable: false,
        value: "Number"
    },

    _lhs: {
        value: null
    },

    _rhs: {
        value: null
    },

    _operator: {
        value: null
    },

    _comment: {
        value: null
    },

    // Possible types, Number | Compound
    _type: {
        value: "Number"
    },

    lhs: {
        get: function() {
            return this._lhs;
        },
        set: function(lhs) {
            if (this._lhs !== lhs) {
                this._lhs = lhs;
            }
        }
    },

    rhs: {
        get: function() {
            return this._rhs;
        },
        set: function(rhs) {
            if (this._rhs !== rhs) {
                this._rhs = rhs;
            }
        }
    },

    operator: {
        get: function() {
            return this._operator;
        },
        set: function(operator) {
            if (this._operator !== operator) {
                this._operator = operator;
            }
        }
    },

    result: {
        value: function() {
            var result;
            if (this.lhs == null) {
                return "";
            }

            if (this._type === this.TYPE_NUMBER) {
                var numberAsString = "" + this.lhs;
                if (numberAsString.indexOf(".") == -1) {
                    return parseInt(this.lhs, 10);
                } else {
                    return parseFloat(this.lhs);
                }
            } else if (this._type === this.TYPE_COMPOUND) {
                switch(this.operator) {
                    case this.OP_PLUS: {
                        result = this.lhs.result() + this.rhs;
                        break;
                    }
                    case this.OP_MINUS: {
                        result = this.lhs.result() - this.rhs;
                        break;
                    }
                    case this.OP_DIVIDE: {
                        if (this.rhs != 0) {
                            result = this.lhs.result() / this.rhs;
                        } else {
                            result = "Error";
                        }
                        break;
                    }
                    case this.OP_MULTIPLY: {
                        result = this.lhs.result() * this.rhs;
                        break;
                    }
                }
            }
            return result;
        }
    },

    comment: {
        get: function() {
            return this._comment;
        },
        set: function(comment) {
            if (this._comment !== comment) {
                this._comment = comment;
            }
        }
    },

    /**
     * Build expects a numerical value
     */
    build: {
        value: function(value) {
            if (this._type == this.TYPE_NUMBER) {
                var expression = Montage.create(Expression);
                expression.lhs = value;
                this.lhs = expression;
            } else if (this._type == this.TYPE_COMPOUND) {
                this.rhs = value;
            }
        }
    },

    /**
     * addOperator expects a value of plus, minus, multiple, or divide
     */
    addOperator: {
        value: function(operator) {
            if (this._type == this.TYPE_NUMBER) {
                this.operator = operator;
                this._type = this.TYPE_COMPOUND;
            } else if (this._type == this.TYPE_COMPOUND) {
                if (this.operator == null || this.rhs != null) {
                    this.lhs = this.clone();
                    this.operator = operator;
                    this.rhs = null;
                } else {
                    this.operator = operator;
                }
            }
        }
    },

    clone: {
        value: function() {
            var expression = Montage.create(Expression);
            if (this._type == this.TYPE_NUMBER) {
                expression.lhs = this.lhs;
            } else if (this._type == this.TYPE_COMPOUND) {
                expression._type = this._type;
                expression.lhs = this.lhs.clone();
                expression.rhs = this.rhs;
                expression.operator = this.operator;
            }
            return expression;
        }
    },

    prettyPrint: {
        value: function(operator) {
            var result;
            switch(operator) {
                case this.OP_PLUS: {
                    result = '+';
                    break;
                }
                case this.OP_MINUS: {
                    result = '-';
                    break;
                }
                case this.OP_DIVIDE: {
                    result = '÷';
                    break;
                }
                case this.OP_MULTIPLY: {
                    result = '×';
                    break;
                }
            }
            return result;
        }
    },

    toString: {
        value: function() {
            if (this.lhs != null) {
                if (this._type == this.TYPE_NUMBER) {
                    return this.lhs.toString();
                } else if (this._type == this.TYPE_COMPOUND) {
                    return this.lhs.toString() + " " + this.prettyPrint(this.operator) + " " + ((this.rhs == null) ? '' : this.rhs.toString());
                }
            } else {
                return "";
            }
        }
    },

    // Wrap the display value functions so they can be used through a binding
    displayExpression: {
        get: function() {
            return this.toString();
        }
    },

    displayResult: {
        get: function() {
            return this.result();
        }
    }


});
