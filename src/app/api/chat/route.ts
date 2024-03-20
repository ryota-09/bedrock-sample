import { postMessageWithRiouteHandler } from "@/lib/bedrock"

export const runtime = 'edge'

export async function POST(request: Request) {
  const data = await request.json()
  const readableStream = new ReadableStream({
    async pull(controller) {
      const response = await postMessageWithRiouteHandler(data.prompt)
      if (response.body) {
        for await (const stream of response.body) {
          controller.enqueue(stream.chunk?.bytes)
        }
        controller.close()
      }
    }
  })
  return new Response(readableStream, { headers: { "Content-Type": "text/event-stream" } })
}

export async function GET() {
  return new Response("Health Check OK", { status: 200 })
}