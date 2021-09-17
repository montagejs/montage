if(!Number.isNumber) {
    function isNumber(n){
        return Number(n)=== n;
    }
}

if(!Number.isFiniteNumber) {
    function isNumber(n){
        return Number(n)=== n;
    }
}

/*
    borrowed from https://github.com/behnammodi/polyfill/blob/master/number.polyfill.js
*/

if (!Number.isInteger) {
    Number.isInteger = function (value) {
      return (
        typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value
      );
    };
  }
