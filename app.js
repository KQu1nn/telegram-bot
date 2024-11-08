const express = require('express');
const { startBot } = require('./bot/bot');
const logger = require('./bot/logger');

// Configuração do servidor Express para manter o Render ativo
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot está rodando!');
});

app.listen(port, () => {
  logger.info(`Servidor Express rodando na porta ${port}`);
  startBot();
});
