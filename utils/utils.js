const path = require("path");
const removeFileExtension = (filename) => {
  const fileNameWithoutExt = path.parse(filename).name.replace(/[^\w\-]/g, "");
  return fileNameWithoutExt;
};

module.exports = {
  removeFileExtension,
};
