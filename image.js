export default async function handler(req, res) {

  // Allow the Teacher AI frontend to call this API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Handle browser preflight request
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
            mime_type: "image/png",
            aspect_ratio: "4:3",
            image_size: "1K"
          }

        })
      }
    );

    const data = await response.json();

    // Gemini API returned an error
    if (!response.ok) {

      console.error(
        "Gemini image error:",
        data
      );

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Gemini image generation failed."
      });
    }


    // Current Gemini response format
    if (
      data.output_image &&
      data.output_image.data
    ) {

      const mimeType =
        data.output_image.mime_type ||
        "image/png";

      return res.status(200).json({

        image:
          "data:" +
          mimeType +
          ";base64," +
          data.output_image.data

      });
    }


    // Backup: check the steps array
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

              const mimeType =
                item.mime_type ||
                "image/png";

              return res.status(200).json({

                image:
                  "data:" +
                  mimeType +
                  ";base64," +
                  item.data

              });
            }
          }
        }
      }
    }


    // No image was found
    console.error(
      "Gemini response did not contain an image:",
      data
    );

    return res.status(500).json({
      error: "Gemini did not return an image."
    });


  } catch (error) {

    console.error(
      "Image server error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Image server error."
    });

  }

}
