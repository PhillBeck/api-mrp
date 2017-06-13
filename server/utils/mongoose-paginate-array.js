'use strict';

function paginateArray(query, array, options, callback) {
	var self = this;
	query   = query || {};

	var page = options.page === undefined ? 1 : options.page;
	var limit = options.limit === undefined ? 10 : options.limit
	var skip = limit * (page - 1);

	self.aggregate(
		[
			{$match : query},
			{$unwind: '$' + array},
			{$skip: skip},
			{$limit: limit},
			{$group: {
				_id: null,
				docs: {$push: '$' + array}
			}},
			{$project: {_id: 0}}
		], function(err, docs) {

			if (err) {
				return callback(err);
			}

			self.aggregate(
				[
					{$match: query},
					{$project: {total: {$size: "$items"}}}
				], function(err, doc) {

					if (err) {
						return callback(err);
					}
					
					var ret = docs[0];
					ret.total = doc[0].total;
					ret.page = page;
					ret.limit = limit;
					ret.pages = Math.ceil(ret.total/limit);
					callback(undefined, ret);
				}
			)
	})
}


module.exports = function(schema) {
	schema.statics.paginateArray = paginateArray;
}