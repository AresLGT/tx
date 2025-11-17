// server.js
require('./bot.js'); // <--- ДОДАЙТЕ ЦЕЙ РЯДОК НА ПОЧАТОК!

const express = require('express');
// ... решта коду без змін ...
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = 'token bot'; // ❗️ ТОКЕН
const bot = new TelegramBot(TOKEN);
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let orderCounter = 1;
const activeOrders = []; 

app.post('/order', (req, res) => {
    const { userId, fromAddress, toAddress } = req.body;
    const newOrder = {
        id: orderCounter++,
        userId: String(userId),
        fromAddress,
        toAddress,
        status: 'pending', 
        driverId: null
    };
    activeOrders.push(newOrder);
    res.status(201).json({ orderId: newOrder.id });
});

app.get('/get-orders', (req, res) => {
    // Віддаємо тільки вільні замовлення
    res.status(200).json(activeOrders.filter(o => o.status === 'pending'));
});

app.get('/check-order/:id', (req, res) => {
    const order = activeOrders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.status(404).json({ status: 'not_found' });
    res.json({ status: order.status });
});

app.post('/accept-order', (req, res) => {
    const { orderId, driverId } = req.body;
    const order = activeOrders.find(o => o.id === parseInt(orderId));

    if (!order || order.status !== 'pending') {
        return res.status(400).json({ message: 'Замовлення вже зайняте' });
    }

    order.status = 'accepted';
    order.driverId = driverId;

    // Сповіщення клієнту в чат
    bot.sendMessage(order.userId, `✅ Водія знайдено!\nМаршрут: ${order.fromAddress} -> ${order.toAddress}\nОчікуйте 5-10 хв.`).catch(console.error);

    res.json({ message: 'Success' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));