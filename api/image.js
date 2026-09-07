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
        error: "Image prompt is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing from Vercel."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          model: "gemini-3.1-flash-image",

          input: prompt,

          response_format: {
            type: "image",
            aspect_ratio: "4:3",
            image_size: "1K"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Image generation failed"
      });
    }

    let imageData = null;
    let mimeType = "image/png";

    if (data.steps) {

      for (const step of data.steps) {

        if (
          step.type === "model_output" &&
          step.content
        ) {

          for (const item of step.content) {

            if (
              item.type === "image" &&
              item.data
            ) {

              imageData = item.data;

              mimeType =
                item.mime_type ||
                "image/png";

              break;
            }

          }

        }

        if (imageData) break;
      }
    }

    if (!imageData) {
      return res.status(500).json({
        error: "Gemini did not return an image."
      });
    }

    return res.status(200).json({

      image:
        "data:" +
        mimeType +
        ";base64," +
        imageData

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Image server error"
    });

  }
          }
