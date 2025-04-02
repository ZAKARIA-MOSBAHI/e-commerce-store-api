const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
// GET ALL ADRESSES (ADMIN)
router.get("/", authenticate, authorizeAdmin, addressController.getAddresses);
// GET CLIENT ADDRESS (USER)
router.get("/me", authenticate, addressController.getClientAddress);
// CREATE CLIENT ADDRESS (USER)
router.post("/me", authenticate, addressController.createClientAddress);
// CREATE ADDRESS (ADMIN)
router.post(
  "/:id",
  authenticate,
  authorizeAdmin,
  addressController.createAddress
);
// DELETE CLIENT ADDRESS (USER)
router.delete(
  "/me/delete",
  authenticate,
  addressController.deleteClientAddress
);
// DELETE CLIENT ADDRESS (USER)
router.delete(
  "/delete/:userId",
  authenticate,
  authorizeAdmin,
  addressController.deleteAddress
);
// UPDATE CLIENT ADDRESS (USER)
router.put("/me/update", authenticate, addressController.updateClientAddress);
// UPDATE ADDRESS (ADMIN)
router.put(
  "/update/:userId",
  authenticate,
  authorizeAdmin,
  addressController.updateAddress
);
module.exports = router;
