var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  paginateArray = require('./mongoose-paginate-array'),
  Product = require('../../test/config').Product;

mongoose.Promise = require('q').Promise;
/**
  * @module  Produto
  * @description Produto schema
*/
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function() {
  console.log("Connection with MongoDb succeeded.");



  var ProdutoSchema = new Schema({
    code:          {type: String, required: true, unique: true},
    name:          {type: String, required: true},
    family:        {type: String},
    productType:   {type: Number},
    description:   {type: String},
    amountInStock: {type: Number},
    unit:          {type: String},
    leadTime:      {type: Number},
    purchasePrice: {type: Number},
    costValue:     {type: Number},
    DELETED:       {type: Boolean, default: false}
  });

  var testSchema = new Schema({
    items: [ProdutoSchema]
  });

  testSchema.plugin(paginateArray);

  testModel = mongoose.model('test', testSchema);

  var Model = new testModel();

  for (let i = 0; i < 10; i++) {
    Model.items.push(new Product());
  }

  Model.save(function(err, obj) {
    testModel.paginateArray({_id: obj._id},'items',{limit: 2},function(doc) {
      console.log(doc);
    });
  });
});