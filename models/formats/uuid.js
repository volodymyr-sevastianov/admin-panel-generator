const UUID_PATTERN = /^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/;

function uuid(input) {
  return UUID_PATTERN.test(input);
}

export default uuid;
export { UUID_PATTERN };
