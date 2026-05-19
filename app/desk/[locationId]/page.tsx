import { notFound, redirect } from "next/navigation";
import { getLocationById } from "@/lib/locations";
import { getMessagesForLocation } from "@/lib/messages";
import { verifyDeskToken } from "@/lib/qr-token";
import { DeskArchiveClient } from "./desk-archive-client";

export const dynamic = "force-dynamic";

type DeskPageProps = {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ token?: string }>;
};

const showDebugInfo = process.env.NODE_ENV === "development";

export default async function DeskPage({ params, searchParams }: DeskPageProps) {
  const { locationId } = await params;
  const { token } = await searchParams;

  if (!token) {
    redirect("/");
  }

  const tokenResult = verifyDeskToken(token, Number(locationId));
  if (!tokenResult.ok) {
    redirect("/");
  }

  const [result, messageResult] = await Promise.all([
    getLocationById(locationId),
    getMessagesForLocation(locationId),
  ]);

  if (!result.location) {
    notFound();
  }

  return (
    <DeskArchiveClient
      debugInfo={
        showDebugInfo
          ? {
              locationSource: result.source,
              messageError: messageResult.error,
              messageSource: messageResult.source,
            }
          : undefined
      }
      location={result.location}
      messages={messageResult.messages}
    />
  );
}
