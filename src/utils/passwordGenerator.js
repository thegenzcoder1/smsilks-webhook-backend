const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.generateHashedPassword = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let plainPassword = "";

  for (let i = 0; i < 4; i++) {
    plainPassword += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  // bcrypt automatically generates salt internally
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  return hashedPassword;
};