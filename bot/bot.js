const TelegramBot = require('node-telegram-bot-api');
const { downloadFile, processImage, processPDF, verifyText, sendAdminLog } = require('./fileUtils');
const { remarketingMessage } = require('../routes');
const logger = require('./logger');

// Configurações do bot e do logger
const token = '7929856019:AAFnFKmDlve3Zf36YpztGwmlyuyFg8bM8Hw';
const ADMIN_CHAT_ID = '7112526171';
const TARGET_NAME = 'Ramon';

const bot = new TelegramBot(token, { polling: true });
const startedUsers = new Set(); 

function startBot() {
  logger.info('Bot Iniciado com sucesso!');

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'usuário';
    const userId = msg.from.id;
    const welcomeMessage = `Olá ${userName}, seja bem-vindo! 🎉 Confira nossos conteúdos...`;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Acesso Vitalício - R$ 24,99', callback_data: 'plan_vitalicio' }],
          [{ text: '💎 Acesso Mensal - R$ 14,99', callback_data: 'plan_mensal' }],
          [{ text: '💬 Suporte', url: 'https://t.me/suportemeladinhas' }]
        ]
      }
    };

    bot.sendPhoto(chatId, 'https://i.ibb.co/cQbjTTV/image.jpg', { caption: welcomeMessage, ...options })
      .then(() => {
        logger.info(`Comando /start iniciado por ${userName} (ID: ${userId})`);
        if (!startedUsers.has(userId)) {
          startedUsers.add(userId);
          setTimeout(() => remarketingMessage(chatId), 60000);
        }
      })
      .catch((error) => logger.error(`Erro ao enviar mensagem de boas-vindas: ${error.message}`));
  });

  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const userId = callbackQuery.from.id;
    let responseMessage = '';

    switch (callbackQuery.data) {
      case 'plan_vitalicio':
        responseMessage = `💎 Acesso Vitalício 💎\n\nSelecione "Pagar com PIX" para continuar com o pagamento.`;
        logger.info(`Usuário ${userId} selecionou o plano vitalício`);
        break;

      case 'plan_mensal':
        responseMessage = `💎 Acesso Mensal 💎\n\nSelecione "Pagar com PIX" para continuar com o pagamento.`;
        logger.info(`Usuário ${userId} selecionou o plano mensal`);
        break;

      default:
        return;
    }

    const payOptions = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Pagar com PIX', callback_data: 'pay_with_pix' }]
        ]
      }
    };

    await bot.sendMessage(message.chat.id, responseMessage, payOptions);
  });

  bot.on('callback_query', (callbackQuery) => {
    if (callbackQuery.data === 'pay_with_pix') {
      const message = callbackQuery.message;
      bot.sendMessage(
        message.chat.id,
        `🔑 Chave PIX: \`agenciameladinhavip@gmail.com\`\n📩 Destinatário: Ramon Kelvin\n\n⚠️ Para copiar a chave, basta pressionar em cima do e-mail.\n\nApós o pagamento, envie seu comprovante nesta conversa para validação.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.document || msg.photo) {
      let fileId;
      let fileName;

      if (msg.photo) {
        const photos = msg.photo;
        fileId = photos[photos.length - 1].file_id;
        fileName = 'image.jpg';
      } else if (msg.document) {
        fileId = msg.document.file_id;
        fileName = msg.document.file_name;
      }

      const filePath = path.join(__dirname, fileName);

      try {
        await downloadFile(fileId, filePath);

        let extractedText = '';
        const fileExt = path.extname(filePath).toLowerCase();

        if (fileExt === '.pdf') {
          extractedText = await processPDF(filePath);
        } else if (['.png', '.jpg', '.jpeg'].includes(fileExt)) {
          extractedText = await processImage(filePath);
        } else {
          bot.sendMessage(chatId, 'Formato de arquivo não suportado.');
          return;
        }

        await bot.sendMessage(chatId, '🔍 Analisando seu comprovante...');
        await new Promise(resolve => setTimeout(resolve, 7000));

        if (verifyText(extractedText)) {
          await bot.sendMessage(chatId, '✅ Comprovante verificado com sucesso! Você agora tem acesso ao grupo VIP! 🎉');
          await new Promise(resolve => setTimeout(resolve, 5000));
          await bot.sendMessage(chatId, 'Acesso: https://bit.ly/TufosAcessoVIP');
        } else {
          await bot.sendMessage(chatId, 'Comprovante Inválido. Verifique se o valor ou destinatário estão corretos. Para suporte, contate: @suportemeladinhas');
        }

        const fileLink = await bot.getFileLink(fileId);
        await sendAdminLog(msg, fileLink);

      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Erro ao processar o arquivo.');
      } finally {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  });
}

module.exports = { startBot };
