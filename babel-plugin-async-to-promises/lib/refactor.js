'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RefactorVisitor = exports.IfRefactorVisitor = undefined;

var _babelTypes = require('@babel/types');

var _jsExtend = require('js-extend');

var _promisechain = require('./promisechain');

var _promisechain2 = _interopRequireDefault(_promisechain);

var _utils = require('./utils');

var _ifrefactor = require('./ifrefactor');

var _looprefactor = require('./looprefactor');

var _looprefactor2 = _interopRequireDefault(_looprefactor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IfRefactorVisitor = exports.IfRefactorVisitor = _ifrefactor.SecondPassIfVisitor;

var RefactorVisitor = exports.RefactorVisitor = (0, _jsExtend.extend)({
  AwaitExpression: function AwaitExpression(path) {
    // ``return await x`` becomes just ``return x``
    if ((0, _babelTypes.isReturnStatement)(path.parent)) {
      path.replaceWith(path.node.argument);
    }
  },
  BinaryExpression: function BinaryExpression(path) {
    // a() + await b
    //
    // ->
    //
    // _temp = a(), _temp + await b
    //
    // to make sure the execution order is correct. This provides a nice trick:
    // if you don't care about evaluation order and have one await-ed item in
    // your binary expression, put it on the left side of the operator.

    if ((0, _utils.containsAwait)(path.get('right')) && !path.node.left.isTemp) {
      var tmp = (0, _babelTypes.identifier)(path.scope.generateUid('temp'));
      tmp.isTemp = true;
      this.addVarDecl(tmp);
      var assignment = (0, _utils.assign)(tmp, path.node.left);
      path.node.left = tmp;
      insertBefore(path, assignment);
    }
  },
  ArrayExpression: function ArrayExpression(path) {
    // [a(), await b()]
    //
    // ->
    //
    // await Promise.all([
    //   function () {return a();}(),
    //   function () {return await b();}()
    // ])
    //
    // (which is optimized away to:)
    //
    // await Promise.all([a(), b()])

    if (path.get('elements').slice(1).some(_utils.containsAwait)) {
      var elements = path.node.elements.map(function (element) {
        return (0, _utils.wrapFunction)((0, _babelTypes.blockStatement)([(0, _babelTypes.returnStatement)(element)]));
      });
      var promiseAll = (0, _babelTypes.memberExpression)((0, _babelTypes.identifier)('Promise'), (0, _babelTypes.identifier)('all'));
      path.replaceWith((0, _babelTypes.awaitExpression)((0, _babelTypes.callExpression)(promiseAll, [(0, _babelTypes.arrayExpression)(elements)])));
    }
  },
  CallExpression: function CallExpression(path) {
    var _this = this;

    // call(a(), await b())
    //
    // ->
    //
    // _temp = [a(), await b()], call(_temp[0], _temp[1])

    if (path.get('arguments').slice(1).some(_utils.containsAwait)) {
      (function () {
        var tmp = (0, _babelTypes.identifier)(path.scope.generateUid('temp'));
        _this.addVarDecl(tmp);
        var assignment = (0, _utils.assign)(tmp, (0, _babelTypes.arrayExpression)(path.node.arguments));
        path.node.arguments = path.node.arguments.map(function (_, i) {
          return (0, _babelTypes.memberExpression)(tmp, (0, _babelTypes.numericLiteral)(i), true);
        });
        insertBefore(path, assignment);
      })();
    }
  },
  ObjectExpression: function ObjectExpression(path) {
    var _this2 = this;

    // {a: a(), b: await b()}
    //
    // ->
    //
    // _temp = {}, _temp.a = a(), _temp.b = await b(), _temp

    if (path.get('properties').slice(1).some(_utils.containsAwait)) {
      (function () {
        var tmp = (0, _babelTypes.identifier)(path.scope.generateUid('temp'));
        _this2.addVarDecl(tmp);
        var assignments = [(0, _utils.assign)(tmp, (0, _babelTypes.objectExpression)([]))];
        path.node.properties.forEach(function (property) {
          var member = (0, _babelTypes.memberExpression)(tmp, property.key);
          assignments.push((0, _utils.assign)(member, property.value));
        });
        path.replaceWith(tmp);
        insertBefore(path, assignments);
      })();
    }
  },

  TryStatement: {
    exit: function exit(path) {
      // changes a try/catch that contains an await in a promise chain that uses
      // .catch()
      //
      // uses exit() to make sure nested try/catch-es are converted correctly
      // too.

      if ((0, _utils.containsAwait)(path)) {
        var subChain = new _promisechain2.default(true, true, this.respID, this.errID);
        subChain.add(path.get('block.body'));
        if (path.node.handler) {
          subChain.addCatch(path.get('handler.body.body'), path.node.handler.param);
        }
        if (path.node.finalizer) {
          subChain.addFinally(path.get('finalizer.body'));
        }
        path.replaceWith((0, _utils.awaitStatement)(subChain.toAST()));
      }
    }
  },
  ConditionalExpression: function ConditionalExpression(path) {
    var node = path.node;

    var leftHasAwait = (0, _utils.containsAwait)(path.get('consequent'));
    var rightHasAwait = (0, _utils.containsAwait)(path.get('alternate'));
    if (leftHasAwait) {
      node.consequent = wrapAwaitContaining(node.consequent);
    }
    if (rightHasAwait) {
      node.alternate = wrapAwaitContaining(node.alternate);
    }
    if (leftHasAwait || rightHasAwait) {
      path.replaceWith((0, _babelTypes.awaitExpression)(path.node));
    }
  },
  LogicalExpression: function LogicalExpression(path) {
    // a && (await b) becomes:
    // await a && async function () {
    //   return await b();
    // }()
    if ((0, _utils.containsAwait)(path.get('right'))) {
      path.node.right = wrapAwaitContaining(path.node.right);
      path.replaceWith((0, _babelTypes.awaitExpression)(path.node));
    }
  },
  SequenceExpression: function SequenceExpression(path) {
    // a, await b, await c becomes:
    // await async function() {
    //   a;
    //   await b;
    //   return await c;
    // }

    if ((0, _utils.containsAwait)(path)) {
      // don't include the last item yet
      var exprs = path.node.expressions;
      var body = exprs.slice(0, exprs.length - 1).map(function (expr) {
        return (0, _babelTypes.expressionStatement)(expr);
      });
      // because that one gets a return statement
      body.push((0, _babelTypes.returnStatement)(exprs[exprs.length - 1]));
      path.replaceWith((0, _babelTypes.awaitExpression)((0, _utils.wrapFunction)((0, _babelTypes.blockStatement)(body))));
    }
  },
  Identifier: function Identifier(path) {
    if (path.node.name === 'arguments' && !path.scope.hasOwnBinding('arguments')) {
      path.replaceWith(this.argumentsID);
      this.used.argumentsID = true;
    }
  },
  SwitchStatement: function SwitchStatement(path) {
    // converts a switch statement in a bunch of if statements that compare the
    // discriminant to each test. Falling through is handled by a 'match'
    // variable, and the break statement is handled by a variable 'brokenOut'.
    // Cases after the default case are repeated so the default case can fall
    // through (but in such a way that they won't match again if the default
    // isn't falling through)

    var discrID = (0, _babelTypes.identifier)(path.scope.generateUid('discriminant'));
    var matchID = (0, _babelTypes.identifier)(path.scope.generateUid('match'));
    var brokenID = (0, _babelTypes.identifier)(path.scope.generateUid('brokenOut'));
    this.addVarDecl(discrID);
    this.addVarDecl(matchID);
    this.addVarDecl(brokenID);

    // replace break statements with assignment expressions
    path.traverse(SwitchBreakReplacementVisitor, { brokenID: brokenID });

    var stmts = [];
    var notBroken = (0, _babelTypes.unaryExpression)('!', brokenID);
    var defaultIdx = void 0;
    path.node.cases.forEach(function (caseNode, i) {
      // add normal checks
      if (!caseNode.test) {
        defaultIdx = i;
        return;
      }

      // Seems like a weird order? Maybe, but it does prevent the
      // BinaryExpression refactorer to make too much of a mess for the sake of
      // strict execution order correctness.
      var isOwnMatch = (0, _babelTypes.binaryExpression)('===', caseNode.test, discrID);
      var isMatch = (0, _babelTypes.logicalExpression)('||', matchID, isOwnMatch);
      var test = (0, _babelTypes.logicalExpression)('&&', notBroken, isMatch);
      stmts.push((0, _babelTypes.ifStatement)(test, (0, _babelTypes.blockStatement)(caseNode.consequent.concat([(0, _utils.assign)(matchID, (0, _babelTypes.booleanLiteral)(true))]))));
    });

    if (typeof defaultIdx !== 'undefined') {
      (function () {
        // add default case
        var notMatch = (0, _babelTypes.unaryExpression)('!', matchID);
        var defaultTest = (0, _babelTypes.logicalExpression)('&&', notBroken, notMatch);
        var body = path.node.cases[defaultIdx].consequent;
        path.node.cases.slice(defaultIdx + 1).forEach(function (caseNode) {
          // add fall through cases after default - still guarded by the default
          // check
          body.push((0, _babelTypes.ifStatement)(notBroken, (0, _babelTypes.blockStatement)(caseNode.consequent)));
        });
        stmts.push((0, _babelTypes.ifStatement)(defaultTest, (0, _babelTypes.blockStatement)(body)));
      })();
    }

    path.replaceWithMultiple([(0, _utils.assign)(discrID, path.node.discriminant), (0, _utils.assign)(matchID, (0, _babelTypes.booleanLiteral)(false)), (0, _utils.assign)(brokenID, (0, _babelTypes.booleanLiteral)(false))].concat(stmts));
  },
  FunctionDeclaration: function FunctionDeclaration(path) {
    this.addFunctionDecl(path.node);
    path.remove();
  },
  FunctionExpression: function FunctionExpression(path) {
    if (path.node.id && path.parent.type !== 'ObjectProperty') {
      path.node.type = 'FunctionDeclaration';
      this.addFunctionDecl(path.node);
      path.replaceWith(path.node.id);
    }
  }
}, _ifrefactor.FirstPassIfVisitor, _looprefactor2.default,
  // TODO: don't touch sub switch statements. Enabling the following should be a
  // start.
  //SwitchStatement(path) {
  //  path.skip();
  //}
  _utils.NoSubFunctionsVisitor);

function insertBefore(path, node) {
  // prevent unnecessary sequence expressions. In normal JS they might be
  // elegant and thus nice for Babel, but their async wrapper is ugly.
  if ((0, _babelTypes.isExpressionStatement)(path.parent) || (0, _babelTypes.isReturnStatement)(path.parent)) {
    path.parentPath.insertBefore(node);
  } else {
    path.insertBefore(node);
  }
}

var SwitchBreakReplacementVisitor = (0, _jsExtend.extend)({
  BreakStatement: function BreakStatement(path) {
    // TODO: don't execute any code after the break assignment
    path.replaceWith((0, _utils.assign)(this.brokenID, (0, _babelTypes.booleanLiteral)(true)));
  }
}, _utils.NoSubFunctionsVisitor);

var wrapAwaitContaining = function wrapAwaitContaining(node) {
  return (0, _utils.wrapFunction)((0, _babelTypes.blockStatement)([(0, _babelTypes.returnStatement)(node)]));
};
