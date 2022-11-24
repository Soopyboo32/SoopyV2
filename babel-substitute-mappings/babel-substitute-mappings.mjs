import fs from "fs"
let [m, f] = createMappings()

export default function ({ types: t }) {
	return {
		visitor: {
			Program(path, state) {
				if (!isMappingsImported(path)) return

				replaceMappings(path, t, f, m)
			}
		}
	};
};

/**
 * Also removes the import statement
 */
function isMappingsImported(mainPath) {
	let isImported = false

	const MyVisitor = {
		ImportDeclaration(path) {
			let name = path.node.source.value
			if (!name) return

			if (name.endsWith("mappings") || name.endsWith("mappings.js")) {
				isImported = true
				path.remove()
			}
		}
	}

	mainPath.traverse(MyVisitor)

	return isImported
}

function replaceMappings(mainPath, t, f, m) {
	let isImported = false

	let data = { f, m }

	const MyVisitor = {
		MemberExpression(path) {
			if (path.node.object.object?.name === "f" || path.node.object.object?.name === "m") {
				//3 part ed f.field.class
				let what = path.node.object.object?.name
				let method = path.node.object.property?.name
				let clas = path.node.property?.name
				if (!data[what][method][clas]) throw new Error("INVALID MAPPING (" + what + "." + method + "." + clas + ") D:")
				path.replaceWith(t.stringLiteral(data[what][method][clas]))
			}
			if (path.node.object?.name === "f" || path.node.object?.name === "m") {
				//3 part ed f.field.class
				let what = path.node.object?.name
				let method = path.node.property?.name

				if (!data[what][method]) throw new Error("INVALID MAPPING (" + what + "." + method + ") D:")
				path.replaceWith(t.stringLiteral(data[what][method]))
			}
		}
	}

	mainPath.traverse(MyVisitor)

	return isImported
}
import request from "sync-request"
function createMappings() {
	let m = {}
	let f = {}
	let joinedFile = String(request('GET', 'http://soopy.dev/api/soopyv2/joined.tsrg').getBody())
	joinedFile = joinedFile.split("\n")
	let joinedData = {}
	let joinedData2 = {}
	let currThing = []
	joinedFile.forEach(line => {
		if (line.startsWith("	")) {
			line = line.split(" ")
			let thingo = line.pop()
			let thingo2 = line.pop()
			joinedData[thingo] = currThing[1].split("/").pop()
			if (thingo2.includes(")")) {
				joinedData2[thingo] = thingo2.replace("(", "").replace(";", "").replace(")", "_")
			}
		} else {
			currThing = line.split(" ")
		}
	})
	let methodsFile = String(request('GET', 'http://soopy.dev/api/soopyv2/methods.csv').getBody())
	let methodsArr = methodsFile.split("\n")
	methodsArr.shift()
	let methodsData = {}
	methodsArr.forEach(method => {
		let [searge, name, side, desc] = method.split(",")

		if (!methodsData[name]) methodsData[name] = {}
		methodsData[name][joinedData[searge]] = {
			searge: searge,
			name: name,
			side: side,
			desc: desc
		}
	})
	let fieldsFile = String(request('GET', 'http://soopy.dev/api/soopyv2/fields.csv').getBody())
	let fieldsArr = fieldsFile.split("\n")
	fieldsArr.shift()
	let fieldsData = {}
	fieldsArr.forEach(method => {
		let [searge, name, side, desc] = method.split(",")

		if (!fieldsData[name]) fieldsData[name] = {}
		fieldsData[name][joinedData[searge]] = {
			searge: searge,
			name: name,
			side: side,
			desc: desc
		}
	})
	let methodNameKeys = Object.keys(methodsData)
	methodNameKeys.forEach((methodName, i) => {
		let keys = Object.keys(methodsData[methodName])
		if (keys.length === 1) {
			m[methodName] = methodsData[methodName][keys[0]].searge
		} else {
			m[methodName] = {}
			let keysData = {}
			keys.forEach(key => {
				if (!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

				keysData[key.split("_").pop()].push(methodsData[methodName][key])
			})
			keys.forEach(key => {
				if (keysData[key.split("_").pop()].length === 0) return
				if (keysData[key.split("_").pop()].length === 1) {
					m[methodName][key.split("_").pop()] = methodsData[methodName][key].searge
				} else {
					m[methodName][key.split("_").pop()] = {}
					keysData[key.split("_").pop()].forEach((method) => {
						m[methodName][key.split("_").pop()][joinedData2[method.searge]] = method.searge
					})

					keysData[key.split("_").pop()] = []
				}
			})
		}
	})
	let fieldNameKeys = Object.keys(fieldsData)
	fieldNameKeys.forEach((fieldName, i) => {
		let keys = Object.keys(fieldsData[fieldName])
		if (keys.length === 1) {
			f[fieldName] = fieldsData[fieldName][keys[0]].searge
		} else {
			f[fieldName] = {}
			let keysData = {}
			keys.forEach(key => {
				if (!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

				keysData[key.split("_").pop()].push(fieldsData[fieldName][key])
			})
			keys.forEach(key => {
				if (keysData[key.split("_").pop()].length === 0) return
				if (keysData[key.split("_").pop()].length === 1) {
					f[fieldName][key.split("_").pop()] = fieldsData[fieldName][key].searge
				} else {
					f[fieldName][key.split("_").pop()] = {}
					keysData[key.split("_").pop()].forEach((field) => {
						f[fieldName][key.split("_").pop()][joinedData2[field.searge]] = field.searge
					})

					keysData[key.split("_").pop()] = []
				}
			})
		}
	})
	return [m, f]
}