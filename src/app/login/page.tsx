import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="text-zinc-500 text-sm">Carregando...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
