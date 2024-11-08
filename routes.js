const logger = require('./bot/logger');
const bot = require('./bot/bot');

function remarketingMessage(chatId) {
  const remarketingText = `👀 Ainda pensando em aproveitar nossos conteúdos VIP? Lembre-se que temos ofertas exclusivas esperando por você! Aproveite agora! 💎`;

  bot.sendMessage(chatId, remarketingText)
    .then(() => {
      logger.info(`Mensagem de remarketing enviada para o usuário ${chatId}`);
    })
    .catch((error) => {
      logger.error(`Erro ao enviar mensagem de remarketing: ${error.message}`);
    });
}

module.exports = { remarketingMessage };
