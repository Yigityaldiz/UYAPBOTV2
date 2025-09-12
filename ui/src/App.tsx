import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TebligatlarTable from "./components/TebligatlarTable";
import { getTebligatlar } from "./lib/api";
import type { Tebligat } from "./types";

export default function App() {
  const [items, setItems] = useState<Tebligat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTebligatlar()
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="min-h-screen ">
      <header className="h-14 flex items-center px-6 text-sm text-zinc-500">
        Tebligatlarım - UYAP Asistanı
      </header>
      <div className="mx-auto  rounded-2xl border border-zinc-200 bg-white/60 backdrop-blur p-0 overflow-hidden shadow">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h1 className="text-2xl font-semibold mb-6">Tebligatlarım</h1>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">
                Hata: {error}
              </div>
            )}

            {!items ? (
              <div className="card p-6 text-sm text-zinc-500">
                Yükleniyor...
              </div>
            ) : (
              <TebligatlarTable items={items} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
