'use strict';

module.exports = function(obj) {
	if (null === obj || "object" != typeof obj) {
		return obj;
	}

	var ret = {};

	try {
		Object.keys(obj._doc).forEach(key =>{
			ret[key] = obj._doc[key];
		});
	}
	catch (e)
	{
		Object.keys(obj).forEach(key => {
			ret[key] = obj[key]
		});
	}

	return ret;
}