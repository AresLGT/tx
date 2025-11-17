document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready(); tg.expand();

    const list = document.getElementById('orders-list');
    const currentJobDiv = document.getElementById('current-job');
    const driverId = tg.initDataUnsafe?.user?.id;
    
    let myOrderId = null; // Тут зберігаємо ID взятого замовлення

    if (!driverId) return list.innerText = 'Помилка: немає ID водія.';

    // Функція оновлення списку (Short Polling)
    function updateOrders() {
        fetch('/get-orders')
            .then(r => r.json())
            .then(orders => {
                list.innerHTML = '';
                if (orders.length === 0) list.innerText = 'Немає нових замовлень...';
                
                orders.forEach(o => {
                    // Якщо ми вже взяли це замовлення, не показувати його в списку нових
                    if (o.id == myOrderId) return;

                    const div = document.createElement('div');
                    div.className = 'card';
                    div.innerHTML = `
                        <p><strong>Звідки:</strong> ${o.fromAddress}</p>
                        <p><strong>Куди:</strong> ${o.toAddress}</p>
                        <button class="btn" onclick="takeOrder(${o.id}, '${o.fromAddress}', '${o.toAddress}')">Прийняти</button>
                    `;
                    list.appendChild(div);
                });
            });
    }

    // Глобальна функція для кнопки "Прийняти"
    window.takeOrder = (id, from, to) => {
        if (myOrderId) return tg.showAlert('Ви вже маєте активне замовлення!');

        fetch('/accept-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id, driverId })
        })
        .then(r => r.json())
        .then(res => {
            if (res.message === 'Success') {
                myOrderId = id;
                tg.HapticFeedback.notificationOccurred('success');
                
                // Відображаємо зверху як активне
                currentJobDiv.innerHTML = `
                    <div class="card active-order">
                        <div style="text-align:center; font-weight:bold; color:green; margin-bottom:10px;">✅ ВИКОНУЄТЬСЯ ВАМИ</div>
                        <p><strong>Звідки:</strong> ${from}</p>
                        <p><strong>Куди:</strong> ${to}</p>
                    </div>
                `;
                updateOrders(); // Оновлюємо список, щоб прибрати його звідти
            } else {
                tg.showAlert(res.message);
                updateOrders();
            }
        });
    };

    // Запуск автооновлення кожні 2 секунди
    setInterval(updateOrders, 2000);
    updateOrders();
});