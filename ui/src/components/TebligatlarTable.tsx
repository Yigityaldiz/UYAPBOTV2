import { useEffect, useRef, useState } from "react";
import type { Tebligat } from "../types";
import { daysUntil, parseTRDate } from "../lib/api";

type Props = {
  items: Tebligat[];
};

function StatusPill({ item }: { item: Tebligat }) {
  const due = parseTRDate(
    item.analysisResult.sonTarih || item.analysisResult.durusmaTarihi
  );
  const remain = daysUntil(due);
  const urgent = typeof remain === "number" && remain <= 7 && remain >= 0;
  const status = urgent
    ? "Süresi Yaklaşıyor"
    : item.isProcessed
    ? "İşlendi"
    : "Yeni";
  const cls = urgent
    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : item.isProcessed
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return <span className={`pill ${cls}`}>{status}</span>;
}

function getPdfFilename(pdfPath?: string): string | null {
  if (!pdfPath) return null;
  const parts = pdfPath.split("/");
  return parts[parts.length - 1] || null;
}

export default function TebligatlarTable({ items }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const toggleMenu = (barcode: string) =>
    setOpenMenu((v) => (v === barcode ? null : barcode));
  const closeMenu = () => setOpenMenu(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollMax, setScrollMax] = useState(0);
  const [scrollVal, setScrollVal] = useState(0);

  useEffect(() => {
    function updateMetrics() {
      const el = scrollRef.current;
      if (!el) return;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      setScrollMax(max);
      setScrollVal(el.scrollLeft);
    }
    updateMetrics();
    const el = scrollRef.current;
    const onScroll = () => {
      if (!el) return;
      setScrollVal(el.scrollLeft);
    };
    el?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);
    return () => {
      el?.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [items.length]);
  return (
    <div className="card w-full">
      {scrollMax > 0 && (
        <div className="px-6 pt-4">
          <input
            type="range"
            min={0}
            max={scrollMax}
            value={scrollVal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setScrollVal(v);
              if (scrollRef.current) scrollRef.current.scrollLeft = v;
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
      <div className="overflow-x-auto  " ref={scrollRef}>
        <table className="min-w-[1600px] table-auto">
          <thead className="text-left text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-200 w-[1500px]">
              <th className="px-6 py-3 w-[14%]">Barkod</th>
              <th className="px-6 py-3 w-[18%]">Mahkeme Adı</th>
              <th className="px-6 py-3 w-[10%]">Dosya No</th>
              <th className="px-6 py-3 w-[10%]">Karar No</th>
              <th className="px-6 py-3 w-[14%]">Tebliğ Konusu</th>
              <th className="px-6 py-3 w-[10%]">Son Tarih</th>
              <th className="px-6 py-3 w-[10%]">Duruşma Günü</th>
              <th className="px-6 py-3 w-[8%]">Saat</th>
              <th className="px-6 py-3 w-[22%]">Duruşma Yeri</th>
              <th className="px-6 py-3 w-[10%]">Durum</th>
              <th className="px-3 py-3 w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map((it) => {
              const dueText = it.analysisResult.sonTarih || "-";
              const hearingDay = it.analysisResult.durusmaTarihi || "-";
              const dueDate = parseTRDate(dueText);
              const urgent = ((): boolean => {
                const d = daysUntil(dueDate);
                return typeof d === "number" && d <= 7 && d >= 0;
              })();
              return (
                <tr
                  key={it.barcode}
                  className="border-b border-zinc-100 hover:bg-zinc-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-zinc-700">
                    {it.barcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {it.analysisResult.mahkemeAdi || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {it.analysisResult.dosyaNo || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {it.analysisResult.kararNo || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {it.analysisResult.tebligKonusu || "-"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap ${
                      urgent ? "text-red-600 font-semibold" : ""
                    }`}
                  >
                    {dueText}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{hearingDay}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {it.analysisResult.durusmaSaati || "-"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-normal break-words max-w-[520px]"
                    title={it.analysisResult.durusmaYeri || undefined}
                  >
                    {it.analysisResult.durusmaYeri || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill item={it} />
                  </td>
                  <td className="px-6 py-4 text-right relative bg-white border-l border-zinc-200 w-[60px]">
                    <button
                      className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-zinc-100"
                      title="Aksiyonlar"
                      onClick={() => toggleMenu(it.barcode)}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500 ml-0.5" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500 ml-0.5" />
                    </button>
                    {openMenu === it.barcode && (
                      <div className="absolute right-0 top-9 z-40 w-44 rounded-md border border-zinc-200 bg-white shadow-md">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                          onClick={() => {
                            const filename = getPdfFilename(it.pdfPath);
                            if (filename) {
                              window.open(
                                `/api/files/${filename}`,
                                "_blank",
                                "noreferrer"
                              );
                            }
                            closeMenu();
                          }}
                        >
                          PDF'i Görüntüle
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
