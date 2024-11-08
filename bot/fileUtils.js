const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

async function downloadFile(fileId, dest) {
  const fileLink = await bot.getFileLink(fileId);
  const response = await axios({
    url: fileLink,
    responseType: 'stream',
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    writer.on('finish', () => resolve(dest));
    writer.on('error', reject);
  });
}

async function processImage(filePath) {
  return Tesseract.recognize(filePath, 'eng', { logger: m => console.log(m) })
    .then(({ data: { text } }) => text);
}

async function processPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  return pdfParse(dataBuffer).then(data => data.text);
}

function verifyText(text) {
  return text.includes('Ramon');
}

async function sendAdminLog(msg, fileLink) {
  const logMessage = `
    📄 *Novo Comprovante Recebido*
    👤 *Usuário:* ${msg.from.first_name} ${msg.from.last_name || ''}
    🆔 *ID:* ${msg.from.id}
    ⏰ *Hora:* ${new Date().toLocaleString()}
    📎 *Arquivo:* [Ver Comprovante](${fileLink})
  `;
  await bot.sendMessage(ADMIN_CHAT_ID, logMessage, { parse_mode: 'Markdown' });
}

module.exports = { downloadFile, processImage, processPDF, verifyText, sendAdminLog };
