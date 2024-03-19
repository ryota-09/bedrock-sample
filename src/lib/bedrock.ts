import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ?? '',
  }
});

export const postMessageWithStream = async (prompt: string, onMessage: (completion: string, stopReason?: string) => void) => {
  const _prompt = `Human:${prompt}\n\nAssistant:`;
  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-v2:1',
      contentType: 'application/json',
      accept: '*/*',
      body: JSON.stringify({
        prompt: _prompt,
        max_tokens_to_sample: 20,
        temperature: 1,
        top_k: 250,
        top_p: 0.99,
        stop_sequences: ['\n\nHuman:']
      })
    })
  );
  if (response.body) {
    const textDecoder = new TextDecoder("utf-8");

    for await (const stream of response.body) {
      const chunk = textDecoder.decode(stream.chunk?.bytes);
      onMessage(JSON.parse(chunk)["completion"], JSON.parse(chunk)["stop_reason"])
    }
  }
}

type Payload = {
  userChat: string
  botChat: string
}

export const postMessageWithMaxLength = async (payload: Payload, onMessage: (completion: string, stopReason?: string) => void) => {
  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: payload.userChat }]
    }, {
      role: "assistant",
      content: [{ type: "text", text: payload.botChat }]
    }
  ];

  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-v2:1',
      contentType: 'application/json',
      accept: '*/*',
      body: JSON.stringify({
        messages,
        max_tokens: 20,
        anthropic_version: "bedrock-2023-05-31"
      })
    })
  );

  if (response.body) {
    const textDecoder = new TextDecoder("utf-8");
    for await (const stream of response.body) {
      const chunk = textDecoder.decode(stream.chunk?.bytes);
      if (chunk.includes("delta")) {
        onMessage(JSON.parse(chunk)["delta"]["text"], JSON.parse(chunk)["delta"]["stop_reason"])
      }
    }
  }
}