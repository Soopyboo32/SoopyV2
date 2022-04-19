var fs = require('fs');
var path = require('path');
var walk = function (dir, done) {
	var results = [];
	fs.readdir(dir, function (err, list) {
		if (err) return done(err);
		var pending = list.length;
		if (!pending) return done(null, results);
		list.forEach(function (file) {
			file = path.resolve(dir, file);
			fs.stat(file, function (err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, function (err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
					});
				} else {
					results.push(file);
					if (!--pending) done(null, results);
				}
			});
		});
	});
};

async function walkP(dir) { //walk function but promisified
	return new Promise((res, rej) => {
		walk(dir, (err, resu) => {
			if (err) {
				rej(err)
				return
			}

			res(resu)
		});
	})
}

module.exports = { walk, walkP } //https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
//i was just too lazy to code this myself OMEGALUL