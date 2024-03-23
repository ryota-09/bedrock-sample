"use client"

import { ChatMessageType } from "@/domains/form"
import { postMessageWithMaxLength, postMessageWithStream } from "@/lib/bedrock"
import { ChatType } from "@/types/chat"
import { createChatId, createChatRoomId, getNow } from "@/utils"
import { useState, useTransition } from "react"
import { useFormContext } from "react-hook-form"

export default function Page() {
  const [isPending, startTransition] = useTransition()
  const { handleSubmit, register, setValue } = useFormContext<ChatMessageType>();

  const [conversation, setConversation] = useState<ChatType[]>([])
  const [userChat, setUserChat] = useState("")
  const [botChat, setBotChat] = useState("")
  const [stopReason, setStopReason] = useState("")

  const onSend = async (data: ChatMessageType) => {
    setConversation(prev => [...prev, { chatId: createChatId(), role: "user", message: data.content, date: getNow() }])
    startTransition(async () => {
      const response = await fetch(`/api/chat`, {
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": JSON.stringify({ "prompt": data.content })
      })
      console.log(response)
      let text = ""
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
              const str = decoder.decode(value, { stream: true })

              const chunkSwitcher = (chunk: any) => {
                const chunkType = chunk.type;
                switch (chunkType) {
                  case "message_start":
                    console.log(chunk);
                    console.log(chunk.message.id);
                    console.log(chunk.message.model);
                    break;
                  case "content_block_delta":
                    const currentText = chunk.delta.text;
                    text += currentText;
                    setBotChat((prev: string) => prev + currentText);
                    if (chunk.delta.stop_reason === "max_tokens") {
                      setStopReason("max_tokens");
                      return;
                    }
                    break;
                  case "message_delta":
                    if (chunk.delta.stop_reason === "end_turn") {
                      return;
                    }
                    break;
                  case "message_stop":
                    const metrics = chunk["amazon-bedrock-invocationMetrics"];
                    console.log(metrics);
                    break;
                  default:
                    // Handle default case or do nothing
                    break;
                }
              };

              if (str.includes("}{")) {
                const formatedParts = str.split('}{').map((part, index, array) => {
                  if (index === 0) {
                    // 最初の要素の場合、末尾に'}'を追加
                    return `${part}}`;
                  } else if (index === array.length - 1) {
                    // 最後の要素の場合、先頭に'{'を追加
                    return `{${part}`;
                  } else {
                    // それ以外の要素の場合、先頭と末尾にそれぞれ'{'と'}'を追加
                    return `{${part}}`;
                  }
                });
                
                const jsonList = formatedParts.map(part => JSON.parse(part));
                for (const obj of jsonList) {
                  chunkSwitcher(obj);
                }
              } else {
                chunkSwitcher(JSON.parse(str));
              }
            }
          }
        } finally {
          setConversation(prev => [...prev, { chatId: createChatId(), role: "assistant", message: text, date: getNow() }])
          setValue("content", "")
          setBotChat("")
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          window.history.pushState(null, "", `/chat/${data.id}}`)
          reader.releaseLock()
        }
      }
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

  return (
    <div className="h-screen flex flex-col gap-4">
      <header className="p-4 grid place-items-center">
        <h1 className="text-2xl font-semibold">Chat</h1>
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
        <form className="flex gap-4" onSubmit={handleSubmit(onSend)}>
          <input
            placeholder="Type a message"
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-gray-400"
            type="text"
            {...register("content")}
            onBlur={() => {
              const id = createChatRoomId();
              register("id", { value: id });
            }}
          />
          <button type="submit" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">Send</button>
        </form>
      </div>
    </div>
  )
}
