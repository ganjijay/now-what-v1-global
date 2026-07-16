import OpenAI from "openai";

export const runtime = "nodejs";

const LANGUAGE_NAMES = {
  ko: "Korean",
  en: "English",
  es: "Spanish",
  zh: "Simplified Chinese",
  ja: "Japanese",
  vi: "Vietnamese",
  th: "Thai",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ar: "Arabic",
  hi: "Hindi"
};

const replySchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      minLength: 1,
      description:
        "The complete actual reply the user can copy and send"
    },
    translation: {
      type: "string",
      minLength: 1,
      description:
        "The complete meaning of the reply translated into the user's selected result language"
    }
  },
  required: ["reply", "translation"],
  additionalProperties: false
};

function cleanJsonText(value) {
  const text = String(value || "").trim();

  if (text.startsWith("```")) {
    return text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  return text;
}

function extractJsonObject(value) {
  const text = cleanJsonText(value);

  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    return null;
  }
}

async function translateReply(client, model, reply, language) {
  const response = await client.responses.create({
    model,
    reasoning: { effort: "low" },
    instructions: `
Translate the complete supplied message into the requested language.

Rules:
- Return only the translation.
- Do not explain or summarize.
- Do not add advice, labels, or facts.
- Preserve every sentence and the complete meaning.
- The result must contain visible text.
    `,
    input: `TARGET LANGUAGE: ${language}\n\nMESSAGE:\n${reply}`
  });

  return String(response.output_text || "").trim();
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const model = process.env.OPENAI_MODEL || "gpt-5.6";
    const body = await request.json();

    const selectedLanguage =
      LANGUAGE_NAMES[String(body?.language || "en")] || "English";
    const originalLanguage = String(
      body?.originalLanguage || "English"
    ).trim();
    const summary = String(body?.summary || "").trim();
    const action = String(body?.action || "").trim();
    const replyContext = String(body?.replyContext || "").trim();

    const response = await client.responses.create({
      model,
      reasoning: { effort: "low" },
      instructions: `
You create a reply for a global app called "Now What?".

Return exactly two complete values:
1. reply: the actual message the user can copy and send.
2. translation: the exact meaning of the reply in the user's selected result language.

Rules for reply:
- Write in the detected original content language.
- If the original language is unclear, use English.
- Make it immediately sendable.
- Be polite, natural, and appropriate for the situation.
- Do not include labels, explanations, markdown, or quotation marks.
- Do not invent names, ranks, case numbers, dates, attachments, completed actions, or promises.
- Usually use 2 to 6 sentences.

Rules for translation:
- Translate the complete reply.
- Use the user's selected result language.
- Do not summarize, add advice, or add facts.
- Never return an empty translation.
      `,
      input: `
USER SELECTED RESULT LANGUAGE:
${selectedLanguage}

DETECTED ORIGINAL CONTENT LANGUAGE:
${originalLanguage}

SITUATION:
${summary}

MOST IMPORTANT NEXT ACTION:
${action}

WHY A REPLY MAY BE NEEDED:
${replyContext}

Create the sendable reply and its complete translation.
      `.trim(),
      text: {
        format: {
          type: "json_schema",
          name: "now_what_reply_with_translation",
          strict: true,
          schema: replySchema
        }
      }
    });

    let data = extractJsonObject(response.output_text);
    let reply = String(data?.reply || "").trim();
    let translation = String(data?.translation || "").trim();

    // Rare fallback: if structured output is not parseable, create a plain reply.
    if (!reply) {
      const fallbackReply = await client.responses.create({
        model,
        reasoning: { effort: "low" },
        instructions: `
Write only a short, natural, immediately sendable reply.

Rules:
- Use the original content language when clear; otherwise use English.
- Do not add labels, explanations, markdown, or quotation marks.
- Do not invent facts, names, dates, attachments, completed actions, or promises.
- Usually use 2 to 6 sentences.
        `,
        input: `
ORIGINAL LANGUAGE: ${originalLanguage}

SITUATION:
${summary}

NEXT ACTION:
${action}

REPLY CONTEXT:
${replyContext}
        `.trim()
      });

      reply = String(fallbackReply.output_text || "").trim();
    }

    if (!reply) {
      throw new Error("Reply generation returned empty text.");
    }

    if (!translation) {
      translation = await translateReply(
        client,
        model,
        reply,
        selectedLanguage
      );
    }

    if (!translation) {
      throw new Error("Translation generation returned empty text.");
    }

    return Response.json({ reply, translation });
  } catch (error) {
    console.error("REPLY_ERROR", error);

    return Response.json(
      { error: "We could not create a reply right now." },
      { status: 500 }
    );
  }
}
