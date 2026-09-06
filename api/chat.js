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

    return res.status(200).json({
      output: "POST REQUEST WORKS! Teacher AI is connected.",
      received_prompt: prompt || "No prompt received"
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });
  }
}
