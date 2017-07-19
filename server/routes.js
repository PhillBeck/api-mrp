// Load modules
var Product = require('./controller/ProductController'),
    Necessity = require('./controller/NecessityController'),
    ProductionOrder = require('./controller/productionOrders/productionOrderController'),
    WarehouseController = require('./controller/WarehouseController'),
    NFController = require('./controller/NFController'),
    TransferMovementController = require('./controller/movements/transferMovementController'),
    InputMovementController = require('./controller/movements/inputMovementController');

// API Server Endpoints
exports.endpoints = [
  {
    method: 'post',
    path: '/products',
    config: Product.create
  },
  {
    method: 'put',
    path: '/products/{_id}',
    config: Product.update
  },
  {
    method: 'get',
    path: '/products',
    config: Product.getProducts
  },
  {
    method: 'get',
    path: '/products/{_id}',
    config: Product.getProductById
  },
  {
    method: 'delete',
    path: '/products/{_id}',
    config: Product.remove
  },
  {
    method: 'put',
    path: '/products/{_parentId}/children/{_childId}',
    config: Product.addChildren
  },
  {
    method: 'get',
    path: '/products/{_id}/children',
    config: Product.getChildren
  },
  {
    method: 'delete',
    path: '/products/{_parentId}/children/{_childId}',
    config: Product.removeChildren
  },
  {
    method: 'post',
    path: '/necessities',
    config: Necessity.createNecessity
  },
  {
    method: 'get',
    path: '/necessities',
    config: Necessity.getNecessities
  },
  {
    method: 'put',
    path: '/necessities/{_id}',
    config: Necessity.updateNecessity
  },
  {
    method: 'get',
    path: '/necessities/{necessityId}',
    config: Necessity.getNecessityById
  },
  {
    method: 'delete',
    path: '/necessities/{_id}',
    config: Necessity.deleteNecessity
  },
  {
    method: 'post',
    path: '/necessities/{_id}/items',
    config: Necessity.addItem
  },
  {
    method: 'delete',
    path: '/necessities/{necessityId}/items/{itemId}',
    config: Necessity.removeItem
  },
  {
    method: 'put',
    path: '/necessities/{necessityId}/items/{itemId}',
    config: Necessity.updateItem
  },
  {
    method: 'get',
    path: '/necessities/{necessityId}/materials',
    config: Necessity.calculateMaterials
  },
  {
    method: 'get',
    path: '/necessities/{necessityId}/items',
    config: Necessity.getItemsByNecessityId
  },
  {
    method: 'get',
    path: '/materials/{_id}',
    config: Necessity.getMaterials
  },
  {
    method: 'post',
    path: '/productionOrders',
    config: ProductionOrder.createOrder
  },
  {
    method: 'get',
    path: '/productionOrders',
    config: ProductionOrder.listOrders
  },
  {
    method: 'get',
    path: '/productionOrders/{orderId}',
    config: ProductionOrder.getOrderById
  },
  {
    method: 'put',
    path: '/productionOrders/{orderId}',
    config: ProductionOrder.updateOrder
  },
  {
    method: 'delete',
    path: '/productionOrders/{orderId}',
    config: ProductionOrder.deleteOrder
  },
  {
    method: 'post',
    path: '/warehouses',
    config: WarehouseController.createWarehouse
  },
  {
    method: 'get',
    path: '/warehouses',
    config: WarehouseController.listWarehouses
  },
  {
    method: 'get',
    path: '/warehouses/{warehouseId}',
    config: WarehouseController.getWarehouseById
  },
  {
    method: 'put',
    path: '/warehouses/{warehouseId}',
    config: WarehouseController.updateWarehouse
  },
  {
    method: 'delete',
    path: '/warehouses/{warehouseId}',
    config: WarehouseController.deleteWarehouse
  },
  {
    method: 'get',
    path:'/warehouses/{warehouseId}/stocks/{productId}',
    config: WarehouseController.getProductStock
  },
  {
    method: 'post',
    path: '/nfs',
    config: NFController.createNF
  },
  {
    method: 'get',
    path: '/nfs',
    config: NFController.listNFs
  },
  {
    method: 'get',
    path: '/nfs/{nfId}',
    config: NFController.getNFById
  },
  {
    method: 'put',
    path: '/nfs/{nfId}',
    config: NFController.updateNF
  },
  {
    method: 'delete',
    path: '/nfs/{nfId}',
    config: NFController.deleteNF
  },
  {
    method: 'post',
    path: '/movements/transfers',
    config: TransferMovementController.create
  },
  {
    method: 'post',
    path: '/movements/input',
    config: InputMovementController.create
  },
  {
    method: 'patch',
    path: '/movements/{movementId}',
    config: TransferMovementController.patch
  },
  {
    method: 'post',
    path: '/productionOrders/test',
    config: ProductionOrder.test
  }
];
