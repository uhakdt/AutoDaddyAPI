import GetGPTResponse from "./functions/gptIntegration.js";
import GenerateBasePrompt from "./functions/promptFunctions.js";

const conversations = new Map();

export default function webSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected");
    conversations.set(socket.id, []);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      conversations.delete(socket.id);
    });

    socket.on("message", async (data) => {
      const conversation = conversations.get(socket.id);

      if (conversation.length === 0) {
        const firstPrompt = GenerateBasePrompt(data.input, data.order);
        conversation.push({
          role: "system",
          content: firstPrompt,
        });
      }

      conversation.push({
        role: "user",
        content: data.input,
      });

      const response = await GetGPTResponse(conversation);

      conversation.push({
        role: "assistant",
        content: response,
      });

      socket.emit("message", response);
    });
  });
}