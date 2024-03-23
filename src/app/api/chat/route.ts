import { postMessageWithRiouteHandler } from "@/lib/bedrock"

export const runtime = 'edge'

export async function POST(request: Request) {
  const data = await request.json()
  const decorder = new TextDecoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      const response = await postMessageWithRiouteHandler(data.prompt)
      if (response.body) {
        for await (const stream of response.body) {
          controller.enqueue(stream.chunk?.bytes)
        }
        controller.close()
      }
    }
  })
  return new Response(readableStream)
}

export async function GET() {
  return new Response("Health Check OK", { status: 200 })
}