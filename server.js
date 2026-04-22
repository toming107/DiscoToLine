// モジュールをインポート
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const app = express();

// 環境変数からトークンを取得（USER_IDは不要になったため削除）
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LINE_TOKEN = process.env.LINE_TOKEN;
// URLをブロードキャスト（全員送信）用に固定
const LINE_URL = 'https://line.me';

// Discordクライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ]
});

// Bot起動時にログ表示
client.once('ready', () => {
  console.log(`ログインしました: ${client.user.tag}`);
});

// LINEに一斉送信（ブロードキャスト）する関数
async function sendToLine(token, message) {
  try {
    await axios({
      method: 'post',
      url: LINE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        messages: [{
          type: 'text',
          text: message
        }]
      }
    });
    console.log('LINE一斉送信に成功しました');
  } catch (error) {
    // 詳細なエラー理由を表示
    console.error('LINE一斉送信失敗:', error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// Discordメッセージ受信時の処理
client.on('messageCreate', async (message) => {
  // 自分（Bot）の投稿や、Botからのメッセージを除外
  if (message.author.bot) return;

  let lineMessage = `${message.author.username} in #${message.channel.name}:\n`;

  if (message.content) lineMessage += `テキスト: ${message.content}\n`;

  if (message.embeds.length > 0) {
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

  // メッセージが空でない場合にLINEへ送信
  const prefix = `${message.author.username} in #${message.channel.name}:`;
  if (lineMessage.trim() !== prefix) {
    await sendToLine(LINE_TOKEN, lineMessage);
  }
});

// Expressサーバー（Koyebのヘルスチェック用）
app.get('/', (req, res) => {
  res.send('Discord to LINE Bot is running!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('サーバーが起動しました');
});

// Discord Bot起動
client.login(DISCORD_TOKEN);
