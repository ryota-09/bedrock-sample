import { postMessageWithMaxLength, postMessageWithRiouteHandler } from "@/lib/bedrock"

export const runtime = 'edge'

export async function POST(request: Request) {
  const data = await request.json()
  const isFirstChat = !Boolean(data.botChat)
  console.log(data)
  console.log(isFirstChat)
  const readableStream = new ReadableStream({
    async start(controller) {
      const response = isFirstChat ? await postMessageWithRiouteHandler(data.prompt) : await postMessageWithMaxLength({ userChat: data.prompt, botChat: data.botChat })
      if (response.body) {
        for await (const stream of response.body) {
          controller.enqueue(stream.chunk?.bytes)
        }
        controller.close()
      }
    }
  })
  return new Response(readableStream, { headers: { "Content-Type": "text/plain" } })
}

export async function GET() {
  return new Response("Health Check OK", { status: 200 })
}