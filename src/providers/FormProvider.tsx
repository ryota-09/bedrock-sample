"use client";
import { ChatMessageSchema, ChatMessageType } from "@/domains/form";
import type { ReactNode } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm, FormProvider } from "react-hook-form";

type PropType = {
  children: ReactNode;
};

export function ClientFormProvider({ children }: PropType) {
  const methods = useForm<ChatMessageType>({
    mode: "onChange",
    criteriaMode: "all",
    resolver: valibotResolver(ChatMessageSchema),
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}