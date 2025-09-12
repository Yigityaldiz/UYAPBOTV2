export type AnalysisResult = {
  mahkemeAdi?: string
  dosyaNo?: string
  kararNo?: string
  tebligKonusu?: string
  sonTarih?: string
  durusmaTarihi?: string
  durusmaSaati?: string
  durusmaYeri?: string
}

export type Tebligat = {
  barcode: string
  pdfPath: string
  isProcessed: boolean
  analysisResult: AnalysisResult
}

