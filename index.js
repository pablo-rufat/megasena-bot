const TeleBot = require('telebot');
const axios = require('axios');
const cron = require('node-cron');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const bot = new TeleBot(process.env.BOT_KEY);

bot.on('/hello', (msg) => {
    return bot.sendMessage(msg.from.id, `E ai arrombado, ${ msg.from.first_name }!`);
});

const sendError = (msg, text) => bot.sendMessage(msg.from.id, `${ msg.from.first_name }, ${text}`);

const compare = (arr1, arr2) => arr1.reduce((a, c) => a + arr2.includes(c), 0);

const getResponseMessage = (resp, acertos) => {
    switch(acertos) {
        case 6:
            const sena = resp.data.premiacoes[0];
            return `Para o sorteio do ${resp.data.data} vc ganhou ${sena.premio} reais ANIMAAAAAAAALLLLLLLL!!!!`;
        case 5:
            const quina = resp.data.premiacoes[1];
            return `Para o sorteio do ${resp.data.data} vc ganhou ${quina.premio} reais caraiooooooo!!!!`;
        case 4:
            const quadra = resp.data.premiacoes[2];
            return `Para o sorteio do ${resp.data.data} vc ganhou ${quadra.premio} reais. It's something.`;
        default:
            return `Para o sorteio do ${resp.data.data} vc ganhou porra nenhuma huehuehuehue`;
    }
};

let rawApostas = fs.readFileSync('apostas.json');
const numbersMatrix = JSON.parse(rawApostas);

bot.on('/meesquece', (msg) => {

    let rawUserList = fs.readFileSync('userList.json');
    const userList = JSON.parse(rawUserList);

    const index = userList.indexOf(msg.from.id);
    if (index !== -1) {
        userList.splice(index, 1);
        const data = JSON.stringify(userList);
        fs.writeFileSync('userList.json', data);
        return bot.sendMessage(msg.from.id, 'Ta bom po. Já não aviso.');
    }
    
    return bot.sendMessage(msg.from.id, 'Nem tava lembrando de vc kkkkkkarrombado');
});

cron.schedule('0 * * * *', async () => {
    const resultado = await axios.get('https://loteriascaixa-api.herokuapp.com/api/mega-sena/latest');
    const numericos = [2, 8, 34, 38, 47, 51];

    if(resultado.data.data === '31/12/2021'){

        const resultadosNumber = resultado.data.dezenas.map(item => parseInt(item, 10));
        const acertosList = [];
        numbersMatrix.forEach(aposta => {
            acertosList.push(compare(aposta, resultadosNumber));
        });

        console.log(acertosList);

        let rawUserList = fs.readFileSync('userList.json');
        const userList = JSON.parse(rawUserList);

        userList.forEach(user => {
            const messages = [];
            acertosList.forEach(acerto => {
                if (acerto > 3) {
                    messages.push(getResponseMessage(resultado, acerto));
                }
            });

            if (messages.length === 0) {
                bot.sendMessage(user, `Para o sorteio do ${resultado.data.data} vc ganhou porra nenhuma huehuehuehue`);
            }

            messages.forEach(message => {
                bot.sendMessage(user, message);
            });
        });
    }
});

const addToList = (msg) => {
    let rawUserList = fs.readFileSync('userList.json');
    const userList = JSON.parse(rawUserList);

    if(!userList.find(user => user === msg.from.id)) {
        userList.push(msg.from.id);

        const data = JSON.stringify(userList);
        fs.writeFileSync('userList.json', data);

        return bot.sendMessage(msg.from.id, 'Avisarei quando sair o resultado seu fudido.');
    }
    return bot.sendMessage(msg.from.id, 'Já falei que ia avisar vc arrombado!!');
};

bot.on('/start', (msg) => {
    return addToList(msg);
});

bot.on('/meavisa', (msg) => {
    return addToList(msg);
});

bot.on('/ganhei', async (msg) => {
    const stringNumbers = msg.text.replace('/ganhei', '').trim();
    let arrayNumbers;

    try {
        arrayNumbers = stringNumbers.split(',').map(item => parseInt(item, 10));

        if (arrayNumbers.length !== 6) {
            return sendError(msg, 'mandou mais de 6 numeros seu animal!');
        }

        if (arrayNumbers.find(num => num > 60 || num < 0)) {
            return sendError(msg, 'os numeros tem que ser entre 0 e 60. Vc só pode ser QA...');
        }

        if (new Set(arrayNumbers).size !== arrayNumbers.length) {
            return sendError(msg, 'não pode repetir numeros seu filho de uma égua.');
        }

        let responseMessage = '';

        await axios.get('https://loteriascaixa-api.herokuapp.com/api/mega-sena/latest').then(resp => {

            const resultadosNumber = resp.data.dezenas.map(item => parseInt(item, 10));
            const acertos = compare(arrayNumbers, resultadosNumber);

            responseMessage = getResponseMessage(resp, acertos);
        });

        return bot.sendMessage(msg.from.id, responseMessage);

    } catch(e) {
        console.error(e);
        return sendError('deu pau');
    }
});

bot.start();