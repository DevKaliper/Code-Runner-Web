"use client"
import Runner from "../components/Runner"
import Header from "@/components/Header"


export default function CodeRunner() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between ">
      <Header />
      <Runner />
    </main>
  )
  

}