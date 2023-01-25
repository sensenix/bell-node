const config = require("../config/config");
var methods = {}

methods.taggerT2N = new Map();
methods.taggerN2T = new Map();

methods.counter = 0;

methods.tag2n = function(tag) {
	if (!config.tags_hiding) return(tags)
	if (methods.taggerT2N.has(tag)) { return methods.taggerT2N.get(tag) }
	else {
		methods.taggerN2T.set(methods.counter, tag)
		methods.taggerT2N.set(tag, methods.counter)
		methods.counter++
	}
	return methods.counter-1
}

methods.n2tag = function(n) {
	if (!config.tags_hiding) return(n)
	if (methods.taggerN2T.has(n)) { return methods.taggerN2T.get(n).toString() }
	return ""
}

exports.data = methods;