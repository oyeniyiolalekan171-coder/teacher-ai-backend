export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
        error: data.error?.message || "Gemini request failed"
      });
    }

    let output = "";

    if (data.steps) {
      for (const step of data.steps) {
        if (step.type === "model_output" && step.content) {
          for (const item of step.content) {
            if (item.type === "text" && item.text) {
              output += item.text;
            }
          }
        }
      }
    }

    return res.status(200).json({
      output: output || "Gemini returned an empty response."
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
