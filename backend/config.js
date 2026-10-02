
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production" ? null : "segredo-so-para-desenvolvimento");

if (!JWT_SECRET) {
  throw new Error("Defina a variável de ambiente JWT_SECRET.");
}

module.exports = { JWT_SECRET };