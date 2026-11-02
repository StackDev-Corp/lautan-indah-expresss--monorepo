import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  shipments,
  shipment_checkpoints,
  fleets,
  users,
} from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || searchParams.get("month"); // "YYYY-MM" or "YYYY"

    let conditions: any[] = [eq(shipments.status, "terkirim")];

    if (period) {
      if (/^\d{4}-\d{2}$/.test(period)) {
        // Filter bulanan: YYYY-MM
        const [yearStr, monthStr] = period.split("-");
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        const startDate = new Date(year, m - 1, 1, 0, 0, 0);
        const endDate = new Date(year, m, 0, 23, 59, 59, 999);
        conditions.push(gte(shipments.created_at, startDate));
        conditions.push(lte(shipments.created_at, endDate));
      } else if (/^\d{4}$/.test(period)) {
        // Filter tahunan: YYYY
        const year = parseInt(period, 10);
        const startDate = new Date(year, 0, 1, 0, 0, 0);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        conditions.push(gte(shipments.created_at, startDate));
        conditions.push(lte(shipments.created_at, endDate));
      }
    }

    // Ambil rentang tanggal terlama dan terbaru data terkirim untuk opsi dinamis kalender
    const [bounds] = await db
      .select({
        earliest: sql<string>`MIN(${shipments.created_at})`,
        latest: sql<string>`MAX(${shipments.created_at})`,
      })
      .from(shipments)
      .where(eq(shipments.status, "terkirim"));

    const records = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        reference_po: shipments.reference_po,
        trip_code: shipments.trip_code,
        sender_company: shipments.sender_company,
        sender_contact: shipments.sender_contact,
        receiver_company: shipments.receiver_company,
        receiver_contact: shipments.receiver_contact,
        receiver_phone: shipments.receiver_phone,
        origin_city: shipments.origin_city,
        destination_city: shipments.destination_city,
        destination_address: shipments.receiver_address,
        service_type: shipments.service_type,
        status: shipments.status,
        actual_weight_kg: shipments.actual_weight_kg,
        total_colli: shipments.total_colli,
        total_cost: shipments.total_cost,
        received_by: shipments.received_by,
        received_date: shipments.received_date,
        shipped_date: shipments.shipped_date,
        created_at: shipments.created_at,
        driver_name: users.name,
        driver_phone: users.phone,
        plate_no: fleets.nopol,
        vehicle_name: fleets.vehicle_name,
      })
      .from(shipments)
      .leftJoin(users, eq(shipments.driver_id, users.id))
      .leftJoin(fleets, eq(shipments.fleet_id, fleets.id))
      .where(and(...conditions))
      .orderBy(desc(shipments.received_date), desc(shipments.created_at));

    // Ambil seluruh foto bukti checkpoint untuk resi terkirim ini
    const shipmentIds = records.map((r) => r.id);
    let checkpointsMap: Record<number, any[]> = {};

    if (shipmentIds.length > 0) {
      const allCheckpoints = await db
        .select({
          id: shipment_checkpoints.id,
          shipment_id: shipment_checkpoints.shipment_id,
          checkpoint_type: shipment_checkpoints.checkpoint_type,
          status_label: shipment_checkpoints.status_label,
          description: shipment_checkpoints.description,
          photo_url: shipment_checkpoints.photo_url,
          created_at: shipment_checkpoints.created_at,
        })
        .from(shipment_checkpoints);

      for (const cp of allCheckpoints) {
        if (!checkpointsMap[cp.shipment_id]) {
          checkpointsMap[cp.shipment_id] = [];
        }
        checkpointsMap[cp.shipment_id].push(cp);
      }
    }

    const items = records.map((s) => {
      const cps = checkpointsMap[s.id] || [];
      const departureCp = cps.find((c) => c.checkpoint_type === "departure_selfie" && c.photo_url);
      const arrivalDriverCp = cps.find((c) => c.checkpoint_type === "arrival_driver" && c.photo_url);
      const arrivalConfirmCp = cps.find((c) => c.checkpoint_type === "arrival_confirm" && c.photo_url);

      return {
        ...s,
        departure_photo: departureCp?.photo_url || null,
        arrival_driver_photo: arrivalDriverCp?.photo_url || null,
        arrival_confirm_photo: arrivalConfirmCp?.photo_url || null,
        confirmation_notes: arrivalConfirmCp?.description || null,
      };
    });

    return NextResponse.json({
      success: true,
      dateRange: {
        earliest: bounds?.earliest || null,
        latest: bounds?.latest || null,
      },
      items,
    });
  } catch (error) {
    console.error("Error fetching admin history:", error);
    return NextResponse.json(
      { error: "Gagal memuat histori pengiriman" },
      { status: 500 }
    );
  }
}
