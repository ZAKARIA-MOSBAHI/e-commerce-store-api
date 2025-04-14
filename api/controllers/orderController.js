const handleErrors = require("../../utils/errorHandler");

// GET ALL ORDERS
module.exports.getOrders = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// GET ORDER BY ORDER ID
module.exports.getOrderById = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// CANCEL AN ORDER
module.exports.cancelOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// UPDATE AN ORDER
module.exports.updateOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
//GET THE LOGGING USER'S ORDERS
module.exports.getClientOrders = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
//GET THE LOGGING USER'S ORDERS BY ID
module.exports.getClientOrderById = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// CANCEL THE LOGGING USER'S ORDER
module.exports.cancelClientOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
