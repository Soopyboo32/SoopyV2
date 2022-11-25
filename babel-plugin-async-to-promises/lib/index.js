'use strict';

var _babelHelperHoistVariables = require('@babel/helper-hoist-variables');

var _babelHelperHoistVariables2 = _interopRequireDefault(_babelHelperHoistVariables);

var _babelTypes = require('@babel/types');

var _refactor = require('./refactor');

var _promisechain = require('./promisechain');

var _promisechain2 = _interopRequireDefault(_promisechain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  return {
    visitor: WrapperVisitor,
    manipulateOptions: function manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push('asyncFunctions');
    }
  };
};

var depth = 0;
var respID = void 0,
  errID = void 0;

var WrapperVisitor = {
  // Because only ES5 is really supported, force this plugin to run as late as
  // possible. At least the normal (es2015 preset) transforms have happened by
  // then.
  Program: {
    exit: function exit(path) {
      respID = path.scope.generateUid('resp');
      errID = path.scope.generateUid('err');
      path.traverse(MainVisitor);
      // inline functions
      path.traverse(InliningVisitor);
    }
  }
};

var MainVisitor = {
  Function: {
    enter: function enter(path) {
      depth++;
      var node = path.node;

      if (node.async) {
        (function () {
          var decls = [];
          var addVarDecl = function addVarDecl(id) {
            return decls.push((0, _babelTypes.variableDeclarator)(id));
          };
          // hoist variables
          (0, _babelHelperHoistVariables2.default)(path, addVarDecl);

          // info gathering for this/arguments during the refactoring
          var argumentsID = (0, _babelTypes.identifier)(path.scope.generateUid('arguments'));
          var used = { argumentsID: false };

          var newBody = [];
          var addFunctionDecl = function addFunctionDecl(func) {
            return newBody.push(func);
          };

          // refactor code
          var args = { argumentsID: argumentsID, used: used, addVarDecl: addVarDecl, addFunctionDecl: addFunctionDecl, respID: respID, errID: errID };
          path.traverse(_refactor.RefactorVisitor, args);
          // add this/arguments vars if necessary
          if (used.argumentsID) {
            decls.push((0, _babelTypes.variableDeclarator)(argumentsID, (0, _babelTypes.identifier)('arguments')));
          }
          if (decls.length) {
            newBody.push((0, _babelTypes.variableDeclaration)('var', decls));
          }

          // transformations that can only be done after all others.
          path.traverse(_refactor.IfRefactorVisitor);

          // build the promise chain
          var chain = new _promisechain2.default(depth > 1, node.dirtyAllowed, respID, errID);
          chain.add(path.get('body.body'));
          newBody.push((0, _babelTypes.returnStatement)(chain.toAST()));

          // combine all the newly generated stuff.
          node.body = (0, _babelTypes.blockStatement)(newBody);
          node.async = false;
        })();
      }
    },
    exit: function exit() {
      depth--;
    }
  }
};

var InliningVisitor = {
  BlockStatement: function BlockStatement(path) {
    // inline blocks. Included because babel-template otherwise creates empty
    // blocks.
    if ((0, _babelTypes.isBlockStatement)(path.parent)) {
      path.replaceWithMultiple(path.node.body);
    }
  },
  ReturnStatement: function ReturnStatement(path) {
    // return function () { ...body... }() becomes: ...body...
    var call = path.node.argument;
    var inlineable = (0, _babelTypes.isCallExpression)(call) && !call.arguments.length && (0, _babelTypes.isFunctionExpression)(call.callee) && !call.callee.id && !call.callee.params.length && (0, _babelTypes.isBlockStatement)(call.callee.body) && !Object.keys(path.get('argument.callee').scope.bindings).length;
    if (inlineable) {
      path.replaceWithMultiple(call.callee.body.body);
    }
  },
  CallExpression: function CallExpression(path) {
    // function () { return x; }() becomes x
    var inlineable = !path.node.arguments.length && (0, _babelTypes.isFunctionExpression)(path.node.callee) && !path.node.callee.id && !path.node.callee.params.length && (0, _babelTypes.isBlockStatement)(path.node.callee.body) && path.node.callee.body.body.length === 1 && (0, _babelTypes.isReturnStatement)(path.node.callee.body.body[0]) && path.node.callee.body.body[0].argument;
    if (inlineable) {
      path.replaceWith(path.node.callee.body.body[0].argument);
    }
  }
};
