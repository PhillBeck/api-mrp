// Load modules
var Produto = require('./controller/ProdutoController');
var Necessitiy = require('./controller/NecessityController');

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
  },
  {
    method: 'delete',
    path: '/products/{_parentId}/children/{_childId}',
    config: Produto.removeChildren
  },
  {
    method: 'post',
    path: '/necessities',
    config: Necessitiy.createNecessity
  },
  {
    method: 'get',
    path: '/necessities',
    config: Necessitiy.getNecessities
  },
  {
    method: 'put',
    path: '/products/test/{_id}',
    config: Produto.test
  }
];
