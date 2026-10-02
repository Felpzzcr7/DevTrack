// Só para rodar no computador. Na Vercel quem chama o app é api/index.js.
const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));