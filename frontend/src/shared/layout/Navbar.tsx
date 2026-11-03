import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { Button } from '../ui/Button'

const claseLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-orange-100 text-orange-800' : 'text-stone-700 hover:bg-stone-100'}`

export function Navbar() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((suma, item) => suma + item.cantidad, 0))
  const [abierto, setAbierto] = useState(false)

  async function cerrarSesion() {
    await logout()
    setAbierto(false)
    navigate('/login')
  }

  const cerrar = () => setAbierto(false)

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-orange-700" onClick={cerrar}>
          🍔 Food Store
        </Link>
        <button
          type="button"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? 'Cerrar menú' : 'Menú'}
        </button>
        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 z-40 flex-col gap-1 border-b border-stone-200 bg-white p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}
        >
          <NavLink to="/" end className={claseLink} onClick={cerrar}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={claseLink} onClick={cerrar}>
            Carrito{cantidad > 0 ? ` (${cantidad})` : ''}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={claseLink} onClick={cerrar}>
              Mis pedidos
            </NavLink>
          )}
          {usuario?.role === 'admin' && (
            <NavLink to="/admin/resumen" className={claseLink} onClick={cerrar}>
              Panel
            </NavLink>
          )}
          {usuario ? (
            <div className="flex flex-col gap-2 md:ml-3 md:flex-row md:items-center">
              <span className="text-sm text-stone-600">
                {usuario.full_name} · {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
              <Button variante="secondary" onClick={() => void cerrarSesion()}>
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={claseLink} onClick={cerrar}>
                Ingresar
              </NavLink>
              <NavLink to="/register" className={claseLink} onClick={cerrar}>
                Registrarse
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
