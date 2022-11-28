'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babelTypes = require('@babel/types');

var _jsExtend = require('js-extend');

var _utils = require('./utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PromiseChain = function () {
  // add, addCatch and addFinally were designed to be called only one time each
  // at most. Call them more at your own risk.
  //
  // addCatch() and addFinally() are not guaranteed to handle return values
  // correctly. FIXME.

  function PromiseChain(inner, dirtyAllowed, respName, errName) {
    _classCallCheck(this, PromiseChain);

    this._inner = inner;
    this._dirtyAllowed = dirtyAllowed;
    this._respName = respName;
    this._errName = errName;

    this._ast = (0, _babelTypes.callExpression)((0, _babelTypes.memberExpression)((0, _babelTypes.identifier)('Promise'), (0, _babelTypes.identifier)('resolve')), []);
  }

  _createClass(PromiseChain, [{
    key: 'add',
    value: function add(block) {
      var _this = this;

      if (!block.length) {
        return;
      }
      var current = this._addLink('then', []);
      block.forEach(function (path) {
        var awaitInfos = [];
        path.traverse(PromisifyPrepVisitor, { awaitInfos: awaitInfos, respName: _this._respName });

        awaitInfos.forEach(function (awaitInfo) {
          current.body.push((0, _babelTypes.returnStatement)(awaitInfo.arg));
          var params = awaitInfo.passID ? [(0, _babelTypes.identifier)(_this._respName)] : [];
          current = _this._addLink('then', params);
        });
        if (path.node) {
          current.body.push(path.node);
        }
      });
    }
  }, {
    key: '_addLink',
    value: function _addLink(type, params, secondParams) {
      this._cleanup();

      var current = { body: [] };
      var handlerBody = (0, _babelTypes.blockStatement)(current.body);
      var handlers = [(0, _babelTypes.arrowFunctionExpression)(params, handlerBody, false)];

      if (secondParams) {
        current.secondBody = [];
        var secondHandlerBody = (0, _babelTypes.blockStatement)(current.secondBody);
        handlers.push((0, _babelTypes.arrowFunctionExpression)(secondParams, secondHandlerBody, false));
      }

      var method = (0, _babelTypes.memberExpression)(this._ast, (0, _babelTypes.identifier)(type));
      this._ast = (0, _babelTypes.callExpression)(method, handlers);

      return current;
    }
  }, {
    key: '_cleanup',
    value: function _cleanup() {
      // if resolving to non-undefined when there is no return is allowed, and
      // the last part of the chain is .then(function () {}), then chop off that
      // part
      var chopOff = this._dirtyAllowed && this._ast.callee.property.name === 'then' && this._ast.arguments.length === 1 && !this._ast.arguments[0].body.body.length;
      if (chopOff) {
        this._ast = this._ast.callee.object;
      }
    }
  }, {
    key: 'addCatch',
    value: function addCatch(block, errID) {
      var current = this._addLink('catch', [errID]);
      var catchChain = this._subChain();
      catchChain.add(block);
      current.body.push((0, _babelTypes.returnStatement)(catchChain.toAST()));
    }
  }, {
    key: '_subChain',
    value: function _subChain() {
      return new PromiseChain(true, true, this._respName, this._errName);
    }
  }, {
    key: 'addFinally',
    value: function addFinally(block) {
      var errID = (0, _babelTypes.identifier)(this._errName);
      var current = this._addLink('then', [], [errID]);

      var finallyChain = this._subChain();

      // disable optimalizations
      finallyChain._inner = false;
      finallyChain._dirtyAllowed = false;
      finallyChain.add(block);
      var secondAST = (0, _babelTypes.cloneDeep)(finallyChain.toAST());
      // smuggle in the throw statement
      secondAST.arguments[0].body.body.push((0, _babelTypes.throwStatement)(errID));
      current.secondBody.push((0, _babelTypes.returnStatement)(secondAST));

      // re-enable optimalizations
      finallyChain._inner = true;
      finallyChain._dirtyAllowed = true;
      var ast = (0, _babelTypes.returnStatement)(finallyChain.toAST());
      current.body.push(ast);
    }
  }, {
    key: 'toAST',
    value: function toAST() {
      this._cleanup();

      var callee = this._ast.callee.object.callee;
      if (this._inner && callee && callee.object.name === 'Promise') {
        // only one handler to the promise - because we're in an inner function
        // there's no reason to wrap the handler in promise code. Convenienly,
        // such a handler is inlineable later on.
        //
        // Summary:
        // ``Promise.resolve().then(function () {...})``
        // becomes
        // ``function () {...}()``
        return (0, _babelTypes.callExpression)(this._ast.arguments[0], []);
      }
      return this._ast;
    }
  }]);

  return PromiseChain;
}();

exports.default = PromiseChain;


var PromisifyPrepVisitor = (0, _jsExtend.extend)({
  AwaitExpression: {
    exit: function exit(path) {
      // exit so awaits are evaluated inside out if there are multiple in
      // the expression
      var info = { arg: path.node.argument };
      if ((0, _babelTypes.isExpressionStatement)(path.parent)) {
        path.remove();
      } else {
        info.passID = true;
        path.replaceWith((0, _babelTypes.identifier)(this.respName));
      }
      this.awaitInfos.push(info);
    }
  }
}, _utils.NoSubFunctionsVisitor);
