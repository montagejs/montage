/*jshint node:true */
var http = require("http"),
    Q = require("q");

var strip = function strip(str) {
	var x = [];
	for(var i = 0; i<str.length; i++) {
		if (str.charCodeAt(i)) {
			x.push(str.charAt(i));
		}
	}
	return x.join('');
};


var deferredWithData = function(deferred, objKey){
  return function(res) {
    res.setEncoding('utf8');

    var data = "", obj;
    res.on('data', function(chunk) { data += chunk.toString(); });
    res.on('end', function() {
      try{
        obj = JSON.parse(strip(data));
      } catch (e) {
        return deferred.reject('Not a JSON response' + data);
      }
      deferred.resolve(objKey ? obj[objKey] : obj);
    });
  };
};



var webdriver = function(host, port, username, accessKey) {
  this.sessionID = null;
  this.options = {
    host: host || '127.0.0.1',
    port: port || 4444,
    path: '/wd/hub/session',
    method: 'POST'
  };
  this.desiredCapabilities = {
    browserName: "firefox",
    version: "",
    javascriptEnabled: true,
    platform: "ANY"
  };

  if (username && accessKey) {
    var authString = username+":"+accessKey;
    var buf = new Buffer(authString);
    this.options['headers'] = {
      'Authorization': 'Basic '+ buf.toString('base64')
    };
    this.desiredCapabilities.platform = "VISTA";
  }

  this.getOpts = function(over) {
    var opt = {};
    for (var o in this.options) {
      opt[o] = this.options[o];
    }
    opt['path'] += '/'+this.sessionID;
    if (over.url) {
      opt['path'] += over.url;
    }
    if (over.method) {
      opt['method'] = over.method;
    }
    return opt;
  };
};

webdriver.prototype.init = function(desired) {
    var deferred = Q.defer();
    var _this = this;

    for (var cap in desired) {
        if (desired.hasOwnProperty(cap)) {
            this.desiredCapabilities[cap] = desired[cap];
        }
    }

    var req = http.request(_this.options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            if (res.headers.location == undefined) {
                console.log("\x1b[31mError\x1b[0m: The environment you requested was unavailable.\n");
                console.log("\x1b[33mReason\x1b[0m:\n");
                console.log(data);
                console.log("\nFor the available values please consult the WebDriver JSONWireProtocol,");
                console.log("located at: \x1b[33mhttp://code.google.com/p/selenium/wiki/JsonWireProtocol#/session\x1b[0m");
                return;
            }
            var locationArr = res.headers.location.split("/");
            _this.sessionID = locationArr[locationArr.length - 1];
            deferred.resolve(null, _this.sessionID);
        });
    });
    req.write(JSON.stringify({
        desiredCapabilities: _this.desiredCapabilities
    }));
    req.end();
    return deferred.promise;
};

webdriver.prototype.close = function() {
  var deferred = Q.defer();
  var _this = this;
  var req = http.request(
    _this.getOpts(
      {url:'/window', method:'DELETE'}
    ), function(res) {
      deferred.resolve();
    });

  req.write("");
  req.end();
  return deferred.promise;
};

webdriver.prototype.quit = function() {
  var deferred = Q.defer();
  var _this = this;
  var req = http.request(
    _this.getOpts(
      {method:'DELETE'}
    ), function(res) {
      deferred.resolve();
    });

  req.write("");
  req.end();
  return deferred.promise;
};

webdriver.prototype.eval = function(code) {
  var deferred = Q.defer();
  var _this = this;

  var req = http.request(
    _this.getOpts({url:'/execute'}),
    deferredWithData(deferred, 'value')
  );

  req.write(JSON.stringify({script:"return "+code, args:[]}));
  req.end();
  return deferred.promise;
};

webdriver.prototype.execute = function(code) {
  var deferred = Q.defer();
  var _this = this;

  var req = http.request(
    _this.getOpts({url:'/execute'}),
    deferredWithData(deferred, 'value')
  );

  req.write(JSON.stringify({script:code, args:[]}));
  req.end();
  return deferred.promise;
};

webdriver.prototype.executeAsync = function(code) {
  var deferred = Q.defer();
  var _this = this;

  var req = http.request(
    _this.getOpts({url:'/execute_async'}),
    deferredWithData(deferred, 'value')
  );

  req.write(JSON.stringify({script:code, args:[]}));
  req.end();
  return deferred.promise;
};

webdriver.prototype.get = function(url) {
  var deferred = Q.defer();
  var _this = this;

  var req = http.request(
    _this.getOpts({url:'/url'}), function(res) {
      deferred.resolve();
  });

  req.write(JSON.stringify({"url":url}));
  req.end();
  return deferred.promise;
};

webdriver.prototype.setWaitTimeout = function(ms) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
    _this.getOpts({url:'/timeouts/implicit_wait'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({ms: ms}));
    req.end();
    return deferred.promise;
};


webdriver.prototype.element = function(using, value) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/element'}), function(res) {
        res.setEncoding('utf8');

        var data = "";
        res.on('data', function(chunk) { data += chunk.toString(); });
        res.on('end', function() {
            var obj = JSON.parse(strip(data));
            if (!obj.value.ELEMENT) {
                deferred.reject(data);
            } else {
              deferred.resolve(obj.value.ELEMENT);
            }
        });
    });

    req.write(JSON.stringify({
        using : using,
        value : value
    }));
    req.end();
    return deferred.promise;
};


webdriver.prototype.moveTo = function(element, xoffset, yoffset) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/moveto'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({
        element : element,
        xoffset : xoffset,
        yoffset : yoffset
    }));
    req.end();
    return deferred.promise;
};

//@todo simulate the scroll event using dispatchEvent and browser.execute
webdriver.prototype.scroll = function(element, xoffset, yoffset) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/moveto'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({
        element : element,
        xoffset : xoffset,
        yoffset : yoffset
    }));
    req.end();
    return deferred.promise;
};

webdriver.prototype.buttonDown = function(cb) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
    _this.getOpts({url:'/buttondown'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({}));
    req.end();
    return deferred.promise;
};


webdriver.prototype.buttonUp = function(cb) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/buttonup'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({}));
    req.end();
    return deferred.promise;
};

//{LEFT = 0, MIDDLE = 1 , RIGHT = 2}
webdriver.prototype.click = function(button) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/click'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({
        button: button
    }));
    req.end();
    return deferred.promise;
};

webdriver.prototype.doubleclick = function(button) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/doubleclick'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({}));
    req.end();
    return deferred.promise;
};

//All keys are up at end of command
webdriver.prototype.type = function(element, keys) {
    var deferred = Q.defer();
    var _this = this;

    if (!keys instanceof Array) {
      keys = [keys];
    }

    var req = http.request(
      _this.getOpts({url:'/element/' + element + '/value'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({
        value : keys
    }));
    req.end();
    return deferred.promise;
};

webdriver.prototype.active = function(cb){
    var deferred = Q.defer();
    var req = http.request(
    this.getOpts({url:'/element/active'}), deferredWithData(function(e, o) {
        cb(null, o['ELEMENT']);
    }, 'value'));

    req.end();
    return deferred.promise;
};

webdriver.prototype.keyToggle = function(element, keys) {
    var deferred = Q.defer();
    var _this = this;

    var req = http.request(
      _this.getOpts({url:'/type'}), function(res) {
        deferred.resolve();
    });

    req.write(JSON.stringify({
        value : keys
    }));
    req.end();
    return deferred.promise;
};


exports.remote = function(host, port, username, accessKey) {
  return new webdriver(host, port, username, accessKey);
};
