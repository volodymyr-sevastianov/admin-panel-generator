const { DateTime } = require("luxon");

const DATETIME_PATTERN = /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/;

function time(input) {
  return DATETIME_PATTERN.test(input) && DateTime.fromISO(input).isValid;
}

export default time;
export { DATETIME_PATTERN };
