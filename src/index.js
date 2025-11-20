require('dotenv').config();
const cron = require('../node_modules/node-cron');
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
const dinSchArry = ['TestUser1', 'TestUser2'];

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

startDate = '11/17/2025';

dinSchDates = generateDatesArray(startDate, dinSchArry.length);

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


client.on('ready', (c) => {
    console.log('the bot is ready');
});

client.on('messageCreate', async (message) =>{
    if (message.author.bot){
        return;
    ;}

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

function isEveryOtherTuesday(date) {
    const datAfterDate = dayAfter instanceof Date ? dayAfter : new Date(dayAfter);

    const diffTime = Math.abs(date - dayAfterDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays % 14 === 0 || diffDays % 14 === 1;
}

function scheduleUpdate(){
    let firstPerson = dinSchArry.shift();
    dinSchArry.push(firstPerson);
    dinSchDates = addDaysToDates(dinSchDates, 14);

    const startDateDate = new Date(startDate);
    const newStartDate = addTwoWeeks(startDateDate);

    //change startDate and dayAfter
    startDate = `${newStartDate.getMonth() + 1}/${newStartDate.getDate()}/${newStartDate.getFullYear()}`;
    dayAfter = addOneDay(newStartDate);

    scheduleResp = pairNamesWithDates(dinSchArry, dinSchDates);
    console.log(scheduleResp);
}

cron.schedule('0 0 * * 2', async () => {
    const now = new Date();
    const centralTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)); // Convert to Central Time

    if (isEveryOtherTuesday(centralTime)) {
        scheduleUpdate();
    } else {
        console.log('Was not an every other Tuesday');
    }
});

if (process.argv.includes('--run-now')) {
        scheduleUpdate();
}