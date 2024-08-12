require('dotenv').config();
require('../src/index.js');
const cron = require('../node_modules/node-cron');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.login(process.env.TOKEN);
const channelId = process.env.CHANNEL_ID;

// function isEveryOtherTuesday(date) {
//     const startDate = new Date('2024-01-02'); // Start with a known "every other" Tuesday
//     const diffTime = Math.abs(date - startDate);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     const diffWeeks = Math.floor(diffDays / 7);

//     // Return true if it's an even week since the start date
//     return diffWeeks % 2 === 0;
// }

// async function scheduleUpdate(channelId, content){
//     console.log("The schedule has changed?");
//     console.log(`The Channel Id is: ${channelId}`);

//     try {
//         if (!channelId){
//             throw new Error("The Channel id is FUCKING UP");
//         }

//         console.log('Fetching channel...');
//         const channel = await client.channels.fetch(channelId);
//         console.log('Fetched Channel:', channel);

//         if(channel && channel.isTextBased()) {
//             await channel.send(content);
//         } else {
//             console.log('Failure');
//         }
//     } catch (error) {
//         console.error('Error Sending Message:', error);
//     }
// };

// cron.schedule('0 0 * * 2', async () => {
//     const now = new Date();

//     if(isEveryOtherTuesday(now)) {
//         //scheduleUpdate();
//         await scheduleUpdate(channelId, 'The schedule has changed?');
//     } else {
//         console.log('Was not an every other Tuesay');
//     };
// });

// if (process.argv.includes('--run-now')) {
//     //scheduleUpdate(channelId);

//     client.once('ready', async () => {
//         await scheduleUpdate(channelId, 'Running --run-now');
//     });
// }