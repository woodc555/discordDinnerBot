require('dotenv').config();
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const cron = require('../node_modules/node-cron');
const {Client, GatewayIntentBits, Collection} = require('discord.js');

// Prefer IPv4. Docker hosts often fail Discord's WebSocket over IPv6.
dns.setDefaultResultOrder('ipv4first');

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
let scheduleChannel = null;
const scheduleFilePath = process.env.SCHEDULE_FILE || path.join(process.cwd(), 'data', 'schedule.json');
console.log('Schedule file path:', scheduleFilePath);
console.log('Working directory:', process.cwd());
console.log('Script directory:', __dirname);

//Create the array list of dates
function generateDatesArray (startDate, length){
    const dates = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < length; i++){
        const month = currentDate.toLocaleString('en-US', { month: 'short' });
        const day = currentDate.getDate();

        dates.push(`${month} ${day}`);
        currentDate.setDate(currentDate.getDate() + 14);
    };

    return dates;
};

//Adding 14 days to the dates array
function addDaysToDates(datesArray, daysToAdd) {
    return datesArray.map(dateStr => {
        const startDateObj = new Date(startDate);
        const baseYear = startDateObj.getFullYear();
        const month = getMonthNumber(dateStr);
        const day = getDayNumber(dateStr);

        let date = new Date(`${month}/${day}/${baseYear}`);

        date.setDate(date.getDate() + daysToAdd);

        return formatDate(date);
    });
}

function getMonthNumber(dateStr) {
    const monthMap = {
        'Jan': '01',
        'Feb': '02',
        'Mar': '03',
        'Apr': '04',
        'May': '05',
        'Jun': '06',
        'Jul': '07',
        'Aug': '08',
        'Sep': '09',
        'Oct': '10',
        'Nov': '11',
        'Dec': '12'
    };
    return monthMap[dateStr.split(' ')[0]];
}

function getDayNumber(dateStr) {
    return dateStr.split(' ')[1].padStart(2, '0');
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function loadSchedule() {
    try {
        const fileContents = fs.readFileSync(scheduleFilePath, 'utf8');
        const saved = JSON.parse(fileContents);

        if (Array.isArray(saved.names) && saved.names.length > 0 && typeof saved.startDate === 'string') {
            console.log(`Loaded schedule from ${scheduleFilePath}: ${saved.names.join(', ')}`);
            return {
                names: saved.names,
                startDate: saved.startDate,
            };
        }
    } catch (error) {
        console.log(`No saved schedule found at ${scheduleFilePath}, using defaults.`);
    }

    return {
        names: ['TestUser1', 'TestUser2'],
        startDate: '11/17/2025',
    };
}

function saveSchedule() {
    const dataToSave = {
        names: dinSchArry,
        startDate: startDate,
    };

    try {
        fs.mkdirSync(path.dirname(scheduleFilePath), { recursive: true });
        fs.writeFileSync(scheduleFilePath, JSON.stringify(dataToSave, null, 2));
        console.log(`Saved schedule to ${scheduleFilePath}: ${dinSchArry.join(', ')}`);
    } catch (error) {
        console.error(`Failed to save schedule to ${scheduleFilePath}:`, error);
        throw error;
    }
}

const savedSchedule = loadSchedule();
let dinSchArry = savedSchedule.names;
let startDate = savedSchedule.startDate;
let dinSchDates = generateDatesArray(startDate, dinSchArry.length);

//Pairing Names with Dates
function pairNamesWithDates(namesArray, datesArray) {
    if (namesArray.length !== datesArray.length) {
        throw new Error('Arrays must have the same length');
    }

    const pairedString = namesArray.map((name, index) => {
        return `${name} - ${datesArray[index]}`;
    }).join('\n');

    return pairedString;
};

//Date Fomat Validation
const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

function isValidDate(dateString) {
    if (!dateRegex.test(dateString)) return false;

    const [month, day, year] = dateString.split('/').map(Number);

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
}

//Add days to start date
function addOneDay(date) {
    // Create a new Date object to avoid mutating the original date
    const newDate = new Date(date);
    
    // Add one day (24 hours) to the date
    newDate.setDate(newDate.getDate() + 1);
    
    return newDate;
}

function addTwoWeeks(date) {
    // Create a new Date object to avoid mutating the original date
    const newDate = new Date(date);
    
    // Add one day (24 hours) to the date
    newDate.setDate(newDate.getDate() + 14);
    
    return newDate;
}

dayAfter = addOneDay(new Date(startDate));


client.on('ready', async (c) => {
    console.log(`the bot is ready as ${c.user.tag} in ${c.guilds.cache.size} server(s)`);

    await c.user.setPresence({ status: 'online' });

    for (const guild of client.guilds.cache.values()) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
            scheduleChannel = channel;
            console.log('Schedule channel found:', scheduleChannel.name);
            break;
        }
    }
    
    if (!scheduleChannel) {
        console.error('Could not find schedule channel. It will be stored when first message is received.');
    }
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
    console.warn('Discord client warning:', warning);
});

client.on('shardDisconnect', (event, shardId) => {
    console.error(`Disconnected from Discord (shard ${shardId}):`, event.code, event.reason);
});

client.on('shardReconnecting', (shardId) => {
    console.log(`Reconnecting to Discord (shard ${shardId})...`);
});

client.on('messageCreate', async (message) =>{
    if (message.author.bot){
        return;
    ;}

    console.log(`Message from ${message.author.username}: "${message.content}"`);

    if (!scheduleChannel) {
        if (String(message.channel.id) === String(channelId)) {
            scheduleChannel = message.channel;
            //console.log('Schedule channel stored from message:', scheduleChannel.name, 'ID:', scheduleChannel.id);
        }
    }

    const userId = message.author.id;
    const addWaiting = userStates.get(userId);

    //List of Commands
    if (message.content == "!botCommands"){
        message.channel.send("View Din Din Schedule: **!din**\n\nAdd To Schedule: **!addToSch**\n\nRemove From Schedule: **!remFromSch**\n\nSwitch With Someone: **!switchDuties**\n\nProgress the Schedule: **!progress**\n\nSet the First Date: **!dateToSet**");
    }

     //Checking Schedule
     if (message.content == '!din'){
        //const scheduleResp = dinSchArry.join('\n');
        const scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

        message.channel.send(`**DinDin Duties:**\n${scheduleResp}`);
    }

    //Addding People to Schedule
    if (message.content == '!addToSch'){
        await message.channel.send('Who would you like to Add? Please only type their name.');

        userStates.set(userId, 'waiting_to_add');
    };

    if (addWaiting === 'waiting_to_add'){
        const addResponse = message.content;

        const namesToAdd = addResponse.split(',').map(name => name.trim()).filter(name => name.length > 0);

        if (namesToAdd.length === 0){
            await message.channel.send('No names were provided. Please try again.');
            userStates.delete(userId);
            return;
        }

        namesToAdd.forEach(name => {
            dinSchArry.push(name);
        });

        dinSchDates = generateDatesArray(startDate, dinSchArry.length);
        saveSchedule();
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

        const addedNamesList = namesToAdd.map(name => `"${name}"`).join(', ');
        await message.channel.send(`You have added: ${addedNamesList} to the DinDin Schedule.\n\n**DinDin Schedule**\n${scheduleResp}`);

        userStates.delete(userId);
        return;
    }

    //Removing People from Schedule
    if (message.content == '!remFromSch'){
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);
        await message.channel.send(`Who would you like to remove? You can remove multiple people by separating names with commas (e.g., "Name1, Name2, Name3"). Please type their names exactly as you see them.\n\n**DinDin Schedule**\n${scheduleResp}`);
        userStates.set(userId, 'waiting_to_remove');
    };

    if (addWaiting === 'waiting_to_remove'){
        const removeResponse = message.content;
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

        const namesToRemove = removeResponse.split(',').map(name => name.trim()).filter(name => name.length > 0);

        if (namesToRemove.length === 0){
            await message.channel.send('No names were provided. Please try again.')
            userStates.delete(userId);
            return;
        }

        const removedNames = [];
        const notFoundNames = [];

        namesToRemove.forEach(name => {
            if (dinSchArry.includes(name)){
                if (dinSchArry.length === 1){
                    notFoundNames.push(`${name} cannot be removed, you must keep at least one user in the schedule.`);
                } else {
                    var remIndex = dinSchArry.indexOf(name);
                    dinSchArry.splice(remIndex, 1);
                    removedNames.push(name);
                }
            } else {
                notFoundNames.push(name);
            }
        });

        dinSchDates = generateDatesArray(startDate, dinSchArry.length);
        if (removedNames.length > 0) {
            saveSchedule();
        }
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

        let responseMessage = '';
        if (removedNames.length > 0){
            const removedList = removedNames.map(name => `"${name}"`).join(', ');
            responseMessage += `You have removed: ${removedList} from the DinDin Schedule.\n\n`;
        }
        if (notFoundNames.length > 0){
            const notFoundList = notFoundNames.map(name => `"${name}"`).join(', ');
            responseMessage += `The following names were not found in the schedule: ${notFoundList}.\n\n`;
        }
        responseMessage += `**DinDin Schedule**\n${scheduleResp}`;

        await message.channel.send(responseMessage);

        userStates.delete(userId);
        return;
    }

    //Switching Positions in Schedule
    if (message.content == '!switchDuties'){
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);
        await message.channel.send(`Which two people would you like to switch?\n\n**DinDin Schedule**\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_switch_part1');
    }

    if (addWaiting === 'waiting_to_switch_part1'){
        switchRespA = message.content;

        if(dinSchArry.includes(switchRespA)){
            tempDinSch = dinSchArry.slice();
            var remIndex = tempDinSch.indexOf(switchRespA);
            tempDinSch.splice(remIndex, 1);

            tempStartDate = dinSchDates[1];

            tempDinDates = generateDatesArray(tempStartDate, tempDinSch.length);

            //const tempScheduleResp = tempDinSch.join('\n');
            tempScheduleResp = pairNamesWithDates(tempDinSch, tempDinDates);

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

            saveSchedule();
            scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

            await message.channel.send(`${switchRespA} will be swapped with ${switchRespB}!\n\n**DinDin Schedule**\n${scheduleResp}`);

            userStates.delete(userId);
            return;
        } else {
            await message.channel.send(`${switchRespB} is not someone on the schedule. Try again.`);
        }
        
     }

     //Person the end of the line
     if (message.content == "!progress"){
        let firstPerson =  dinSchArry.shift();
        dinSchArry.push(firstPerson);
        dinSchDates = addDaysToDates(dinSchDates, 14);

        const startDateDate = new Date(startDate);
        const newStartDate = addTwoWeeks(startDateDate);
        startDate = `${newStartDate.getMonth() + 1}/${newStartDate.getDate()}/${newStartDate.getFullYear()}`;
        dayAfter = addOneDay(newStartDate);
        saveSchedule();

        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

        message.channel.send(`The first person has been moved to the end of the list.\n\n**DinDin Schedule**\n${scheduleResp}`);
     }

     //Skip a week
     if (message.content == "!skipWeek"){
        dinSchDates = addDaysToDates(dinSchDates, 14);

        const startDateDate = new Date(startDate);
        const newStartDate = addTwoWeeks(startDateDate);
        startDate = `${newStartDate.getMonth() + 1}/${newStartDate.getDate()}/${newStartDate.getFullYear()}`;
        dayAfter = addOneDay(newStartDate);
        saveSchedule();
        
        scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);
        message.channel.send(`**DinDin Schedule:**\n${scheduleResp}`);
     }

     //Set First Week Date
     if (message.content == '!dateToSet'){
        await message.channel.send('Please type in a date in **M/D/YYYY** format.');

        userStates.set(userId, 'waiting_for_date');
    };

    if (addWaiting === 'waiting_for_date'){
        const dateResponse = message.content;
        if (isValidDate(dateResponse)) {
            startDate = dateResponse;
            dayAfter = addOneDay(new Date(startDate));
            dinSchDates = generateDatesArray(startDate, dinSchArry.length);
            saveSchedule();
            scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);
    
            await message.channel.send(`You have set your starting date as ${dateResponse}. This will affect when your schedule will automatically switch. This also will change the schedule, starting with the date you just entered.\n\n**DinDin Schedule**\n${scheduleResp}`);
            
            userStates.delete(userId);
        } else {
            await message.channel.send('The date you entered is invalid. Please use the format **M/D/YYYY** and ensure the date is valid.');
        }
        return;
    }
});

client.login(process.env.TOKEN);

function isEveryOtherTuesday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);

    const targetDate = new Date(startDateObj);
    targetDate.setDate(targetDate.getDate() + 1);

    return today >= targetDate;
}

async function scheduleUpdate() {
    let firstPerson =  dinSchArry.shift();
    dinSchArry.push(firstPerson);

    dinSchDates = addDaysToDates(dinSchDates, 14);

    const startDateDate = new Date(startDate);
    const newStartDate = addTwoWeeks(startDateDate);
    startDate = `${newStartDate.getMonth() + 1}/${newStartDate.getDate()}/${newStartDate.getFullYear()}`;
    dayAfter = addOneDay(newStartDate);
    saveSchedule();

    scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);

    if (scheduleChannel) {
        await scheduleChannel.send(`**DinDin Schedule Updated!**\n\n**DinDin Schedule:**\n${scheduleResp}`);
    }
};

cron.schedule('0 0 * * 2', async () => {
    console.log('Cron job triggered - checking if it\'s time to update...');
    if (isEveryOtherTuesday()) {
        await scheduleUpdate();
        console.log('Schedule updated via cron job');
    } else {
        console.log('Not time to update yet');
    }
});