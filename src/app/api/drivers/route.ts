import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";

// 1. GET: Ambil seluruh data driver
export async function GET() {
  try {
    const drivers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        phone: users.phone,
        role: users.role,
        is_active: users.is_active,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.role, "driver"))
      .orderBy(desc(users.created_at));

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error("GET /api/drivers error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kurir/driver" },
      { status: 500 }
    );
  }
}

// 2. POST: Tambah akun driver baru
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "spradmexp" && payload.role !== "admexp")) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin (spradmexp / admexp) yang dapat membuat akun driver." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, password, phone } = body;

    if (!name || !username || !password || !phone) {
      return NextResponse.json(
        { error: "Nama, username, kata sandi, dan nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Check unique username
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Username '${cleanUsername}' sudah digunakan oleh pengguna lain` },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      name: String(name).trim(),
      username: cleanUsername,
      password_hash: passwordHash,
      phone: String(phone).trim(),
      role: "driver",
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: "Akun driver berhasil dibuat",
    });
  } catch (error) {
    console.error("POST /api/drivers error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data driver baru" },
      { status: 500 }
    );
  }
}

// 3. PATCH: Edit akun driver (Nama, Username, Password, No Telepon, Status Aktif)
// Dapat diakses oleh role 'spradmexp' dan 'admexp'
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "spradmexp" && payload.role !== "admexp")) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin (spradmexp / admexp) yang dapat mengubah data kurir & sopir." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { driverId, name, username, password, phone, isActive } = body;

    if (!driverId) {
      return NextResponse.json({ error: "ID driver wajib ditentukan" }, { status: 400 });
    }

    // Pastikan user tersebut ada dan memang ber-role 'driver'
    const targetDriver = await db
      .select()
      .from(users)
      .where(and(eq(users.id, Number(driverId)), eq(users.role, "driver")))
      .limit(1);

    if (targetDriver.length === 0) {
      return NextResponse.json({ error: "Data driver tidak ditemukan" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    // 1. Update Nama
    if (name && String(name).trim()) {
      updates.name = String(name).trim();
    }

    // 2. Update Username (cek duplikat)
    if (username && String(username).trim()) {
      const cleanUsername = String(username).trim().toLowerCase();
      if (cleanUsername !== targetDriver[0].username) {
        const duplicate = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.username, cleanUsername), ne(users.id, Number(driverId))))
          .limit(1);

        if (duplicate.length > 0) {
          return NextResponse.json(
            { error: `Username '${cleanUsername}' sudah dipakai oleh akun lain.` },
            { status: 400 }
          );
        }
        updates.username = cleanUsername;
      }
    }

    // 3. Update Password jika diisi
    if (password && String(password).trim()) {
      const trimmedPass = String(password).trim();
      if (trimmedPass.length < 4) {
        return NextResponse.json(
          { error: "Kata sandi minimal 4 karakter" },
          { status: 400 }
        );
      }
      updates.password_hash = hashPassword(trimmedPass);
    }

    // 4. Update No. Telepon / WA
    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }

    // 5. Update Status Aktif
    if (typeof isActive === "boolean") {
      updates.is_active = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang diperbarui" },
        { status: 400 }
      );
    }

    await db.update(users).set(updates).where(eq(users.id, Number(driverId)));

    return NextResponse.json({
      success: true,
      message: "Data akun driver berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH /api/drivers error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data driver" },
      { status: 500 }
    );
  }
}
