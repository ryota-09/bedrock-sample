"use client"

import { postMessageWithStream } from "@/lib/bedrock"
import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [botChat, setBotChat] = useState("")

  const onSend = async (e: any) => {
    e.preventDefault()
    const prompt = e.target[0].value
    setPrompt(prompt)
    
    await postMessageWithStream(prompt, (data) => {
      setBotChat(prev => prev + data)
    })
  }

  return (
    <main>
      <div className="h-screen flex flex-col gap-4">
        <header className="p-4 grid place-items-center">
          <h1 className="text-2xl font-semibold">Chat</h1>
        </header>
        <main className="flex-1 flex flex-col p-4">
          <div className="grid gap-4">
            {prompt &&
              <div className="flex flex-col items-end gap-1">
                <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium">You</div>
                    <time className="opacity-70">2:26pm</time>
                  </div>
                  <div className="mt-2">{prompt}</div>
                </div>
              </div>
            }
            {botChat &&
              <div className="flex flex-col items-start gap-1">
                <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium">ChatGPT</div>
                    <time className="opacity-70">2:27pm</time>
                  </div>
                  <div className="mt-2">{botChat}</div>
                </div>
              </div>
            }
          </div>
        </main>
        <div className="border-t p-4">
          <form className="flex gap-4" onSubmit={onSend}>
            <input
              placeholder="Type a message"
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-gray-400"
              type="text"
            />
            <button type="submit" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">Send</button>
          </form>
        </div>
      </div>
    </main>
  )
}
