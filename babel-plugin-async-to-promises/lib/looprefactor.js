'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _babelTypes = require('babel-types');

var _babelTemplate = require('babel-template');

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _jsExtend = require('js-extend');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  LabeledStatement: {
    // Babel seems to auto-remove labels from the AST if they don't make sense
    // in a position. That makes it hard to keep track of if you're in a loop
    // with label. So we move the label onto the node itself, and handle it
    // manually (at least, if we're touching the loop, i.e. if it has an await
    // somewhere inside).

    enter: function enter(path) {
      if ((0, _utils.containsAwait)(path)) {
        path.node.body.loopLabel = path.node.label;
      }
    }
  },
  DoWhileStatement: function DoWhileStatement(path) {
    // converts
    //
    // do {
    //   newBody;
    // } while (node.test)
    //
    // into:
    //
    // await async function _recursive() {
    //   newBody;
    //   if (node.test) {
    //     return await _recursive();
    //   }
    // }()

    refactorLoop(path, false, this.addVarDecl, function (functionID) {
      var continueBlock = (0, _babelTypes.blockStatement)([continueStatementEquiv(functionID)]);
      path.node.body.body.push((0, _babelTypes.ifStatement)(path.node.test, continueBlock));
      path.replaceWith(recursiveWrapFunction(functionID, path.node.body));
    });
  },
  WhileStatement: function WhileStatement(path) {
    // converts
    //
    // while (node.test) {
    //   newBody;
    // }
    //
    // into:
    //
    // await async function _recursive() {
    //   if (node.test) {
    //     newBody;
    //     return await _recursive();
    //   }
    // }()

    refactorLoop(path, false, this.addVarDecl, function (functionID) {
      path.node.body.body.push(continueStatementEquiv(functionID));
      var body = (0, _babelTypes.blockStatement)([(0, _babelTypes.ifStatement)(path.node.test, path.node.body)]);

      path.replaceWith(recursiveWrapFunction(functionID, body));
    });
  },
  ForStatement: function ForStatement(path) {
    // converts
    //
    // for(node.init, node.test, node.update) {
    //   newBody;
    // }
    //
    // into:
    //
    // {
    //   node.init;
    //   await async function _recursive() {
    //     if (node.test) {
    //       newBody;
    //       node.update;
    //       return await _recursive();
    //     }
    //   }()
    // }
    ifShouldRefactorLoop(path, (0, _utils.containsAwait)(path.get('update')), function () {
      path.node.body.body.push((0, _babelTypes.expressionStatement)(path.node.update));
      path.replaceWithMultiple([(0, _babelTypes.expressionStatement)(path.node.init), (0, _babelTypes.whileStatement)(path.node.test, path.node.body)]);
    });
  },
  ForInStatement: function ForInStatement(path) {
    var _this = this;

    // converts
    // for (node.left in node.right) {
    //   newBody;
    // }
    //
    // info:
    //
    // var _items = [];
    // for (var _item in node.right) {
    //   _items.push(_item);
    // }
    // _items.reverse();
    // await async function _recursive() {
    //   if (_items.length) {
    //     node.left = _items.pop();
    //     node.body;
    //     return await _recursive();
    //   }
    // }

    ifShouldRefactorLoop(path, false, function () {
      var KEYS = (0, _babelTypes.identifier)(path.scope.generateUid('keys'));
      var OBJECT = (0, _babelTypes.identifier)(path.scope.generateUid('object'));
      _this.addVarDecl(KEYS);
      _this.addVarDecl(OBJECT);
      path.replaceWithMultiple(forInEquiv({
        KEYS: KEYS, OBJECT: OBJECT,
        KEY: (0, _babelTypes.identifier)(path.scope.generateUid('key')),
        LEFT: path.node.left,
        RIGHT: path.node.right,
        BODY: path.node.body
      }));
    });
  }
};


var forInEquiv = (0, _babelTemplate2.default)('\n  OBJECT = RIGHT;\n  KEYS = [];\n  for (var KEY in OBJECT) {\n    KEYS.push(KEY);\n  }\n  KEYS.reverse();\n  while(KEYS.length) {\n    LEFT = KEYS.pop();\n    if (LEFT in OBJECT) {\n      BODY;\n    }\n  }\n');

function recursiveWrapFunction(functionID, body) {
  var func = (0, _utils.wrapFunction)(body);
  func.callee.id = functionID;

  return (0, _utils.awaitStatement)(func);
}

function insideAwaitContainingLabel(path) {
  // walks the path tree to check if inside a label that also contains an await
  // statement. (See also the LabeledStatement visitor.)
  do {
    if (path.node.loopLabel) {
      return true;
    }
  } while (path = path.parentPath);

  // no such label found
  return false;
}

function ifShouldRefactorLoop(path, extraCheck, handler) {
  // ensureBlock here is convenient, but has nothing to do with the method name
  (0, _babelTypes.ensureBlock)(path.node);

  if (extraCheck || insideAwaitContainingLabel(path) || loopContainsAwait(path.get('body'))) {
    handler();
  }
}

var NoSubLoopsVisitor = {
  Loop: function Loop(path) {
    path.skip();
  }
};

// does the current loop (no subloops) contain an await statement?
var loopContainsAwait = (0, _utils.matcher)(['AwaitExpression'], (0, _jsExtend.extend)({}, _utils.NoSubFunctionsVisitor, NoSubLoopsVisitor));

function refactorLoop(path, extraCheck, addVarDecl, handler) {
  ifShouldRefactorLoop(path, extraCheck, function () {
    // gather info about the function & fix up its body (break + continue
    // statements)
    var label = path.node.loopLabel;
    var functionID = label || (0, _babelTypes.identifier)(path.scope.generateUid('recursive'));
    var info = { functionID: functionID };
    path.get('body').traverse(BreakContinueReplacementVisitor, info);
    // actual conversion
    handler(functionID);

    // if containing a return *or* a break statement that doesn't control the
    // own loop (references a label of another loop), add:
    //
    // .then(function (_resp) {
    //   _temp = _resp;
    //   if (_temp !== _recursive) {
    //     return _temp;
    //   }
    // });
    if (info.addReturnHandler) {
      var tmp = (0, _babelTypes.identifier)(path.scope.generateUid('temp'));
      addVarDecl(tmp);
      path.node.loopLabel = label;
      path.replaceWithMultiple(loopReturnHandler({ TMP: tmp, BASE: path.node, FUNC: functionID }));
    }
  });
}

var loopReturnHandler = (0, _babelTemplate2.default)('\n  TMP = BASE\n  if (_temp !== FUNC) {\n    return _temp;\n  }\n');

var continueStatementEquiv = function continueStatementEquiv(funcID) {
  // continue label; -> return await label();
  var stmt = (0, _babelTypes.returnStatement)((0, _babelTypes.awaitExpression)((0, _babelTypes.callExpression)(funcID, [])));
  // not a 'real' return
  stmt.noHandlerRequired = true;
  return stmt;
};

var BreakContinueReplacementVisitor = (0, _jsExtend.extend)({
  ReturnStatement: function ReturnStatement(path) {
    if (!path.node.noHandlerRequired && path.node.argument) {
      // if a return statement added by the user - and actually returning
      // something, we need to add a return handler later.
      this.addReturnHandler = true;
    }
  },

  // replace continue/break with their recursive equivalents
  BreakStatement: function BreakStatement(path) {
    // a break statement is replaced by returning the name of the loop function
    // that should be broken. It's a convenient unique value.
    //
    // So: break; becomes return _recursive;
    //
    // and break myLabel; becomes return myLabel;

    var label = getLabel(path, this.functionID);

    var returnStmt = (0, _babelTypes.returnStatement)(getLabel(path, this.functionID));
    if (label === this.functionID) {
      // only if this controls the current loop, a return handler is unnecessary
      returnStmt.noHandlerRequired = true;
    }
    path.replaceWith(returnStmt);
  },
  ContinueStatement: function ContinueStatement(path) {
    // see break, with the difference that the function is called (and thus)
    // executed next
    path.replaceWith(continueStatementEquiv(getLabel(path, this.functionID)));
  }
}, _utils.NoSubFunctionsVisitor, NoSubLoopsVisitor);

var getLabel = function getLabel(path, functionID) {
  return path.node.label || functionID;
};