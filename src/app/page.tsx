"use client"

import { postMessageWithStream } from "@/lib/bedrock"
import { getNow } from "@/utils"
import { useState, useTransition } from "react"

export default function Home() {
  const [isPending, startTransition] = useTransition()
  const [prompt, setPrompt] = useState("")
  const [userChat, setUserChat] = useState("")
  const [botChat, setBotChat] = useState("")

  const onSend = async (e: any) => {
    e.preventDefault()
    const _prompt = e.target[0].value
    setUserChat(_prompt)
    setPrompt("")
    startTransition(async () => {
      await postMessageWithStream(_prompt, (data) => {
        setBotChat(prev => prev + data)
      })
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
            {userChat &&
              <div className="flex flex-col items-end gap-1">
                <div className="flex flex-col max-w-[75%] rounded-lg p-4 bg-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium bg-slate-500 text-white px-2 py-1 rounded-full">You</div>
                    {/* 時間をフォーマットするコード */}
                    <time className="opacity-70">{getNow()}</time>
                  </div>
                  <div className="mt-2">{userChat}</div>
                </div>
              </div>
            }
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
    </main>
  )
}
