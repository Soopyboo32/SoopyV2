export default function ({ types: t }) {
	return {
		visitor: {
			Program(path, state) {
				let shouldAdd = false
				const MyVisitor = {
					Function: {
						enter: function enter(path) {
							if (path.node.async) {
								shouldAdd = true
							}
						}
					},
					Identifier(path) {
						if (path.node.name === "Promise") {
							shouldAdd = true
						}
					}
				};
				path.traverse(MyVisitor)
				if (shouldAdd) {
					let depth = state.filename.replace(state.cwd, "").split(/[\\/]/g).length - 2
					const identifier = t.identifier('Promise');
					const importDefaultSpecifier = t.importDefaultSpecifier(identifier);
					const importDeclaration = t.importDeclaration([importDefaultSpecifier], t.stringLiteral("../".repeat(depth) + 'PromiseV2'));
					path.unshiftContainer('body', importDeclaration);
				}
			}
		}
	};
};