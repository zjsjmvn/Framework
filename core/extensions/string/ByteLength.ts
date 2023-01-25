export const ByteLength = (str) => {
  var length = 0;
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255)
      length = length + 2;
    else length = length + 1;
  }
  return length;
};
