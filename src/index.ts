import connectDB from "./config/database";
import { startTebligatListener } from "./jobs/tebligatListener";

async function main() {
  console.log("Uygulama BAŞLATILIYOR --- VERSİYON 2 ---");

  // Önce veritabanına bağlan
  await connectDB();

  // Veritabanı bağlantısı başarılı olduktan sonra dinleyiciyi başlat
  startTebligatListener();
}

main();
