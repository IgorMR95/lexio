'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaPrincipal, Subcategoria, AreaDireito } from '@/lib/supabase/types'

interface Props {
  areas: AreaDireito[]
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  userId: string
}

export function ImportTab({ areas, userId }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setResult(null)
    const XLSX = await import('xlsx')
    const buf = await f.arrayBuffer()
    const wb = XLSX.read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)
    setPreview(rows.slice(0, 5))
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([
      ['titulo', 'descricao_curta', 'texto_completo', 'area', 'tags'],
      ['Exemplo de Prompt', 'Descrição curta', 'Texto completo do prompt aqui...', 'Direito Civil', 'contrato, civil'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prompts')
    XLSX.writeFile(wb, 'template-midori.xlsx')
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)

    let inserted = 0
    const errors: string[] = []

    for (const row of rows) {
      const titulo = row['titulo'] || row['Título'] || row['title'] || ''
      const texto = row['texto_completo'] || row['Texto'] || row['prompt'] || ''
      if (!titulo || !texto) { errors.push(`Linha ignorada: título ou texto ausente`); continue }

      const areaNome = row['area'] || row['Área'] || ''
      let areaDireitoId = null
      if (areaNome) {
        const area = areas.find(a => a.nome.toLowerCase() === areaNome.toLowerCase())
        if (area) areaDireitoId = area.id
      }

      const tagsRaw = row['tags'] || row['Tags'] || ''
      const tags = tagsRaw ? String(tagsRaw).split(',').map((t: string) => t.trim()).filter(Boolean) : []

      const { error } = await supabase.from('prompts').insert({
        titulo,
        descricao_curta: row['descricao_curta'] || null,
        texto_completo: texto,
        area_direito_id: areaDireitoId,
        tags,
        autor_id: userId,
        status: 'pendente',
      })
      if (error) errors.push(`"${titulo}": ${error.message}`)
      else inserted++
    }

    setResult({ inserted, errors })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Importar via Excel</h3>
          <p className="text-zinc-500 text-sm mt-0.5">Importe múltiplos prompts de uma vez</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-white hover:border-zinc-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          file ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div>
            <p className="text-blue-400 font-medium text-sm">{file.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{preview.length} linha(s) pré-visualizadas</p>
          </div>
        ) : (
          <div>
            <svg className="w-8 h-8 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-zinc-400 text-sm">Clique ou arraste um arquivo .xlsx</p>
            <p className="text-zinc-600 text-xs mt-1">Colunas: titulo, texto_completo, descricao_curta, area, tags</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Pré-visualização (primeiras {preview.length} linhas):</p>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800">
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} className="text-left px-3 py-2 text-zinc-400 font-medium">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-3 py-2 text-zinc-300 max-w-xs truncate">{String(v).slice(0, 60)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {file && (
        <button onClick={handleImport} disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
          {loading ? 'Importando...' : 'Importar prompts'}
        </button>
      )}

      {result && (
        <div className={`p-4 rounded-lg border text-sm ${result.errors.length === 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
          <p className="font-medium">{result.inserted} prompt(s) importado(s) com sucesso</p>
          {result.errors.map((e, i) => <p key={i} className="text-xs mt-1 text-red-400">{e}</p>)}
        </div>
      )}
    </div>
  )
}
