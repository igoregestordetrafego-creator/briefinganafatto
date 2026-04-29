module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DB_ID;

  if (!TOKEN || !DB_ID) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas.' });
  }

  const { bodyText } = req.body;

  const payload = {
    parent: { database_id: DB_ID },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: 'Briefing — Site Ana Fatto Concursos' } }]
      }
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: bodyText.slice(0, 2000) } }] }
      },
      ...(bodyText.length > 2000 ? [{
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: bodyText.slice(2000, 4000) } }] }
      }] : [])
    ]
  };

  try {
    const https = require('https');
    const postData = JSON.stringify(payload);

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.notion.com',
        path: '/v1/pages',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('Invalid JSON response')); }
        });
      });

      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    if (result.object === 'page') {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: result.message || 'Erro ao criar página.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
