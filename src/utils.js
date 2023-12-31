export const assign = Object.assign ? Object.assign : function () {
  const target = arguments[0];

  for (let i = 1; i < arguments.length; i++) {
    const source = arguments[i];

    if (source) {
      for (let k in source) {
        if (Object.prototype.hasOwnProperty.call(source, k)) {
          target[k] = source[k];
        }
      }
    }
  }

  return target;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isNull(value) {
  return (value === null);
}

export function isUndefined(value) {
  return (value === undefined);
}

export function isNil(value) {
  return isNull(value) || isUndefined(value);
}

export function isFunction(value) {
  return typeof value === 'function';
}
