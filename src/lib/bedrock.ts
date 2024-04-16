import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  // region: 'us-east-1',
  region: 'us-west-2',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ?? '',
  }
});

export const postMessageWithRiouteHandler = async (prompt: string) => {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  };
  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      // modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      modelId: 'anthropic.claude-3-opus-20240229-v1:0',
      contentType: 'application/json',
      body: JSON.stringify(payload)
    })
  );
  return response;
}

export const postMessageWithMaxLength = async (payload: Payload) => {
  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: payload.userChat }]
    }, {
      role: "assistant",
      content: [{ type: "text", text: payload.botChat }]
    }
  ];
  console.log(messages);
  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: '*/*',
      body: JSON.stringify({
        messages,
        max_tokens: 10,
        anthropic_version: "bedrock-2023-05-31"
      })
    })
  );
  return response;
}

export const postMessageWithStream = async (prompt: string, onMessage: (text: string, stopReason?: string) => void) => {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  };
  const response = await bedrock.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      body: JSON.stringify(payload)
    })
  );
  if (response.body) {
    for await (const stream of response.body) {
      const chunk = JSON.parse(new TextDecoder("utf-8").decode(stream.chunk?.bytes));
      const chunk_type = chunk.type;
      switch (chunk_type) {
        case "message_start":
          console.log(chunk);
          console.log(chunk["message"]["id"]);
          console.log(chunk["message"]["model"]);
          break;
        case "content_block_delta":
          onMessage(chunk["delta"]["text"], chunk["delta"]["stop_reason"]);
          break;
        case "message_stop":
          const metrics = chunk["amazon-bedrock-invocationMetrics"];
          console.log(`\nNumber of input tokens: ${metrics.inputTokenCount}`);
          console.log(`Number of output tokens: ${metrics.outputTokenCount}`);
          console.log(`Invocation latency: ${metrics.invocationLatency}`);
          console.log(`First byte latency: ${metrics.firstByteLatency}`);
          break;
        default:
          console.log(chunk);
      }
    }
  }
}

type Payload = {
  userChat: string
  botChat: string
}

// export const postMessageWithMaxLength = async (payload: Payload, onMessage: (completion: string, stopReason?: string) => void) => {
//   const messages = [
//     {
//       role: "user",
//       content: [{ type: "text", text: payload.userChat }]
//     }, {
//       role: "assistant",
//       content: [{ type: "text", text: payload.botChat }]
//     }
//   ];

//   const response = await bedrock.send(
//     new InvokeModelWithResponseStreamCommand({
//       modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
//       contentType: 'application/json',
//       accept: '*/*',
//       body: JSON.stringify({
//         messages,
//         max_tokens: 1000,
//         anthropic_version: "bedrock-2023-05-31"
//       })
//     })
//   );

//   if (response.body) {
//     const textDecoder = new TextDecoder("utf-8");
//     for await (const stream of response.body) {
//       const chunk = textDecoder.decode(stream.chunk?.bytes);
//       if (chunk.includes("delta")) {
//         onMessage(JSON.parse(chunk)["delta"]["text"], JSON.parse(chunk)["delta"]["stop_reason"])
//       }
//     }
//   }
// }