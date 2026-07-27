const ALLOWED_ORIGINS = ['https://tizhad.com', 'http://localhost:4200'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const CATEGORIES = [
  'angular', 'react', 'javascript', 'typescript',
  'performance', 'testing', 'accessibility',
  'system_design', 'css', 'soft_skills',
];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'Short, clean subject title for this query' },
    summary: { type: 'STRING', description: 'Plain-English explanation, 3-5 sentences' },
    difficulty: { type: 'STRING', enum: ['Easy', 'Medium', 'Hard'] },
    category: { type: 'STRING', enum: CATEGORIES },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-5 short topic tags' },
    askedBy: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-4 real companies plausibly asking this in interviews' },
    outline: {
      type: 'ARRAY',
      description: '2-4 study sections',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          bullets: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['title', 'bullets'],
      },
    },
    questions: {
      type: 'ARRAY',
      description: '3-5 likely interview questions with answers',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING' },
          a: { type: 'STRING' },
        },
        required: ['q', 'a'],
      },
    },
    snippet: {
      type: 'OBJECT',
      description: 'A short illustrative code example, if relevant to this topic, otherwise omit fields as empty strings',
      properties: {
        lang: { type: 'STRING' },
        code: { type: 'STRING' },
      },
      required: ['lang', 'code'],
    },
  },
  required: ['title', 'summary', 'difficulty', 'category', 'tags', 'askedBy', 'outline', 'questions', 'snippet'],
};

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `You are a technical interview prep assistant. A candidate wants to study: "${query.trim()}".

Produce a study brief for this exact topic: a plain-English summary, a difficulty rating, the single best-fit category, a short outline broken into sections with bullets, several likely interview questions with full answers, companies that plausibly ask about this, and (if the topic has a natural code example) a short code snippet. If there is no natural code example for this topic, return an empty string for both snippet fields.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      throw new Error(`Gemini API returned ${geminiRes.status}`);
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini response had no content');
    }

    const result = JSON.parse(text);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ask-ai error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate study brief' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
