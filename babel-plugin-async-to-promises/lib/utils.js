'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assign = exports.awaitStatement = exports.containsAwait = exports.NoSubFunctionsVisitor = undefined;
exports.matcher = matcher;
exports.wrapFunction = wrapFunction;

var _babelTypes = require('babel-types');

var _jsExtend = require('js-extend');

var NoSubFunctionsVisitor = exports.NoSubFunctionsVisitor = {
  Function: function Function(path) {
    path.skip();
  }
};

var containsAwait = exports.containsAwait = matcher(['AwaitExpression'], NoSubFunctionsVisitor);

function matcher(types, base) {
  var MatchVisitor = (0, _jsExtend.extend)({}, base);
  types.forEach(function (type) {
    MatchVisitor[type] = function (path) {
      this.match.found = true;
      path.stop();
    };
  });
  return function (path) {
    if (!path.node) {
      return false;
    }
    if (types.indexOf(path.node.type) !== -1) {
      return true;
    }
    var match = {};
    path.traverse(MatchVisitor, { match: match });
    return match.found;
  };
}

function wrapFunction(body) {
  var func = (0, _babelTypes.functionExpression)(null, [], body, false, true);
  func.dirtyAllowed = true;
  return (0, _babelTypes.callExpression)(func, []);
}

var awaitStatement = exports.awaitStatement = function awaitStatement(arg) {
  return (0, _babelTypes.expressionStatement)((0, _babelTypes.awaitExpression)(arg));
};

var assign = exports.assign = function assign(a, b) {
  return (0, _babelTypes.expressionStatement)((0, _babelTypes.assignmentExpression)('=', a, b));
};