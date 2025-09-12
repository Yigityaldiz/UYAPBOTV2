import type { Tebligat } from '../types'

export const mockTebligatlar: Tebligat[] = [
  {
    barcode: '5001965183628',
    pdfPath: '/downloads/5001965183628.pdf',
    isProcessed: true,
    analysisResult: {
      mahkemeAdi: 'Ankara 1. Asliye Hukuk Mahkemesi',
      dosyaNo: '2023/12345',
      tebligKonusu: 'Dava Dilekçesi',
      sonTarih: '2024-03-15',
    },
  },
  {
    barcode: '5001959340412',
    pdfPath: '/downloads/5001959340412.pdf',
    isProcessed: false,
    analysisResult: {
      mahkemeAdi: 'İstanbul 2. İcra Dairesi',
      dosyaNo: '2023/67890',
      tebligKonusu: 'Ödeme Emri',
      sonTarih: '2024-03-22',
    },
  },
  {
    barcode: '5001959340413',
    pdfPath: '/downloads/5001959340413.pdf',
    isProcessed: false,
    analysisResult: {
      mahkemeAdi: 'İzmir 3. Sulh Hukuk Mahkemesi',
      dosyaNo: '2023/24680',
      tebligKonusu: 'Duruşma Günü',
      durusmaTarihi: '2024-04-05',
      durusmaSaati: '10:00',
      durusmaYeri: 'İzmir 3. Sulh Hukuk Mahkemesi Duruşma',
    },
  },
  {
    barcode: '5001959340414',
    pdfPath: '/downloads/5001959340414.pdf',
    isProcessed: true,
    analysisResult: {
      mahkemeAdi: 'Antalya 4. Aile Mahkemesi',
      dosyaNo: '2023/13579',
      tebligKonusu: 'Boşanma Davası',
      sonTarih: '2024-03-29',
    },
  },
  {
    barcode: '5001959340415',
    pdfPath: '/downloads/5001959340415.pdf',
    isProcessed: false,
    analysisResult: {
      mahkemeAdi: 'Bursa 5. İş Mahkemesi',
      dosyaNo: '2023/97531',
      tebligKonusu: 'İhtarname',
      sonTarih: '2024-04-12',
    },
  },
  {
    barcode: '5001959340416',
    pdfPath: '/downloads/5001959340416.pdf',
    isProcessed: false,
    analysisResult: {
      mahkemeAdi: 'Adana 6. Ağır Ceza Mahkemesi',
      dosyaNo: '2023/86420',
      tebligKonusu: 'Duruşma Günü',
      durusmaTarihi: '2024-04-19',
      durusmaSaati: '09:50',
      durusmaYeri: 'Tarsus 1. Asliye Hukuk Mahkemesi Duruşma',
    },
  },
]

