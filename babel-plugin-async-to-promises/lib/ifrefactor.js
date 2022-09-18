'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SecondPassIfVisitor = exports.FirstPassIfVisitor = undefined;

var _babelTypes = require('babel-types');

var _utils = require('./utils');

var _jsExtend = require('js-extend');

var FirstPassIfVisitor = exports.FirstPassIfVisitor = {
  IfStatement: function IfStatement(path) {
    var _this = this;

    var node = path.node;

    (0, _babelTypes.ensureBlock)(node, 'consequent');
    if (node.alternate) {
      (0, _babelTypes.ensureBlock)(node, 'alternate');
    }
    if (node.consequent.body.some(_babelTypes.isIfStatement) && containsReturnOrAwait(path)) {
      (function () {
        // flatten if statements. There are two ways to reach d() in the below.
        // if a() && !b(), and if !a() && !b(). That's problematic during the
        // promise conversion.
        //
        // if (a()) {
        //   if (b()) {
        //     return c();
        //   }
        // }
        // return d();
        //
        // this becomes instead:
        //
        // var _test = a();
        // if (_test && b()) {
        //   return c();
        // }
        // return d();
        //
        // which is better, but not quite the result we want yet. See for that
        // the BlockStatement handler in the other IfRefactorVisitor below.

        var testID = (0, _babelTypes.identifier)(path.scope.generateUid('test'));
        _this.addVarDecl(testID);
        var block = [(0, _utils.assign)(testID, node.test)];

        var stillToAdd = [];
        var clearQueue = function clearQueue() {
          if (stillToAdd.length) {
            block.push((0, _babelTypes.ifStatement)(testID, (0, _babelTypes.blockStatement)(stillToAdd)));
            stillToAdd = [];
          }
        };
        node.consequent.body.forEach(function (stmt) {
          if ((0, _babelTypes.isIfStatement)(stmt)) {
            clearQueue();
            stmt.test = (0, _babelTypes.logicalExpression)('&&', testID, stmt.test);
            if (stmt.alternate) {
              stmt.alternate = (0, _babelTypes.blockStatement)([(0, _babelTypes.ifStatement)(testID, stmt.alternate)]);
            }
            block.push(stmt);
          } else {
            stillToAdd.push(stmt);
          }
        });
        clearQueue();
        extendElse(block[block.length - 1], (node.alternate || {}).body || []);
        path.replaceWithMultiple(block);
      })();
    }
  }
};

var containsReturnOrAwait = (0, _utils.matcher)(['ReturnStatement', 'AwaitExpression'], _utils.NoSubFunctionsVisitor);

var SecondPassIfVisitor = exports.SecondPassIfVisitor = (0, _jsExtend.extend)({
  IfStatement: function IfStatement(path) {
    var alt = path.node.alternate;
    if (!path.node.consequent.body.length && alt && alt.body.length) {
      path.node.consequent = path.node.alternate;
      path.node.alternate = null;
      path.node.test = (0, _babelTypes.unaryExpression)('!', path.node.test);
    }
    var ifContainsAwait = (0, _utils.containsAwait)(path.get('consequent'));
    var elseContainsAwait = (0, _utils.containsAwait)(path.get('alternate'));

    var node = path.node;

    if (ifContainsAwait) {
      node.consequent = wrapIfBranch(node.consequent);
    }
    if (elseContainsAwait) {
      node.alternate = wrapIfBranch(node.alternate);
    }
    if (ifContainsAwait || elseContainsAwait) {
      path.replaceWith((0, _babelTypes.awaitExpression)((0, _utils.wrapFunction)((0, _babelTypes.blockStatement)([node]))));
    }
  },
  BlockStatement: function BlockStatement(path) {
    // Converts
    //
    // var _test = a();
    // if (_test && b()) {
    //   return c();
    // }
    // return d();
    //
    // into:
    //
    // var _test = a();
    // if (_test && b()) {
    //   return c();
    // } else {
    //   return d();
    // }
    //
    // ... which has at every point in time only two choices: returning
    // directly out of the function, or continueing on. That's what's required
    // for a nice conversion to Promise chains.
    for (var i = 0; i < path.node.body.length; i++) {
      var subNode = path.node.body[i];
      if ((0, _babelTypes.isReturnStatement)(subNode)) {
        // remove everything in the block after the return - it's never going
        // to be executed anyway.
        path.node.body.splice(i + 1);
      }
      if (!(0, _babelTypes.isIfStatement)(subNode)) {
        continue;
      }
      var lastStmt = subNode.consequent.body[subNode.consequent.body.length - 1];
      if (!(0, _babelTypes.isReturnStatement)(lastStmt)) {
        continue;
      }
      var remainder = path.node.body.splice(i + 1);
      if (!lastStmt.argument) {
        // chop off the soon to be useless return statement
        subNode.consequent.body.splice(-1);
      }
      extendElse(subNode, remainder);
    }
  }
}, _utils.NoSubFunctionsVisitor);

var wrapIfBranch = function wrapIfBranch(branch) {
  return (0, _babelTypes.blockStatement)([(0, _babelTypes.returnStatement)((0, _utils.wrapFunction)(branch))]);
};

function extendElse(ifStmt, extraBody) {
  var body = ((ifStmt.alternate || {}).body || []).concat(extraBody);
  if (body.length) {
    ifStmt.alternate = (0, _babelTypes.blockStatement)(body);
  }
}