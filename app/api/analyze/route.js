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

const schema = {
  type: "object",
  properties: {
    original_language: {
      type: "string",
      description: "Primary language detected in the uploaded content"
    },
    what_is_it: {
      type: "string",
      description:
        "A short plain-language explanation in the selected result language"
    },
    action: {
      type: "string",
      description:
        "The single most important next action in the selected result language"
    },
    action_items: {
      type: "array",
      items: { type: "string" },
      description:
        "Ordered action list when more than one real action is needed"
    },
    deadline: {
      type: "string",
      description:
        "Explicit deadline from the source, or a clear statement that no deadline is shown or must be checked"
    },
    reply_status: {
      type: "string",
      enum: ["required", "not_required", "unclear"]
    },
    reply_reason: {
      type: "string",
      description: "Short reason in the selected result language"
    },
    warning: {
      type: "string",
      description:
        "Important uncertainty, missing pages, unreadable content, or high-stakes caution; empty string if none"
    }
  },
  required: [
    "original_language",
    "what_is_it",
    "action",
    "action_items",
    "deadline",
    "reply_status",
    "reply_reason",
    "warning"
  ],
  additionalProperties: false
};

function toDataUrl(buffer, type) {
  return `data:${type};base64,${buffer.toString("base64")}`;
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

    const formData = await request.formData();
    const languageCode = String(formData.get("language") || "en");
    const resultLanguage =
      LANGUAGE_NAMES[languageCode] || "English";
    const directText = String(formData.get("text") || "").trim();
    const uploadedFiles = formData
      .getAll("files")
      .filter(
        (item) =>
          item && typeof item.arrayBuffer === "function"
      );

    if (!directText && uploadedFiles.length === 0) {
      return Response.json(
        { error: "Please add a photo, PDF, or text." },
        { status: 400 }
      );
    }

    if (uploadedFiles.length > 6) {
      return Response.json(
        { error: "You can upload up to 6 files." },
        { status: 400 }
      );
    }

    const content = [
      {
        type: "input_text",
        text: `
Analyze all supplied content together as one situation or document set.

The user's selected result language is:
${resultLanguage}

Return every user-facing field except original_language in ${resultLanguage}.

Directly entered text, if any:
${directText || "(none)"}
        `.trim()
      }
    ];

    for (const file of uploadedFiles) {
      if (file.size > 12 * 1024 * 1024) {
        return Response.json(
          {
            error: `${file.name} is too large. Keep each file under 12 MB.`
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType =
        file.type || "application/octet-stream";

      if (mimeType.startsWith("image/")) {
        content.push({
          type: "input_image",
          image_url: toDataUrl(buffer, mimeType),
          detail: "high"
        });
      } else if (mimeType === "application/pdf") {
        content.push({
          type: "input_file",
          filename: file.name || "document.pdf",
          file_data: toDataUrl(buffer, "application/pdf")
        });
      } else {
        return Response.json(
          { error: `Unsupported file type: ${file.name}` },
          { status: 400 }
        );
      }
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      reasoning: { effort: "low" },
      instructions: `
You are the analysis engine for a global app called "Now What?".

The user received a message, screenshot, email, letter, notice, or PDF they do not fully understand.

Your job is NOT to provide a long translation.

Answer:
1. What is this?
2. What should the user do now?
3. By when?
4. Does the user need to reply?

Rules:
- Analyze every uploaded page and image together.
- Do not invent facts, deadlines, approvals, rejections, legal meanings, required documents, submission channels, phone numbers, addresses, or websites.
- State a definite deadline only when it is explicitly shown.
- If a date is ambiguous, say it must be checked.
- If pages appear missing or text is unreadable, explain that in warning.
- If content is informational only, reply_status may be not_required.
- If the sender asks a direct question, requests confirmation, asks for documents, or expects a response, reply_status should usually be required.
- For legal, immigration, government benefits, medical, insurance, tax, or military content, clearly distinguish the document's explicit words from interpretation.
- Keep user-facing language simple, short, calm, and practical.
- action must contain the single highest-priority next step.
- If multiple separate actions are required, put them in action_items in order.
- If only one action is needed, action_items must be empty.
- If no action is needed, clearly state that no immediate action is required.
- Do not output a full translation unless needed to explain the next action.
      `,
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "now_what_analysis",
          strict: true,
          schema
        }
      }
    });

    return Response.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("ANALYZE_ERROR", error);

    return Response.json(
      { error: "We could not analyze this content right now." },
      { status: 500 }
    );
  }
}
