import { demoLocations, getDemoLocationById } from "@/lib/demoData";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LocationRecord = {
  id: number;
  name: string;
  building: string;
  floor: string | null;
  description: string | null;
  qr_slug: string;
};

export type LocationLookupResult = {
  location: LocationRecord | null;
  source: "supabase" | "seed-fallback";
  error?: string;
};

const locationSelect = "id,name,building,floor,description,qr_slug";

export async function getLocationById(
  locationId: string,
): Promise<LocationLookupResult> {
  const fallback = getDemoLocationById(locationId);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      location: fallback,
      source: "seed-fallback",
      error: "Supabase env vars are not configured.",
    };
  }

  const id = Number(locationId);

  if (!Number.isInteger(id)) {
    return {
      location: null,
      source: "seed-fallback",
      error: "Location id must be an integer.",
    };
  }

  const { data, error } = await supabase
    .from("locations")
    .select(locationSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      location: fallback,
      source: "seed-fallback",
      error: error.message,
    };
  }

  if (!data) {
    return {
      location: fallback,
      source: "seed-fallback",
      error: "Location was not found in Supabase.",
    };
  }

  return {
    location: data,
    source: "supabase",
  };
}

export async function getLocationBySlug(
  slug: string,
): Promise<LocationLookupResult> {
  const fallback = demoLocations.find((l) => l.qr_slug === slug) ?? null;
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      location: fallback,
      source: "seed-fallback",
      error: "Supabase env vars are not configured.",
    };
  }

  const { data, error } = await supabase
    .from("locations")
    .select(locationSelect)
    .eq("qr_slug", slug)
    .maybeSingle();

  if (error) {
    return { location: fallback, source: "seed-fallback", error: error.message };
  }

  if (!data) {
    return {
      location: fallback,
      source: "seed-fallback",
      error: "Location was not found in Supabase.",
    };
  }

  return { location: data, source: "supabase" };
}
