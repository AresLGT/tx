document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready(); tg.expand();

    const form = document.getElementById('order-form');
    const status = document.getElementById('status');
    const btn = document.getElementById('submit-order');
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) return status.innerText = 'Помилка: немає ID.';

    btn.addEventListener('click', () => {
        const from = document.getElementById('from-address').value;
        const to = document.getElementById('to-address').value;
        if (!from || !to) return tg.showAlert('Введіть адреси!');

        btn.disabled = true;
        btn.innerText = 'Замовлення...';

        fetch('/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fromAddress: from, toAddress: to })
        })
        .then(r => r.json())
        .then(data => {
            form.style.display = 'none';
            status.innerHTML = '<h2>🔍 Шукаємо водія...</h2><p>Будь ласка, зачекайте.</p>';
            
            // Запускаємо перевірку статусу кожні 2 сек
            const interval = setInterval(() => {
                fetch(`/check-order/${data.orderId}`)
                    .then(r => r.json())
                    .then(res => {
                        if (res.status === 'accepted') {
                            clearInterval(interval);
                            tg.HapticFeedback.notificationOccurred('success');
                            status.innerHTML = '<h1 style="font-size:50px">✅</h1><h2>Водія знайдено!</h2><p style="color:green; font-weight:bold">Очікуйте 5-10 хв.</p>';
                        }
                    });
            }, 2000);
        });
    });
});