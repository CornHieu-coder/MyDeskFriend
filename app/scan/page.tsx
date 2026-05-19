import { redirect } from "next/navigation";
import { getLocationBySlug } from "@/lib/locations";
import { verifyDeskToken } from "@/lib/qr-token";

type ScanPageProps = {
  searchParams: Promise<{ desk?: string; token?: string }>;
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const { desk, token } = await searchParams;

  if (!desk || !token) {
    redirect("/");
  }

  const result = await getLocationBySlug(desk);

  if (!result.location) {
    redirect("/");
  }

  const verification = verifyDeskToken(token, result.location.id);

  if (!verification.ok) {
    redirect("/");
  }

  redirect(`/desk/${result.location.id}`);
}
