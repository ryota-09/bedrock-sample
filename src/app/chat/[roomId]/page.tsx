"use client"

import { postMessageWithMaxLength, postMessageWithStream } from "@/lib/bedrock"
import { createChatRoomId, getNow } from "@/utils"
import { useState, useTransition } from "react"

const data = {
  roomId: "chat-202110191b9e3e3e-4e3d-4b3d-8e3d-4b3d8e3d4b3d",
  conversations: [
    {
      role: "user",
      message: "Hello",
      date: "2022-01-01T00:00:00Z"
    },
    {
      role: "assistant",
      message: "Hello",
      date: "2022-01-01T00:00:01Z"
    }
  ]
}

export default function Page() {
  const [isPending, startTransition] = useTransition()
  const [prompt, setPrompt] = useState("")
  const [conversation, setConversation] = useState(data.conversations)
  const [userChat, setUserChat] = useState("")
  const [botChat, setBotChat] = useState("")
  const [stopReason, setStopReason] = useState("")

  const onSend = async (e: any) => {
    e.preventDefault()
    const _prompt = e.target[0].value
    setConversation(prev => [...prev, { role: "user", message: _prompt, date: getNow() }])
    setPrompt("")
    let text = ""
    startTransition(async () => {
      await postMessageWithStream(_prompt, (completion, stopReason) => {
        text += botChat + completion
        setBotChat(prev => prev + completion)
        if (stopReason === "max_tokens") {
          setStopReason(stopReason)
          return
        }
        if (stopReason === "stop_sequence") {
          setBotChat("")
          setConversation(prev => [...prev, { role: "assistant", message: text, date: getNow() }])
          return
        }
      })
    })
  }

  const onSendWithMaxLength = async (e: any) => {
    e.preventDefault()
    startTransition(async () => {
      await postMessageWithMaxLength({ userChat: userChat, botChat: botChat }, (completion, stopReason) => {
        if (completion) {
          setBotChat(prev => prev + completion)
        }
        if (stopReason === "max_tokens") {
          setStopReason(stopReason)
          return
        }
      })
    })
  }

  const onButtonClick = async (prompt: string) => {
    const response = await fetch(`/api/stream`, {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({ "prompt": prompt })
    })

    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          if (value) {
            const chunk = JSON.parse(decoder.decode(value, { stream: true }))
            const chunk_type = chunk.type;
            switch (chunk_type) {
              case "message_start":
                console.log(chunk);
                console.log(chunk["message"]["id"]);
                console.log(chunk["message"]["model"]);
                break;
              case "content_block_delta":
                setBotChat(prev => prev + chunk["delta"]["text"])
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
      } finally {
        reader.releaseLock()
      }
    }
  }

  return (
    <div className="h-screen flex flex-col gap-4">
      <header className="p-4 grid place-items-center">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <div className=" bg-green-300" onClick={() => onButtonClick(prompt)}>ボタン</div>
      </header>
      <main className="flex-1 flex flex-col p-4">
        <div className="grid gap-4">
          {conversation.map((chat, index) => (
            chat.role === "user" ?
              <div key={index} className="flex flex-col items-end gap-1">
                <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium bg-slate-500 text-white px-2 py-1 rounded-full">You</div>
                    <time className="opacity-70">{chat.date}</time>
                  </div>
                  <div className="mt-2">{chat.message}</div>
                </div>
              </div>
              :
              <div className="flex flex-col items-start gap-1" key={index}>
                <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium bg-green-600 text-white px-2 py-1 rounded-full">Bed Rock</div>
                    <time className="opacity-70">{chat.date}</time>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap">{chat.message}</div>
                </div>
              </div>
          ))}
          {botChat &&
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <div className="font-medium bg-green-600 text-white px-2 py-1 rounded-full">Bed Rock</div>
                  <time className="opacity-70">{getNow()}</time>
                </div>
                <div className="mt-2 whitespace-pre-wrap">{botChat}</div>
              </div>
            </div>
          }
          {isPending && botChat.length === 0 && <div className="flex flex-col items-start gap-1">
            <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">Bed Rock</div>
              </div>
              <div className="mt-2">考え中...</div>
            </div>
          </div>}
        </div>
      </main>
      {stopReason === "max_tokens" && <button className="mx-auto hover:bg-orange-100 p-4 text-center border border-orange-300 text-orange-600 rounded-md" onClick={onSendWithMaxLength}>Continue</button>}
      <div className="border-t p-4">
        <form className="flex gap-4" onSubmit={onSend}>
          <input
            placeholder="Type a message"
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-gray-400"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">Send</button>
        </form>
      </div>
    </div>
  )
}
