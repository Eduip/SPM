'use client'

import { useRouter } from 'next/navigation'

export default function StageBackButton({ href }: { href: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      style={{
        height: 44,
        padding: '0 18px',
        borderRadius: 14,
        border: '1px solid var(--border-strong)',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      ←&nbsp;&nbsp;Volver
    </button>
  )
}
