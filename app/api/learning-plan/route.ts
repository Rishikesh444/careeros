import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDbOrNull } from "@/lib/mongodb"
import { generateGeminiAI } from "@/lib/gemini"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let profile: any = null
    let resume: any = null
    try {
      const db = await getDbOrNull()
      if (db) {
        const results = await Promise.all([
          db.collection("profiles").findOne({ userId: session.user.id }),
          db.collection("resumes").findOne({ userId: session.user.id }, { sort: { parsedAt: -1 } }),
        ])
        profile = results[0]
        resume = results[1]
      }
    } catch {
      // DB optional
    }

    const isAcademic = (t?: string | null) =>
      !t || /\b(b\.?tech|m\.?tech|b\.?e|b\.?s|m\.?s|bachelor|master|degree|cgpa|gpa|percentage|university|college|school|engineeringcgpa)\b/i.test(t)

    const rawRole = !isAcademic(profile?.title) ? profile?.title : (!isAcademic(profile?.roles) ? profile?.roles : (!isAcademic(resume?.title) ? resume?.title : null))
    const targetRole = rawRole || "Senior Full Stack Engineer"
    const skills = (resume?.skills || []).slice(0, 10).join(", ") || "React, TypeScript, Next.js, SQL"
    const atsScore = resume?.atsScore || profile?.resumeScore || 80

    return await generatePlan(targetRole, skills, atsScore)
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate learning plan" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { role, skills, atsScore } = body

    const isAcademic = (t?: string | null) =>
      !t || /\b(b\.?tech|m\.?tech|b\.?e|b\.?s|m\.?s|bachelor|master|degree|cgpa|gpa|percentage|university|college|school|engineeringcgpa)\b/i.test(t)

    const targetRole = !isAcademic(role) ? role : "Senior Full Stack Engineer"
    const skillsList = Array.isArray(skills) ? skills.join(", ") : (skills || "TypeScript, Next.js, React, SQL")

    return await generatePlan(targetRole, skillsList, atsScore || 80)
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate learning plan" }, { status: 500 })
  }
}

async function generatePlan(targetRole: string, skills: string, atsScore: number) {
  const seed = Date.now().toString().slice(-6)
  const prompt = `System: Technical Career Mentor. Output ONLY compact valid JSON.
Generate a fresh, personalized 4-week learning roadmap customized for role: "${targetRole}", Skills: "${skills}", ATS Score: ${atsScore}/100, Generation Seed: ${seed}.
Create practical, high-impact weekly themes and specific technical tasks for "${targetRole}".

JSON Format:
{
  "title": "4-Week Blueprint for ${targetRole}",
  "estimatedWeeklyHours": "6-8 hrs/week",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Core Specialization & Framework Mastery",
      "goal": "Master high-impact skills for ${targetRole}",
      "tasks": [
        { "id": "w1-1", "title": "Implement key domain architecture patterns", "completed": false },
        { "id": "w1-2", "title": "Refactor component/service layer with strict typing", "completed": false },
        { "id": "w1-3", "title": "Audit web vitals and optimize execution performance", "completed": false }
      ],
      "resource": "Official Documentation & Core Engineering Standards"
    },
    {
      "weekNumber": 2,
      "theme": "Scalable Backend & Data Architecture",
      "goal": "Build robust data layers and caching",
      "tasks": [
        { "id": "w2-1", "title": "Design optimized database schema & compound indexes", "completed": false },
        { "id": "w2-2", "title": "Integrate Redis caching layer with TTL eviction", "completed": false },
        { "id": "w2-3", "title": "Write end-to-end integration test suites", "completed": false }
      ],
      "resource": "High-Throughput Database Indexing Guide"
    },
    {
      "weekNumber": 3,
      "theme": "Cloud Infrastructure & CI/CD Pipelines",
      "goal": "Automate deployment and observability",
      "tasks": [
        { "id": "w3-1", "title": "Containerize services with multi-stage Docker builds", "completed": false },
        { "id": "w3-2", "title": "Configure GitHub Actions CI/CD workflows", "completed": false },
        { "id": "w3-3", "title": "Set up structured logging and error alerting", "completed": false }
      ],
      "resource": "Production CI/CD & Cloud Architecture Blueprint"
    },
    {
      "weekNumber": 4,
      "theme": "System Design & Interview Storytelling",
      "goal": "Showcase portfolio and master STAR interview delivery",
      "tasks": [
        { "id": "w4-1", "title": "Complete 2 System Design whiteboarding exercises", "completed": false },
        { "id": "w4-2", "title": "Publish open-source showcase repository with architecture diagram", "completed": false },
        { "id": "w4-3", "title": "Conduct STAR mock behavioral & technical interview prep", "completed": false }
      ],
      "resource": "System Design Primer & STAR Framework Playbook"
    }
  ]
}`

  try {
    const text = await generateGeminiAI(prompt, "You are a senior hiring manager. Return raw valid JSON only.")
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0])
      if (parsedData?.weeks && Array.isArray(parsedData.weeks)) {
        return NextResponse.json({ data: parsedData, source: "gemini" })
      }
    }
  } catch {
    // Fallback blueprint silently used when external AI endpoint unavailable
  }

  return NextResponse.json({
    data: {
      title: `4-Week Accelerated Blueprint to ${targetRole}`,
      estimatedWeeklyHours: "6-8 hrs/week",
      isFallback: true,
      weeks: [
        {
          weekNumber: 1,
          theme: "Advanced Architecture & Web Performance",
          goal: `Master high-impact engineering patterns tailored for ${targetRole}.`,
          tasks: [
            { id: "w1-1", title: "Refactor core UI components into modular compound components with strict TypeScript types", completed: true },
            { id: "w1-2", title: "Audit Web Vitals (LCP, INP, CLS) and implement route streaming with suspense", completed: true },
            { id: "w1-3", title: "Implement resilient state synchronization across offline/online transitions", completed: false },
          ],
          resource: "Next.js Advanced Patterns & Core Web Vitals Optimization",
        },
        {
          weekNumber: 2,
          theme: "High-Throughput Data Layer & Distributed Caching",
          goal: "Build robust data models with compound indexing, Redis caching, and transactional safety.",
          tasks: [
            { id: "w2-1", title: "Design optimized MongoDB/PostgreSQL schemas with compound indexes and query explain plans", completed: false },
            { id: "w2-2", title: "Integrate Redis distributed caching layer with TTL eviction for high-read APIs", completed: false },
            { id: "w2-3", title: "Author end-to-end integration test suites with 85%+ code coverage", completed: false },
          ],
          resource: "High Performance Database Indexing & Caching Strategies",
        },
        {
          weekNumber: 3,
          theme: "Cloud Infrastructure, Containers & Automated CI/CD",
          goal: "Containerize services and automate canary deployment pipelines with GitHub Actions.",
          tasks: [
            { id: "w3-1", title: "Containerize full-stack application using optimized multi-stage Docker builds", completed: false },
            { id: "w3-2", title: "Construct GitHub Actions CI/CD with automated linting, test runners, and preview deploys", completed: false },
            { id: "w3-3", title: "Configure cloud observability, structured logging, and APM error alerts", completed: false },
          ],
          resource: "Docker Multi-Stage Deep Dive & Production GitHub Actions Workflows",
        },
        {
          weekNumber: 4,
          theme: "System Design Whiteboarding & Executive STAR Storytelling",
          goal: "Synthesize learning into a standout portfolio centerpiece and master STAR interview delivery.",
          tasks: [
            { id: "w4-1", title: "Complete 3 end-to-end System Design challenges (Notification Engine, Rate Limiter, Payment Gateway)", completed: false },
            { id: "w4-2", title: "Publish a comprehensive architecture README on GitHub with Mermaid diagrams and live demo link", completed: false },
            { id: "w4-3", title: "Conduct 2 mock technical and behavioral screening rounds using the STAR framework", completed: false },
          ],
          resource: "System Design Primer & High-Bar Interview Playbook",
        },
      ],
    },
    source: "fallback-blueprint",
  })
}
