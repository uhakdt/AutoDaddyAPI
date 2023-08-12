import axios from "axios";

const GetGPTResponse = async (conversation) => {
  const apiKey = process.env["OPENAI_API_KEY"];

  const client = axios.create({
    headers: {
      Authorization: "Bearer " + apiKey,
    },
  });

  const params = {
    messages: conversation,
    model: "gpt-4",
    temperature: 0.3,
  };

  const response = await client.post(
    "https://api.openai.com/v1/chat/completions",
    params
  );

  return response.data.choices[0].message.content;
};

export default GetGPTResponse;
