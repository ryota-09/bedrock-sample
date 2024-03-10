import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { withSSRContext } from 'aws-amplify';

export const BedRock = async () => {
  const SSR = withSSRContext();
  const credentials = await SSR.Auth.currentCredentials();
  const bedrock = new BedrockRuntimeClient({
    serviceId: 'bedrock',
    region: "ap-northeast-1",
    credentials
  });
  const prompt = `Human:${"大谷翔平について教えて"}\n\nAssistant:`;
  const result = await bedrock.send(
    new InvokeModelCommand({
      modelId: 'anthropic.claude-v2',
      contentType: 'application/json',
      accept: '*/*',
      body: JSON.stringify({
        prompt,
        // LLM costs are measured by Tokens, which are roughly equivalent
        // to 1 word. This option allows you to set the maximum amount of
        // tokens to return
        max_tokens_to_sample: 2000,
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
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31'
      })
    })
  );
  console.log(result);
  return (
    <></>
  )
}