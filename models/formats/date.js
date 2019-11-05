const { DateTime } = require("luxon");

const DATE_FORMAT = "yyyy-LL-dd";
const DATE_PATTERN = /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/;

function date(input) {
  return (
    DATE_PATTERN.test(input) && DateTime.fromFormat(input, DATE_FORMAT).isValid
  );
}

export default date;
export { DATE_PATTERN, DATE_FORMAT };
