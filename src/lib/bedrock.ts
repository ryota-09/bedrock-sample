import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ?? '',
  }
});

export const postMessageWithStream = async (prompt: string, onMessage: (text: string) => void) => {
  const _prompt = `Human:${prompt}\n\nAssistant:`;
  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-v2:1',
      contentType: 'application/json',
      accept: '*/*',
      body: JSON.stringify({
        prompt: _prompt,
        // LLM costs are measured by Tokens, which are roughly equivalent
        // to 1 word. This option allows you to set the maximum amount of
        // tokens to return
        max_tokens_to_sample: 200,
        // Temperature (1-0) is how 'creative' the LLM should be in its response
        // 1: deterministic, prone to repeating
        // 0: creative, prone to hallucinations
        temperature: 1,
        top_k: 250,
        top_p: 0.99,
        // This tells the model when to stop its response. LLMs
        // generally have a chat-like string of Human and Assistant message
        // This says stop when the Assistant (Claude) is done and expects
        // the human to respond
        stop_sequences: ['\n\nHuman:']
      })
    })
  );
  if (response.body) {
    const textDecoder = new TextDecoder("utf-8");

    for await (const stream of response.body) {
      const chunk = textDecoder.decode(stream.chunk?.bytes);
      // setText((prev) => prev + JSON.parse(chunk)["completion"])
      onMessage(JSON.parse(chunk)["completion"])
    }
  }
}