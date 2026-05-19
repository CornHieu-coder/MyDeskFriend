import { notFound } from "next/navigation";
import { getLocationById } from "@/lib/locations";
import { getMessagesForLocation } from "@/lib/messages";
import { DeskArchiveClient } from "./desk-archive-client";

export const dynamic = "force-dynamic";

type DeskPageProps = {
  params: Promise<{
    locationId: string;
  }>;
};

const showDebugInfo = process.env.NODE_ENV === "development";

export default async function DeskPage({ params }: DeskPageProps) {
  const { locationId } = await params;
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
