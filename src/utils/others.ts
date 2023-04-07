
function toHexString (bytes: Array<any>) {
  var hex =  Array.from(bytes, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
  return '0x'.concat(hex)
};

export {toHexString};