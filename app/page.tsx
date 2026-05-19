import { HomeContent } from "./home-content";
import { getLocationById } from "@/lib/locations";

export default async function Home() {
  const desk47 = await getLocationById("47");

  return <HomeContent desk47={desk47} />;
}
