function searchQuery(id, query, options, sucessCallback, errorCallback){
  var search = {};
  var filters = {
    page: 1,
    limit: 15
  };
  var aux = {};
  if(query._page){
		filters.page = parseInt(query._page);
	}
	if(query._limit){
		filters.limit = parseInt(query._limit);
	}

  if(options !== null){
    filters.populate = options.populate
    filters.select = options.select
  }

  try{
    if(query._search){
      var attrs = query._search.split("(.+?)(:|<|>|:<|>:|!)(.+?),")[0].split(',');
      aux = createQuery(attrs);
    }


    if(id !== null){

      if(isEmpty(aux)){
        search = id;
      }
      else{
        search['$and'] = []
        search['$and'].push(id);
        search['$and'].push(aux)
      }
    }
    else{
      search = aux;
    }
    sucessCallback(search, filters)
  }catch(e){
    errorCallback({
      status: 400,
      mesage: 'Search or filters have errors'
    })
  }

}

function createQuery (attrs){
  var query = {};

  query['$or'] = [];
  query['$or'].push({$and:[]})
  for(var i =0; i<attrs.length; i++){
    var op = getOperation(attrs[i]);
    var keyValue = getKeyValue(attrs[i]);
    var object = {}
    object[keyValue.key] = {};

    if(op === '$ne'){
      object[keyValue.key] = { "$ne": keyValue.value }
      query['$or'][0]['$and'].push(object)
    }
    else{
      if(op === '$eq'){
        console.log(keyValue.value)
        if(keyValue.value == "true" || keyValue.value == "false"){
          object[keyValue.key] = keyValue.value;
        }else{
            object[keyValue.key] =  { $regex: keyValue.value, $options: 'i' }
        }

      }
      else{
        object[keyValue.key][op] = keyValue.value;
      }
      query['$or'].push(object);
    }
  }

  if(query['$or'][0]['$and'].length === 0){
    query['$or'].splice(0, 1)
  }
  return query;
}

function getKeyValue(object){
  var ret = {
    key: '',
    value: ''
  };

  var tokens = object.split(':');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }

  tokens = object.split('>:');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }

  tokens = object.split(':<');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }

  tokens = object.split('<');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }

  tokens = object.split('>');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }

  tokens = object.split('!');
  if(tokens.length > 1){
    ret.key = tokens[0];
    ret.value = tokens[1];
    return ret;
  }
}

function getOperation(object){

  var op = "";
  if(object.indexOf(':') > -1){
    op = '$eq';
  }
  else if(object.indexOf('>') > -1){
    op = '$gt'
  }
  else if(object.indexOf('<') > -1){
    op = '$lt'
  }
  else if(object.indexOf('>:') > -1){
    op = '$gte'
  }
  else if(object.indexOf(':<') > -1){
    op = '$lte'
  }
  else if(object.indexOf('!') > -1){
    op = '$ne'
  }

  return op;
}

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

module.exports = {
  searchQuery: searchQuery

}
