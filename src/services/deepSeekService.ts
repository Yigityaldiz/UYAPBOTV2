import axios from "axios";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const CHAT_API_URL = "https://api.deepseek.com/v1/chat/completions";

class DeepSeekService {
  async chatCompletion(
    prompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      systemMessage?: string;
    } = {}
  ): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY .env dosyasında bulunamadı.");
    }
    try {
      const response = await axios.post(
        CHAT_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: options.systemMessage ?? "Sen yardımcı bir asistansın.",
            },
            { role: "user", content: prompt },
          ],
          temperature: options.temperature ?? 1.0,
          max_tokens: options.max_tokens ?? 2048,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          `DeepSeek API Hatası [${error.response?.status}]:`,
          error.response?.data?.error?.message
        );
      } else {
        console.error("Beklenmeyen bir hata oluştu:", error);
      }
      throw new Error("Sohbet yanıtı alınamadı");
    }
  }
}

export default new DeepSeekService();
