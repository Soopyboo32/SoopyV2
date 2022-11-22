export default function ({ types: t }) {
	return {
		visitor: {
			ImportDeclaration(path, state) {
				if (!state.filename) return

				const givenPath = path.node.source.value;
				const depth = state.filename.split(/SoopyV2-dev|SoopyV2/)[1].split("\\").length - givenPath.split("../").length;

				if (depth === 0) {
					path.node.source.value = givenPath.replace("../", "")
				}
			},
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

				let shouldAdd2 = false
				const MyVisitor2 = {
					Identifier(path) {
						if (path.node.name === "fetch") {
							shouldAdd2 = true
						}
					}
				};

				path.traverse(MyVisitor2)
				if (shouldAdd2 && !state.filename.includes("networkUtils")) {
					let depth = state.filename.replace(state.cwd, "").split(/[\\/]/g).length - 2
					const identifier = t.identifier('fetch');
					const importDefaultSpecifier = t.importDefaultSpecifier(identifier);
					const importDeclaration = t.importDeclaration([importDefaultSpecifier], t.stringLiteral("../".repeat(depth) + 'SoopyV2/utils/networkUtils'));
					path.unshiftContainer('body', importDeclaration);
				}
			}
		}
	};
};