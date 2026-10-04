module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const name = String(body.name || '').slice(0, 100);
    const phone = String(body.phone || '').slice(0, 30);
    const message = String(body.message || '').slice(0, 1000);

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone required' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Telegram not configured' });
    }

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    const text =
      '🕯 <b>Новая заявка с сайта</b>\n\n' +
      '👤 <b>Имя:</b> ' + esc(name) + '\n' +
      '📞 <b>Телефон:</b> ' + esc(phone) + '\n' +
      (message ? '💬 <b>Сообщение:</b> ' + esc(message) + '\n' : '') +
      '\n<i>' + now + '</i>';

    const tg = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!tg.ok) {
      const errText = await tg.text();
      console.error('Telegram error:', errText);
      return res.status(500).json({ error: 'Telegram send failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Handler error:', e);
    return res.status(500).json({ error: e.message });
  }
};