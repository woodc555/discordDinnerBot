require('dotenv').config();
require('../chron_jobs/chron-job.js');
const {Client, GatewayIntentBits, Collection} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const userStates = new Collection();
const channelId = process.env.CHANNEL_ID;
const dinSchArry = ['Iris', 'Jake', 'Tommy', 'David', 'Christian'];
const dinSchDates = [];


client.on('ready', (c) => {
    console.log('the bot is ready');
    console.log(`Logged into: ${client.user.tag}`);
});

client.on('messageCreate', async (message) =>{
    if (message.author.bot){
        return;
    ;}

    const userId = message.author.id;
    const addWaiting = userStates.get(userId);

    //List of Commands
    if (message.content == "!botCommands"){
        message.channel.send("View Din Din Schedule: **!din**\n\nAdd To Schedule: **!addToSch**\n\nRemove From Schedule: **!remFromSch**\n\nSwitch With Someone: **!switchDuties**\n\nProgress the Schedule: **!progress**");
    }

     //Checking Schedule
     if (message.content == '!din'){
        const scheduleResp = dinSchArry.join('\n');

        message.channel.send(`**DinDin Duties:**\n${scheduleResp}`);
    }

    //Addding People to Schedule
    if (message.content == '!addToSch'){
        await message.channel.send('Who would you like to Add? Please only type their name.');

        userStates.set(userId, 'waiting_to_add');
    };

    if (addWaiting === 'waiting_to_add'){
        const addResponse = message.content;
        dinSchArry.push(addResponse);
        const scheduleResp = dinSchArry.join('\n');

        await message.channel.send(`You have added: "${addResponse}" to the DinDin Schdule.\n\n**DinDin Schedule**\n${scheduleResp}`);

        userStates.delete(userId);
        return;
    }

    //Removing People from Schedule
    if (message.content == '!remFromSch'){
        const scheduleResp = dinSchArry.join('\n');
        await message.channel.send(`Who would you like to remove, please type in there name exactly as you see it?\n\n**DinDin Schedule**\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_remove');
    };

    if (addWaiting === 'waiting_to_remove'){
        const removeResponse = message.content;
        scheduleResp = dinSchArry.join('\n');

        if(dinSchArry.includes(removeResponse)){
            var remIndex = dinSchArry.indexOf(removeResponse);
            dinSchArry.splice(remIndex, 1);

            await message.channel.send(`You have removed... ${removeResponse}.`);

        } else {
            await message.channel.send(`${removeResponse} is not in the schedule. Please look again and type it out exactly.\n\n**DinDin Schedule**\n${scheduleResp}`);
        }

        userStates.delete(userId);
        return;
    }

    //Switching Positions in Schedule
    if (message.content == '!switchDuties'){
        const scheduleResp = dinSchArry.join('\n');
        await message.channel.send(`Which two people would you like to switch?\n\n**DinDin Schedule**\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_switch_part1');
    }

    if (addWaiting === 'waiting_to_switch_part1'){
        switchRespA = message.content;

        if(dinSchArry.includes(switchRespA)){
            tempDinSch = dinSchArry.slice();
            var remIndex = tempDinSch.indexOf(switchRespA);
            tempDinSch.splice(remIndex, 1);

            const tempScheduleResp = tempDinSch.join('\n');

            await message.channel.send(`Who is switching with ${switchRespA}?\n\n**DinDin Schedule**\n${tempScheduleResp}`);
            userStates.set(userId, 'waiting_to_switch_part2');
        } else {
            await message.channel.send(`${switchRespA} is not someone on the schedule. Try again.\n\n**DinDin Schedule**\n${tempScheduleResp}`);
        }

    } else if (addWaiting === 'waiting_to_switch_part2'){
        const switchRespB = message.content;

        if(tempDinSch.includes(switchRespB)){
            var switchIndexA = dinSchArry.indexOf(switchRespA);
            var switchIndexB = dinSchArry.indexOf(switchRespB);

            [dinSchArry[switchIndexA], dinSchArry[switchIndexB]] = [dinSchArry[switchIndexB], dinSchArry[switchIndexA]];

            const scheduleResp = dinSchArry.join('\n');

            await message.channel.send(`${switchRespA} will be swapped with ${switchRespB}!\n\n**DinDin Schedule**\n${scheduleResp}`);

            userStates.delete(userId);
            return;
        } else {
            await message.channel.send(`${switchRespB} is not someone on the schedule. Try again.`);
        }
        
     }

     //To the end of the line
     if (message.content == "!progress"){
        let firstPerson =  dinSchArry.shift();
        dinSchArry.push(firstPerson);

        const scheduleResp = dinSchArry.join('\n');

        message.channel.send(`The first person has been moved to the end of the list.\n\n**DinDin Schedule**\n${scheduleResp}`);
     }
});

client.login(process.env.TOKEN);