// jshint -W015, -W106
exports.am = function (n) {
  if (n === 0 || n == 1) {
    return 'one';
  }
  return 'other';
};
exports.ar = function (n) {
  if (n === 0) {
    return 'zero';
  }
  if (n == 1) {
    return 'one';
  }
  if (n == 2) {
    return 'two';
  }
  if ((n % 100) >= 3 && (n % 100) <= 10 && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 100) >= 11 && (n % 100) <= 99 && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.bg = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.bn = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.br = function (n) {
  if (n === 0) {
    return 'zero';
  }
  if (n == 1) {
    return 'one';
  }
  if (n == 2) {
    return 'two';
  }
  if (n == 3) {
    return 'few';
  }
  if (n == 6) {
    return 'many';
  }
  return 'other';
};
exports.ca = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.cs = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n == 2 || n == 3 || n == 4) {
    return 'few';
  }
  return 'other';
};
exports.cy = function (n) {
  if (n === 0) {
    return 'zero';
  }
  if (n == 1) {
    return 'one';
  }
  if (n == 2) {
    return 'two';
  }
  if (n == 3) {
    return 'few';
  }
  if (n == 6) {
    return 'many';
  }
  return 'other';
};
exports.da = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.de = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.el = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.en = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.es = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.et = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.eu = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.fa = function ( n ) {
  return "other";
};
exports.fi = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.fil = function (n) {
  if (n === 0 || n == 1) {
    return 'one';
  }
  return 'other';
};
exports.fr = function (n) {
  if (n >= 0 && n < 2) {
    return 'one';
  }
  return 'other';
};
exports.ga = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n == 2) {
    return 'two';
  }
  return 'other';
};
exports.gl = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.gsw = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.gu = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.he = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.hi = function (n) {
  if (n === 0 || n == 1) {
    return 'one';
  }
  return 'other';
};
exports.hr = function (n) {
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.hu = function (n) {
  return 'other';
};
exports.id = function (n) {
  return 'other';
};
exports["in"] = function (n) {
  return 'other';
};
exports.is = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.it = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.iw = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.ja = function ( n ) {
  return "other";
};
exports.kn = function ( n ) {
  return "other";
};
exports.ko = function ( n ) {
  return "other";
};
exports.lag = function (n) {
  if (n === 0) {
    return 'zero';
  }
  if (n > 0 && n < 2) {
    return 'one';
  }
  return 'other';
};
exports.ln = function (n) {
  if (n === 0 || n == 1) {
    return 'one';
  }
  return 'other';
};
exports.lt = function (n) {
  if ((n % 10) == 1 && ((n % 100) < 11 || (n % 100) > 19)) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 9 &&
      ((n % 100) < 11 || (n % 100) > 19) && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
};
exports.lv = function (n) {
  if (n === 0) {
    return 'zero';
  }
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  return 'other';
};
exports.mk = function (n) {
  if ((n % 10) == 1 && n != 11) {
    return 'one';
  }
  return 'other';
};
exports.ml = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.mo = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n === 0 || n != 1 && (n % 100) >= 1 &&
      (n % 100) <= 19 && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
};
exports.mr = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.ms = function ( n ) {
  return "other";
};
exports.mt = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n === 0 || ((n % 100) >= 2 && (n % 100) <= 4 && n == Math.floor(n))) {
    return 'few';
  }
  if ((n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.ne = function ( n ) {
    if ( n === 1 ) {
        return "one";
    }
    return "other";
};
exports.nl = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.no = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.or = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.pl = function (n) {
  if (n == 1) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || n != 1 && (n % 10) == 1 ||
      ((n % 10) >= 5 && (n % 10) <= 9 || (n % 100) >= 12 && (n % 100) <= 14) &&
      n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.pt = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.ro = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n === 0 || n != 1 && (n % 100) >= 1 &&
      (n % 100) <= 19 && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
};
exports.ru = function (n) {
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.shi = function (n) {
  if (n >= 0 && n <= 1) {
    return 'one';
  }
  if (n >= 2 && n <= 10 && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
};
exports.sk = function (n) {
  if (n == 1) {
    return 'one';
  }
  if (n == 2 || n == 3 || n == 4) {
    return 'few';
  }
  return 'other';
};
exports.sl = function (n) {
  if ((n % 100) == 1) {
    return 'one';
  }
  if ((n % 100) == 2) {
    return 'two';
  }
  if ((n % 100) == 3 || (n % 100) == 4) {
    return 'few';
  }
  return 'other';
};
exports.sq = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.sr = function (n) {
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.sv = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.sw = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.ta = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.te = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.th = function ( n ) {
  return "other";
};
exports.tl = function (n) {
  if (n === 0 || n == 1) {
    return 'one';
  }
  return 'other';
};
exports.tr = function (n) {
  return 'other';
};
exports.uk = function (n) {
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
};
exports.ur = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};
exports.vi = function ( n ) {
  return "other";
};
exports.zh = function ( n ) {
  return "other";
};
