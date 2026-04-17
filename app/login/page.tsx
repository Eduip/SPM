'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Eye,
  Lock,
  LogIn,
  Mail,
  Shield,
} from 'lucide-react'
import { createClient } from '../../lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const highlights = [
    'Control total de cartera de proyectos',
    'Seguimiento financiero en tiempo real',
    'Gestión documental centralizada',
    'Reportes y análisis avanzados',
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '60.5% 39.5%',
        background: '#e5e7eb',
      }}
    >
      <style jsx>{`
        .card {
          background: #ffffff;
        }

        .soft-input {
          width: 100%;
          height: 58px;
          border-radius: 18px;
          border: 2px solid #d1d5db;
          background: #ffffff;
          outline: none;
          color: #111827;
          box-sizing: border-box;
        }

        .soft-input::placeholder {
          color: #9ca3af;
        }

        .primary-button {
          width: 100%;
          height: 62px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #2563eb 0%, #1557b0 100%);
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
        }

        .primary-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.18), transparent 28%), linear-gradient(135deg, #2e6db4 0%, #0f4aa3 52%, #0a3d8f 100%)',
          color: 'white',
          padding: '54px 60px 56px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '90px',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
              }}
            >
              <Building2 size={34} color="#1557b0" strokeWidth={2.2} />
            </div>

            <div>
              <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.05 }}>
                Municipalidad
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                Curacautín
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 66,
                lineHeight: 1.05,
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              Sistema de Gestión de
              <br />
              Proyectos Municipales
            </h1>

            <p
              style={{
                marginTop: 36,
                marginBottom: 34,
                fontSize: 26,
                lineHeight: 1.35,
                color: 'rgba(255,255,255,0.85)',
                maxWidth: 710,
              }}
            >
              Gestión integral de proyectos, desde la formulación hasta
              la ejecución
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                marginTop: 38,
              }}
            >
              {highlights.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowRight size={20} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
  style={{
    marginTop: 40,
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 16px 34px rgba(0,0,0,0.20)',
    maxWidth: 760,
  }}
>
  <Image
    src="/images/dsc-4098.jpg"
    alt="Municipalidad"
    width={760}
    height={250}
    style={{
      width: '100%',
      height: 250,
      objectFit: 'cover',
      display: 'block',
    }}
  />
</div>
      </section>

      <section
        style={{
          background: '#ececec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '34px 34px 26px 34px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              borderRadius: 24,
              padding: '46px 46px 32px 46px',
              boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  background: '#dbeafe',
                  border: '3px solid #93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogIn size={34} color="#1d4ed8" />
              </div>
            </div>

            <h2
              style={{
                marginTop: 28,
                marginBottom: 10,
                textAlign: 'center',
                fontSize: 38,
                lineHeight: 1.1,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              Iniciar Sesión
            </h2>

            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: 16,
                color: '#6b7280',
              }}
            >
              Ingrese sus credenciales para acceder al sistema
            </p>

            <form
              onSubmit={handleLogin}
              style={{
                marginTop: 38,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Correo electrónico
                </label>

                <div style={{ position: 'relative' }}>
                  <Mail
                    size={22}
                    color="#9ca3af"
                    style={{
                      position: 'absolute',
                      left: 18,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="correo@curacautin.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="soft-input"
                    style={{ paddingLeft: 54, fontSize: 16 }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Contraseña
                </label>

                <div style={{ position: 'relative' }}>
                  <Lock
                    size={22}
                    color="#9ca3af"
                    style={{
                      position: 'absolute',
                      left: 18,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="soft-input"
                    style={{ paddingLeft: 54, paddingRight: 54, fontSize: 16 }}
                  />
                  <Eye
                    size={22}
                    color="#9ca3af"
                    style={{
                      position: 'absolute',
                      right: 18,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 16,
                  color: '#4b5563',
                  paddingTop: 2,
                }}
              >
                <span>Recordar sesión</span>
                <span style={{ color: '#1557b0', fontWeight: 700 }}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>

              {error && (
                <div
                  style={{
                    borderRadius: 16,
                    padding: '14px 16px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="primary-button">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <LogIn size={20} />
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </span>
              </button>
            </form>

            <div
              style={{
                marginTop: 30,
                paddingTop: 20,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  padding: '16px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  color: '#1d4ed8',
                }}
              >
                <Shield size={18} style={{ marginTop: 3, flexShrink: 0 }} />
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Acceso exclusivo para funcionarios autorizados.
                  <br />
                  Todas las acciones son monitoreadas y registradas.
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              textAlign: 'center',
              color: '#4b5563',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              © 2026 Municipalidad de Curacautín
            </div>
            <div style={{ marginTop: 8, fontSize: 15, color: '#6b7280' }}>
              Todos los derechos reservados
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
