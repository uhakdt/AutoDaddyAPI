import GetGPTResponse from "./functions/gptIntegration.js";
import GenerateBasePrompt from "./functions/promptFunctions.js";

const conversations = new Map();

export default function webSocket(io) {
  io.on("connection", (socket) => {
    conversations.set(socket.id, []);

    socket.on("disconnect", () => {
      conversations.delete(socket.id);
    });

    socket.on("message", async (data) => {
      const conversation = conversations.get(socket.id);

      if (conversation.length === 0) {
        const firstPrompt = GenerateBasePrompt(
          data.input,
          data.order,
          data.pageFrom
        );
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

      console.log(data.registrationNumber, "is using chat on:", data.pageFrom);

      conversation.push({
        role: "assistant",
        content: response,
      });

      socket.emit("message", response);
    });
  });
}
