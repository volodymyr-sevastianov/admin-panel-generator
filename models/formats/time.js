const { DateTime } = require("luxon");

const TIME_FORMAT = "HH:mm:ss";
const TIME_PATTERN = /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/;

function time(input) {
  return (
    TIME_PATTERN.test(input) && DateTime.fromFormat(input, TIME_FORMAT).isValid
  );
}

export default time;
export { TIME_PATTERN, TIME_FORMAT };
