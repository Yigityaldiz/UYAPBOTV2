UYAP Asistanı — Web UI (React + Vite + Tailwind)

Geliştirme

- Bağımlılıkları yükle:
  npm install

- Geliştirme sunucusu:
  npm run dev

API Proxy

- Vite, `/api` çağrılarını `http://localhost:3000` adresine iletir (bkz. `vite.config.ts`).
- İstersen `VITE_API_BASE_URL` env değişkeni ile farklı bir backend adresi kullanabilirsin.

Mock Veri

- Backend hazır değilse UI otomatik olarak `src/mock/tebligatlar.ts` verisini kullanır.

Üretim Derleme

  npm run build

