import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Extract all contact information from the uploaded production call sheet.

This includes:
- Crew members
- Cast members
- Production staff
- Emergency contacts
- Locations with phone numbers

Ignore schedules, scenes, weather, and logistics unless they include contact details.

Return the extracted data in the following JSON structure:
{
  "production_info": {
    "title": string | null,
    "production_company": string | null,
    "shoot_date": string | null
  },
  "contacts": [
    {
      "name": string,
      "role": string | null,
      "department": string | null,
      "phone": string | null,
      "email": string | null,
      "notes": string | null
    }
  ],
  "emergency_contacts": [
    {
      "type": string,
      "name": string | null,
      "phone": string | null
    }
  ],
  "locations": [
    {
      "name": string | null,
      "address": string | null,
      "phone": string | null
    }
  ]
}

Normalization rules:
- Convert all phone numbers to international format if country code is visible
- Remove duplicate contacts
- Merge contacts with the same name and phone number
- Capitalize names properly
- Trim extra whitespace
- If multiple phone numbers exist, store the primary one in "phone" and others in "notes"

Output ONLY valid JSON.
Do NOT include explanations, markdown, or commentary.
If no contacts are found, return empty arrays.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, documentType } = await req.json();

    if (!documentContent) {
      return new Response(
        JSON.stringify({ error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing document for contact extraction...');
    console.log('Document type:', documentType || 'text');
    console.log('Content length:', documentContent.length);

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Handle different document types
    if (documentType === 'image' && documentContent.startsWith('data:image')) {
      // For image content, use vision capabilities
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: documentContent,
              detail: 'high'
            }
          },
          {
            type: 'text',
            text: 'Extract all contact information from this call sheet image.'
          }
        ]
      });
    } else {
      // For text content
      messages.push({
        role: 'user',
        content: `Extract all contact information from this call sheet:\n\n${documentContent}`
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse the JSON response
    let extractedData;
    try {
      // Clean up potential markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Content was:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse extracted data',
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted contacts:', extractedData.contacts?.length || 0);

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-contacts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
