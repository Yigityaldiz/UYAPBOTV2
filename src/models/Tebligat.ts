import mongoose, { Schema, Document } from "mongoose";

// AI'dan gelen analiz sonucunun yapısını tanımlayan arayüz (interface)
interface IAnalysisResult {
  mahkemeAdi: string;
  dosyaNo: string;
  kararNo: string;
  tebligKonusu: string;
  sonTarih: string;
  durusmaTarihi: string;
}

// Veritabanındaki ana tebligat belgesinin yapısı
export interface ITebligat extends Document {
  barcode: string;
  pdfPath: string;
  isProcessed: boolean;
  analysisResult: IAnalysisResult;
  createdAt: Date; // Mongoose tarafından otomatik eklenecek
  updatedAt: Date; // Mongoose tarafından otomatik eklenecek
}

const AnalysisResultSchema: Schema = new Schema(
  {
    mahkemeAdi: { type: String },
    dosyaNo: { type: String },
    kararNo: { type: String },
    tebligKonusu: { type: String },
    sonTarih: { type: String },
    durusmaTarihi: { type: String },
  },
  { _id: false }
); // İç içe objelerde gereksiz _id oluşumunu engeller

const TebligatSchema: Schema = new Schema(
  {
    barcode: { type: String, required: true, unique: true, index: true },
    pdfPath: { type: String, required: true },
    isProcessed: { type: Boolean, default: true },
    analysisResult: { type: AnalysisResultSchema, required: true },
  },
  {
    // Her kayda otomatik olarak createdAt ve updatedAt alanları ekler.
    timestamps: true,
  }
);

export default mongoose.model<ITebligat>("Tebligat", TebligatSchema);
