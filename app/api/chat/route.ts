import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDbOrNull } from "@/lib/mongodb"
import { generateGeminiAI } from "@/lib/gemini"

const GENERAL_HELPER_SYSTEM_PROMPT = `You are an intelligent, helpful AI Assistant.
Your goal is to directly, accurately, and clearly explain whatever the user asks.

Guidelines:
- Answer the user's specific prompt or question directly without forcing unrequested context about career roles or resumes.
- Provide clear, helpful explanations using bullet points, **bold text**, and clean line spacing for maximum readability.
- Be friendly, concise, and accurate.
`

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    try {
      const reply = await generateGeminiAI(message, GENERAL_HELPER_SYSTEM_PROMPT)
      return NextResponse.json({ reply })
    } catch (aiErr) {
      console.warn("Gemini generation notice, using helper fallback:", aiErr)
      const reply = getGeneralHelperResponse(message)
      return NextResponse.json({ reply })
    }
  } catch (err) {
    console.error("Chat route error:", err)
    return NextResponse.json({
      reply: "I am your AI helper! Ask me anything—technical concepts, code explanations, career tips, or general questions.",
    })
  }
}

function getGeneralHelperResponse(message: string): string {
  const lower = message.toLowerCase().trim()

  // Machine Learning / Overfitting
  if (lower.includes("overfit") || lower.includes("underfit") || lower.includes("machine learning") || lower.includes("ml")) {
    return `**Overfitting** in Machine Learning occurs when a model learns the training data too well—capturing noise, fluctuations, and outliers—causing it to perform exceptionally on training data but poorly on unseen test data.\n\n` +
      `**Key Causes**:\n` +
      `• High model complexity (too many parameters/layers relative to dataset size).\n` +
      `• Training for too many epochs without early stopping.\n` +
      `• Small or unrepresentative training dataset.\n\n` +
      `**How to Fix Overfitting**:\n` +
      `1. **Cross-Validation**: Use K-Fold cross-validation to evaluate generalization.\n` +
      `2. **Regularization**: Apply L1 (Lasso) or L2 (Ridge) penalties to constrain model weights.\n` +
      `3. **Dropout & Pruning**: Randomly deactivate neurons during training or prune decision tree depth.\n` +
      `4. **Data Augmentation**: Expand training dataset with diverse variations.`
  }

  // Large Language Models / AI
  if (lower.includes("llm") || lower.includes("large language model") || lower.includes("ai")) {
    return `**Large Language Models (LLMs)** are deep learning models trained on vast text corpora using Transformer architectures to process and generate natural language.\n\n` +
      `**Core Concepts**:\n` +
      `• **Transformer Architecture**: Uses self-attention mechanisms to understand contextual relationships between words.\n` +
      `• **RAG (Retrieval-Augmented Generation)**: Combines vector databases with LLMs to provide grounded, factual answers.\n` +
      `• **Fine-Tuning & Prompting**: Tailors base models for specific tasks or domain instructions.`
  }

  // System Design & Tech Architecture
  if (lower.includes("system design") || lower.includes("architecture") || lower.includes("scale")) {
    return `Here is a foundational **System Design Framework**:\n\n` +
      `1. **Requirements & Scope**: Define QPS, read/write ratio, latency SLA, and storage constraints.\n\n` +
      `2. **Core Components**: NGINX/Cloudflare Load Balancers -> API Gateways -> Microservices -> Redis Cache -> PostgreSQL/MongoDB.\n\n` +
      `3. **Scalability & Reliability**: Database sharding, read replicas, message queues (Kafka/RabbitMQ), and rate limiting.`
  }

  // Resume / Interview if specifically asked
  if (lower.includes("resume") || lower.includes("cv") || lower.includes("ats")) {
    return `Here are high-impact **Resume & ATS Optimization Tips**:\n\n` +
      `1. **Quantify Bullet Points**: Use *Action Verb + Tech Context + Measurable Outcome* (e.g. "Reduced API latency by 45% using Redis caching").\n\n` +
      `2. **ATS Keyword Alignment**: Ensure core technical skills match target job descriptions.\n\n` +
      `3. **Concise Layout**: Keep formatting clean with standard headings and clear section hierarchy.`
  }

  if (lower.includes("interview") || lower.includes("star")) {
    return `Here is the **STAR Framework** for answering interview questions:\n\n` +
      `• **Situation (15%)**: Context and background of the project or challenge.\n` +
      `• **Task (15%)**: The specific objective or problem assigned to you.\n` +
      `• **Action (50%)**: Clear steps, technical decisions, and leadership you personally took.\n` +
      `• **Result (20%)**: Measurable business outcomes and lessons learned.`
  }

  return `Here is a direct explanation for **"${message}"**:\n\n` +
    `Please ask any specific question about **"${message}"**—for example, asking for code examples, step-by-step concepts, or practical applications!`
}
