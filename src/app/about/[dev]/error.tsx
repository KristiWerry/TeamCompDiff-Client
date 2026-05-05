"use client";

import { useRouter } from "next/navigation";
import { startTransition, useTransition } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error, reset: () => void }) {
  const router = useRouter()
  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
    })
  }
  return (
    <>
      <h1>{error.message}</h1>
      <button onClick={() => reload()}>Reload</button>
    </>
  )
}