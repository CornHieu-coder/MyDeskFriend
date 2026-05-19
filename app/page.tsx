import { HomeContent } from "./home-content";
import { getLocationById } from "@/lib/locations";
import { signDeskToken } from "@/lib/qr-token";

export default async function Home() {
  const desk47 = await getLocationById("47");
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const desk47Token = signDeskToken(47);
  const desk47ScanUrl = `${baseUrl}/scan?desk=desk-47&token=${desk47Token}`;

  return <HomeContent desk47={desk47} desk47ScanUrl={desk47ScanUrl} />;
}
