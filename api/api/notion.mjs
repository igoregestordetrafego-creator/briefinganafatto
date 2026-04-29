export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DB_ID;

  if (!TOKEN || !DB_ID) {
    return new Response(JSON.stringify({ error: 'Variaveis nao configuradas.' }), { status: 500 });
  }

  const { bodyText } = await req.json();

  const payload = {
    parent: { database_id: DB_ID },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: 'Briefing - Site Ana Fatto Concursos' } }]
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

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await notionRes.json();

  if (data.object === 'page') {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: data.message || 'Erro ao criar pagina.' }), {
    status: 400,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  });
}
