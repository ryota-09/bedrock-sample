import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { withSSRContext } from 'aws-amplify';

import { Amplify } from 'aws-amplify'
import awsconfig from '../aws-exports';

Amplify.configure({
  ...awsconfig,
  ssr: true
});

export const BedRock = async () => {
  const bedrock = new BedrockRuntimeClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    }
  });

  const prompt = `Human:${"大谷翔平について教えて"}\n\nAssistant:`;
  const result = await bedrock.send(
    new InvokeModelCommand({
      modelId: 'anthropic.claude-v2:1',
      contentType: 'application/json',
      accept: 'application/json',
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
        stop_sequences: ['\n\nHuman:']
      })
    })
  );
  console.log(JSON.parse(new TextDecoder().decode(result.body)));
  return (
    <></>
  )
}