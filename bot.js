const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');


const telegramToken = 'Bot_token_token';
const openWeatherApiKey = 'Your_API';
const privatBankApiUrl = 'https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5'; 
const monobankApiUrl = 'https://api.monobank.ua/bank/currency';

const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the Weather Forecast Bot!');

  
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: 'Weather forecast in Dnipro' }],
        [{ text: 'USD Exchange Rate' }, { text: 'EUR Exchange Rate' }],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Choose an option:', keyboard);
});

bot.onText(/USD Exchange Rate/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const response = await axios.get(privatBankApiUrl);
    const usdRate = response.data.find((currency) => currency.ccy === 'USD');
    const message = `USD Exchange Rate: ${usdRate.buy} (Buy) / ${usdRate.sale} (Sale) UAH`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching USD exchange rate:', error);
    bot.sendMessage(chatId, 'Error fetching USD exchange rate. Please try again later.');
  }
});

bot.onText(/EUR Exchange Rate/, async (msg) => {
  const chatId = msg.chat.id;

  
  const currentTime = Math.floor(Date.now() / 1000);
  if (lastMonobankRequestTime && currentTime - lastMonobankRequestTime < 60) {
    bot.sendMessage(chatId, 'Please wait a moment before checking the EUR exchange rate again.');
    return;
  }

  try {
    const response = await axios.get(monobankApiUrl);
    const eurRate = response.data.find((currency) => currency.currencyCodeA === 978 && currency.currencyCodeB === 980);
    const message = `EUR Exchange Rate: ${eurRate.rateBuy} (Buy) / ${eurRate.rateSell} (Sale) UAH`;

    bot.sendMessage(chatId, message);

    
    lastMonobankRequestTime = currentTime;
  } catch (error) {
    console.error('Error fetching EUR exchange rate:', error);
    bot.sendMessage(chatId, 'Error fetching EUR exchange rate. Please try again later.');
  }
});
let lastMonobankRequestTime;

bot.onText(/Weather forecast in Dnipro/, (msg) => {
  const chatId = msg.chat.id;

  
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: 'With a 3-hour interval' }],
        [{ text: 'With a 6-hour interval' }],
        [{ text: 'Previous menu' }],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Choose an interval:', keyboard);
});

bot.onText(/Previous menu/, (msg) => {
  const chatId = msg.chat.id;

  
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: 'Weather forecast in Dnipro' }],
        [{ text: 'USD Exchange Rate' }, { text: 'EUR Exchange Rate' }],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Choose an option:', keyboard);
});

bot.onText(/With a (\d+)-hour interval/, async (msg, match) => {
  const chatId = msg.chat.id;
  const interval = parseInt(match[1]);

  
  const lat = 48.4647;
  const lon = 35.0462;

  
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`;

  try {
    const response = await axios.get(apiUrl);
    const forecasts = response.data.list;

    
    const filteredForecasts = forecasts.filter(
      (_, index) => index % (interval / 3) === 0
    );

    
    let message = "";
    filteredForecasts.forEach((forecast) => {
      const date = new Date(forecast.dt * 1000);
      const temperature = (forecast.main.temp - 273.15).toFixed(1);
      const description = forecast.weather[0].description;

      message += `\n\n\nDate: ${date.toLocaleString()}\nTemperature: ${temperature}°C\nDescription: ${description}`;
      
    });
    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    bot.sendMessage(chatId, 'Error fetching weather data. Please try again later.');
  }
});

