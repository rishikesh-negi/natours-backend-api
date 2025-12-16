exports.emailValidator = function (val) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
};

exports.passwordValidator = function (val) {
  // 1) For checking min 8 chars, uppercase letter, lowercase letter, number, special char:
  // return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(val);

  // 2) For checking 8 chars, letters, numbers (simpler):
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(val);
};
