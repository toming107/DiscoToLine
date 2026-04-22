// モジュールをインポート
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const app = express();

// 環境変数からトークン/IDを取得
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LINE_TOKEN = process.env.LINE_TOKEN;
const USER_ID = process.env.USER_ID;
const LINE_URL = 'https://line.me';

// Discordクライアントを作成
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Bot起動時にログ表示
client.once('ready', () => {
  console.log(`ログインしました: ${client.user.tag}`);
});

// LINEにメッセージを送信する関数
async function sendToLine(token, message) { // 引数からuserIdを消してもOK
  try {
    // 修正ポイント: payloadから「to」を削除し、宛先指定をなくす
    await axios.post(LINE_URL, { 
      messages: [{ type: 'text', text: message }] 
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    console.log(`LINEに一斉送信（ブロードキャスト）成功`);
  } catch (error) {
    console.error(`LINE一斉送信失敗: ${error.message}`);
  }
}

// Discordメッセージ受信時の処理
client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) return; // 自分を除外

  let lineMessage = `${message.author.username} in #${message.channel.name}:\n`;

  if (message.content) lineMessage += `テキスト: ${message.content}\n`; // テキスト追加

  if (message.embeds.length > 0) { // embedがあれば追加
    for (const embed of message.embeds) {
      lineMessage += '埋め込みメッセージ:\n';
      if (embed.title) lineMessage += `タイトル: ${embed.title}\n`;
      if (embed.description) lineMessage += `説明: ${embed.description}\n`;
      if (embed.fields.length > 0) {
        for (const field of embed.fields) lineMessage += `${field.name}: ${field.value}\n`;
      }
      if (embed.footer) lineMessage += `フッター: ${embed.footer.text}\n`;
      if (embed.url) lineMessage += `URL: ${embed.url}\n`;
    }
  }

if (lineMessage.trim() !== `${message.author.username} in #${message.channel.name}:`) {
  await sendToLine(LINE_TOKEN, lineMessage); // USER_IDを渡さなくてよくなります
}
});

// Expressサーバーの稼働確認用エンドポイント
app.get('/', (req, res) => {
  console.log('Expressリクエスト受信');
  res.send('Bot is alive!');
});

// サーバー起動
app.listen(process.env.PORT || 3000, () => {
  console.log('サーバーが起動しました');
});

// Discord Bot起動
client.login(DISCORD_TOKEN);