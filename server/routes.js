// Load modules
var Produto = require('./controller/ProdutoController');
var Structure = require('./controller/StructureController');

// API Server Endpoints
exports.endpoints = [
  { 
  	method: 'post',
  	path: '/products',
  	config: Produto.create
  },
  {
  	method: 'put',
  	path: '/products/{_id}',
  	config: Produto.update
  },
  {
  	method: 'get',
  	path: '/products',
  	config: Produto.getProducts 
  },
  {
    method: 'get',
    path: '/products/{_id}',
    config: Produto.getProductById
  },
  {
    method: 'delete',
    path: '/products/{_id}',
    config: Produto.remove
  },
  {
    method: 'put',
    path: '/products/{_parentId}/children/{_childId}',
    config: Produto.addChildren
  },
  {
    method: 'get',
    path: '/products/{_id}/children',
    config: Produto.getChildren
  }
];
