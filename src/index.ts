import { Client, GatewayIntentBits, Partials, ActivityType, VoiceChannel, StageChannel, VoiceState } from 'discord.js';
import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Bot aktiviteleri
const activities = [
  { name: 'Spotify', type: ActivityType.Listening },
  { name: 'Euro Truck Simulator 2', type: ActivityType.Playing },
  { name: 'Rust', type: ActivityType.Playing },
  { name: 'lixinveritas', type: ActivityType.Watching },
  { name: 'Immortals Fenyx Rising', type: ActivityType.Playing },
  { name: 'Left 4 Dead 2', type: ActivityType.Playing },
  { name: 'Twitch', type: ActivityType.Streaming, url: "https://www.twitch.tv/" }
];

const uptimeStartTimes: { [key: string]: Date } = {};

// Her token için bir bot istemcisi oluşturma ve ayarlama
config.tokens.forEach((token: string, index: number) => {
  if (!token) return;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction]
  });

  const connectToChannel = async () => {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error(chalk.red(`Guild not found for client ${index + 1}`));
      return;
    }

    const channelId = config.channelIds[index];
    const channel = guild.channels.cache.get(channelId) as VoiceChannel | StageChannel | undefined;

    if (channel && (channel instanceof VoiceChannel || channel instanceof StageChannel)) {
      try {
        const connection: VoiceConnection = joinVoiceChannel({
          channelId: channel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator
        });
        console.log(chalk.bold.inverse.bgWhiteBright(`[Aktif] - ${client.user?.tag} ${index + 1} numaralı hesap aktif. Kanal ID: ${channel.id}, Kanal İsmi: ${channel.name}`));
        client.user?.setActivity(activities[index]);
      } catch (error) {
        console.error(chalk.inverse.bgYellowBright(`Kanal katılma hatası (Kanal ID: ${channelId}): ${(error as Error).message}`));
      }
    } else {
      console.error(chalk.inverse.bgYellowBright(`Kanal bulunamadı veya ses kanalı değil: ${channelId}`));
    }
  };

  client.on('ready', () => {
    uptimeStartTimes[token] = new Date();
    connectToChannel();
  });

  client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
    if (oldState.id === client.user?.id && !newState.channelId) {
      console.log(chalk.bold.inverse(`Bot ses kanalından ayrıldı. Yeniden bağlanıyor...`));
      connectToChannel();
    }
  });

  client.login(token).catch(error => {
    console.error(chalk.inverse.bgYellowBright(`Giriş hatası (Token: ${token}): ${(error as Error).message}`));
  });
});

// Komut dinleyicisi
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
  const command = input.trim();
  if (command === 'uptime') {
    console.log(chalk.inverse.bgRedBright(''));
    config.tokens.forEach((token: string, index: number) => {
      if (uptimeStartTimes[token]) {
        const uptime = new Date().getTime() - uptimeStartTimes[token].getTime();
        const uptimeSeconds = Math.floor((uptime / 1000) % 60);
        const uptimeMinutes = Math.floor((uptime / (1000 * 60)) % 60);
        const uptimeHours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const uptimeDays = Math.floor(uptime / (1000 * 60 * 60 * 24));
        console.log(chalk.bgCyanBright(`HESAP ${index + 1}: ${uptimeDays} gün, ${uptimeHours} saat, ${uptimeMinutes} dakika, ${uptimeSeconds} saniye`));
      }
    });
  }
});
