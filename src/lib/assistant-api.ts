import { apiRequest } from "./api";

export type AssistantHistoryTurn = {
  role: "user" | "model";
  content: string;
};

export type AssistantAttachmentPayload = {
  mimeType: string;
  fileName: string;
  dataBase64: string;
};

export type AssistantStatus = {
  configured: boolean;
  model: string;
  attachments?: {
    maxFiles: number;
    maxBytesPerFile: number;
    allowedMimeTypes: string[];
  };
};

export async function getAssistantStatus(): Promise<AssistantStatus> {
  const data = await apiRequest<AssistantStatus>("/api/assistant/status");
  return data;
}

export async function sendAssistantChat(input: {
  message: string;
  history?: AssistantHistoryTurn[];
  category?: string;
  attachments?: AssistantAttachmentPayload[];
  auth?: boolean;
}): Promise<{ reply: string; personalized: boolean; audience?: string }> {
  return apiRequest<{ reply: string; personalized: boolean; audience?: string }>(
    "/api/assistant/chat",
    {
      method: "POST",
      auth: input.auth ?? false,
      body: JSON.stringify({
        message: input.message,
        history: input.history,
        category: input.category,
        attachments: input.attachments,
      }),
    }
  );
}

export async function explainRecommendation(input: {
  category: string;
  policyId?: string;
}): Promise<{ reply: string; policyId: string; policyName: string; score: number }> {
  return apiRequest<{ reply: string; policyId: string; policyName: string; score: number }>(
    "/api/assistant/explain",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(input),
    }
  );
}
