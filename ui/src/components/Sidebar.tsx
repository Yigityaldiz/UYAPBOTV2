export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white/70 backdrop-blur">
      <div className="h-16 flex items-center px-6 font-semibold text-zinc-800">
        UYAP Asistanı
      </div>
      <nav className="px-2">
        <a
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-700 hover:bg-zinc-100"
          href="#"
        >
          <span className="inline-block w-4 h-4 rounded bg-zinc-400" />
          <span>Ana Sayfa</span>
        </a>
      </nav>
    </aside>
  )
}

