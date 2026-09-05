export default async function handler(req, res) {

  // Allow Teacher AI to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Browser preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({
          model: "gemini-3.6-flash",
          input: prompt,
          store: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          data.errors?.[0]?.message ||
          "Gemini request failed"
      });
    }

    let output = "";

    if (data.outputs) {
      for (const item of data.outputs) {
        if (item.type === "text" && item.text) {
          output += item.text;
        }
      }
    }

    return res.status(200).json({
      output:
        output ||
        "No response received from Gemini."
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message ||
        "Server error"
    });
  }
}
