/*App constants are configuration values that don't change frequently but are used throughout your application. They're better stored in a separate file than hard-coded in multiple places. Here's what they typically include:

*/
const MOROCCAN_PHONE_REGEX = /^(?:\+212|0)([67]\d{8})$/;
const ZIPCODE_REGEX = /^\d{5}$/;

module.exports = {
  MOROCCAN_PHONE_REGEX,
  ZIPCODE_REGEX,
};
