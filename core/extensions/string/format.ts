String.prototype.format = function () {
  var i, result = this, isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

    Formatter = (function () {
      var Constr = function (identifier) {
        var array = function (len) { return new Array(len); };

        switch (true) {
          case /^#\{(\w+)\}*$/.test(identifier):
            this.formatter = function (line, param) {
              var re = new RegExp('#{' + RegExp.$1 + '}', 'g');
              return line.replace(re, param[RegExp.$1]);
            };
            break;
          case /^([ds])$/.test(identifier):
            this.formatter = function (line, param) {
              if (RegExp.$1 === 'd') {
                if (isNumber(param)) {
                  param = Math.round(param);
                } else {
                  throw new TypeError();
                }
              }
              return [
                line.substring(0, line.indexOf('%' + identifier)),
                param,
                line.substring(line.indexOf('%' + identifier) + identifier.length + 1)
              ].join('');
            };
            break;

          // Octet
          case /^(o)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              return line.replace(
                "%" + identifier,
                parseInt(param).toString(8));
            };
            break;

          // Binary
          case /^(b)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              return line.replace(
                "%" + identifier,
                parseInt(param).toString(2));
            };
            break;

          // Hex
          case /^([xX])$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              var hex = parseInt(param).toString(16);
              if (identifier === 'X') { hex = hex.toUpperCase(); }
              return line.replace("%" + identifier, hex);
            };
            break;

          case /^(c)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              return line.replace("%" + identifier, String.fromCharCode(param));
            };
            break;

          case /^(u)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              return line.replace("%" + identifier, parseInt(param, 10) >>> 0);
            };
            break;

          case /^(-?)(\d*).?(\d?)(e)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              var lpad = RegExp.$1 === '-',
                width = RegExp.$2,
                decimal = RegExp.$3 !== '' ? RegExp.$3 : undefined,
                val = param.toExponential(decimal),
                mantissa, exponent, padLength
                ;

              if (width !== '') {
                if (decimal !== undefined) {
                  padLength = width - val.length;
                  if (padLength >= 0) {
                    val = lpad ?
                      val + array(padLength + 1).join(" ") :
                      array(padLength + 1).join(" ") + val;
                  }
                  else {
                    // TODO throw ?
                  }
                }
                else {
                  mantissa = val.split('e')[0];
                  exponent = 'e' + val.split('e')[1];
                  padLength = width - (mantissa.length + exponent.length);
                  val = padLength >= 0 ?
                    mantissa + (array(padLength + 1)).join("0") + exponent :
                    mantissa.slice(0, padLength) + exponent;
                }
              }
              return line.replace("%" + identifier, val);
            };
            break;

          case /^(-?)(\d*).?(\d?)(f)$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }
              var lpad = RegExp.$1 === '-',
                width = RegExp.$2,
                decimal = RegExp.$3,
                DOT_LENGTH = '.'.length,
                integralPart = param > 0 ? Math.floor(param) : Math.ceil(param),
                val = parseFloat(param).toFixed(decimal !== '' ? decimal : 6),
                numberPartWidth, spaceWidth;

              if (width !== '') {
                if (decimal !== '') {
                  numberPartWidth =
                    integralPart.toString().length + DOT_LENGTH + parseInt(decimal, 10);
                  spaceWidth = width - numberPartWidth;
                  val = lpad ?
                    parseFloat(param).toFixed(decimal) + (array(spaceWidth + 1).join(" ")) :
                    (array(spaceWidth + 1).join(" ")) + parseFloat(param).toFixed(decimal);
                }
                else {
                  val = parseFloat(param).toFixed(
                    width - (integralPart.toString().length + DOT_LENGTH));
                }
              }
              return line.replace("%" + identifier, val);
            };
            break;

          // Decimal
          case /^([0\-]?)(\d+)d$/.test(identifier):
            this.formatter = function (line, param) {
              if (!isNumber(param)) { throw new TypeError(); }

              var len = RegExp.$2 - param.toString().length,
                replaceString = '',
                result;
              if (len < 0) { len = 0; }
              switch (RegExp.$1) {
                case "": // rpad
                  replaceString = (array(len + 1).join(" ") + param).slice(-RegExp.$2);
                  break;
                case "-": // lpad
                  replaceString = (param + array(len + 1).join(" ")).slice(-RegExp.$2);
                  break;
                case "0": // 0pad
                  replaceString = (array(len + 1).join("0") + param).slice(-RegExp.$2);
                  break;
              }
              return line.replace("%" + identifier, replaceString);
            };
            break;

          // String
          case /^(-?)(\d+)s$/.test(identifier):
            this.formatter = function (line, param) {
              var len = RegExp.$2 - param.toString().length,
                replaceString = '',
                result;
              if (len < 0) { len = 0; }
              switch (RegExp.$1) {
                case "": // rpad
                  replaceString = (array(len + 1).join(" ") + param).slice(-RegExp.$2);
                  break;
                case "-": // lpad
                  replaceString = (param + array(len + 1).join(" ")).slice(-RegExp.$2);
                  break;
                default:
                // TODO throw ?
              }
              return [
                line.substring(0, line.indexOf('%' + identifier)),
                replaceString,
                line.substring(line.indexOf('%' + identifier) + identifier.length + 1)
              ].join('');
            };
            break;

          // String with max length
          case /^(-?\d*)\.(\d+)s$/.test(identifier):
            this.formatter = function (line, param) {
              var replaceString = '',
                max, spacelen;

              // %.4s
              if (RegExp.$1 === '') {
                replaceString = param.slice(0, RegExp.$2);
              }
              // %5.4s %-5.4s
              else {
                param = param.slice(0, RegExp.$2);
                max = Math.abs(RegExp.$1);
                spacelen = max - param.toString().length;
                replaceString = RegExp.$1.indexOf('-') !== -1 ?
                  (param + array(spacelen + 1).join(" ")).slice(-max) : // lpad
                  (array(spacelen + 1).join(" ") + param).slice(-max); // rpad
              }
              return [
                line.substring(0, line.indexOf('%' + identifier)),
                replaceString,
                line.substring(line.indexOf('%' + identifier) + identifier.length + 1)
              ].join('');
            };
            break;
          default:
            this.formatter = function (line, param) {
              return line;
            };
        }
      };

      Constr.prototype = {
        format: function (line, param) {
          return this.formatter.call(this, line, param);
        }
      };
      return Constr;
    }());


  // args = Array.prototype.slice.call(arguments);

  if (arguments.length === 1 && typeof arguments[0] === 'object') {
    if (arguments[0] instanceof Array) {
      for (i = 0; i < arguments[0].length; i += 1) {
        if (result.match(/%([.#0-9\-]*[bcdefosuxX])/)) {
          result = new Formatter(RegExp.$1).format(result, arguments[0][i]);
        }
      }
    } else {
      for (i = 0; i < Object.keys(arguments[0]).length; i += 1) {
        if (result.match(/(#\{\w+\})/)) {
          result = new Formatter(RegExp.$1).format(result, arguments[0]);
        }
      }
    }

  }
  else {
    for (i = 0; i < arguments.length; i += 1) {
      if (result.match(/%([.#0-9\-]*[bcdefosuxX])/)) {
        result = new Formatter(RegExp.$1).format(result, arguments[i]);
      }
    }
  }



  return result;
};
/**
 *对Date的扩展，将 Date 转化为指定格式的String
 *月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 *年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 *例子：
 *(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 *(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 */
Date.prototype.format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

