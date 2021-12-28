const TeleBot = require('telebot');
const axios = require('axios');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

const bot = new TeleBot(process.env.BOT_KEY);

const userList = [];

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

const numbersMatrix = [
    [2,4,14,17,21,31],
    [14,23,28,33,40,41],
    [19,21,34,36,38,41],
    [7,12,13,14,21,60],
    [1,13,17,26,28,49],
    [7,13,22,34,42,58],
    [9,11,16,29,37,41],
    [5,7,17,23,37,55],
    [7,13,23,29,41,50],
    [6,10,19,20,27,60],
    [2,5,11,26,51,60],
    [4,16,27,47,56,60],
    [17,22,31,36,57,60],
    [18,26,36,38,55,59],
    [6,7,12,16,21,48],
    [7,18,26,30,40,42],
];

bot.on('/meesquece', (msg) => {
    const index = userList.indexOf(msg.from.id);
    if (index !== -1) {
        userList.splice(index, 1);
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

bot.on('/meavisa', (msg) => {
    if(!userList.find(user => user === msg.from.id)) {
        userList.push(msg.from.id);
        console.log(userList);
        return bot.sendMessage(msg.from.id, 'Avisarei quando sair o resultado seu fudido.');
    }
    return bot.sendMessage(msg.from.id, 'Já falei que ia avisar vc arrombado!!');
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