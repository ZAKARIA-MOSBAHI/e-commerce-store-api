module.exports.verifyStockQuantity = (product, size) => {
  return product.sizes.get(size) > 0;
};
