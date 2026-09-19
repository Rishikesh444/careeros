import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDbOrNull } from "@/lib/mongodb"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const defaultProfile = {
    userId: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    title: "Senior Full-Stack Engineer / Candidate",
    location: "Bengaluru, Karnataka",
    bio: "Passionate software engineer building high-impact scalable web applications & AI platforms.",
    roles: "Full Stack Engineer, Frontend Engineer, AI Engineer",
    locations: "Remote, Bengaluru",
    readiness: 85,
    resumeScore: 88,
    skillsScore: 90,
    experienceScore: 82,
    applicationsSent: 12,
    profileViews: 148,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  try {
    const db = await getDbOrNull()
    if (!db) {
      return NextResponse.json({ data: defaultProfile })
    }

    let profile = await db.collection("profiles").findOne({ userId: session.user.id })

    if (!profile) {
      const result = await db.collection("profiles").insertOne(defaultProfile)
      profile = { _id: result.insertedId, ...defaultProfile } as any
    }

    return NextResponse.json({ data: profile })
  } catch (err) {
    console.warn("Profile fetch fallback:", err)
    return NextResponse.json({ data: defaultProfile })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const updates = await request.json()
    const allowed = ["name", "email", "title", "location", "bio", "roles", "locations"]
    const sanitized = Object.fromEntries(
      Object.entries(updates ?? {}).filter(
        ([key, value]) => allowed.includes(key) && typeof value === "string"
      )
    )

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const db = await getDbOrNull()
    if (!db) {
      return NextResponse.json({ data: { userId: session.user.id, ...sanitized } })
    }

    const result = await db.collection("profiles").findOneAndUpdate(
      { userId: session.user.id },
      { $set: { ...sanitized, updatedAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    )

    return NextResponse.json({ data: result || { userId: session.user.id, ...sanitized } })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
