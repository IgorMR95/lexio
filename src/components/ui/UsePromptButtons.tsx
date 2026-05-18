'use client'

import { useState } from 'react'

interface UsePromptButtonsProps {
  text: string
}

export function UsePromptButtons({ text }: UsePromptButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const claudeUrl = `https://claude.ai/new`
  const chatgptUrl = `https://chatgpt.com/`

  const handleOpenClaude = async () => {
    await navigator.clipboard.writeText(text)
    window.open(claudeUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenChatGPT = async () => {
    await navigator.clipboard.writeText(text)
    window.open(chatgptUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
          copied
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-white text-zinc-950 hover:bg-zinc-100'
        }`}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copiado!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar prompt
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOpenClaude}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors bg-zinc-900"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-1.25-.072-.703-.12-.219-.506.703-.61.898-.073 1.25.097h1.371l2.339.097 1.25.048.528.073.08.128-.08.097-.528.17-1.25.34-2.339.657-1.75.506-1.25.388-.898.34-.703.097-.219-.46.219-.388.703-.34.898-.34zm15.582-7.91l-.703.34-.898.34-1.75.506-2.339.657-1.25.34-.528.17-.08.097.08.128.528.073 1.25.048 2.339.097 1.37.097.898.073.703-.61-.219-.506-.703-.12-1.25-.072-2.339-.097-2.698-.073-.79-.048h-.23l-.08-.128.08-.23 4.72-2.647 1.25-.703.898-.61.703-.506.219-.46-.219-.388-.703.097zm-9.871 11.945l2.647-4.72.128-.08h.23l.048.79.073 2.698.097 2.339.072 1.25.12.703.506.219.61-.703.073-.898-.097-1.25-.097-2.339-.097-1.25-.073-.528-.128-.08-.097.08-.17.528-.34 1.25-.657 2.339-.506 1.75-.34.898-.34.703-.097.219.46-.219.388-.703.34-.898.34-1.75.506-2.339.657-1.25.34-.528.17h-.23l-.128-.08zm7.91-15.582l-.34.703-.34.898-.506 1.75-.657 2.339-.34 1.25-.17.528-.097.08-.128-.08-.073-.528-.048-1.25-.097-2.339-.097-1.371-.073-.898.61-.703.506.219.12.703.072 1.25.097 2.339.073 2.698.048.79v.23l.128.08.23-.08 2.647-4.72.703-1.25.61-.898.506-.703.46-.219.388.219-.097.703z"/>
          </svg>
          Abrir no Claude
        </button>
        <button
          onClick={handleOpenChatGPT}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors bg-zinc-900"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
          </svg>
          Abrir no ChatGPT
        </button>
      </div>

      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        Os botões copiam o prompt e abrem a ferramenta — cole e envie para usar
      </p>
    </div>
  )
}
