import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/careeros"
const options = {
  serverSelectionTimeoutMS: 2000,
  connectTimeoutMS: 2000,
  socketTimeoutMS: 3000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().catch(() => client)
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch(() => client)
}

export async function getDbOrNull() {
  try {
    const mongoClient = await Promise.race([
      clientPromise,
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("MongoDB connection timeout")), 2000)),
    ])
    if (!mongoClient) return null
    return mongoClient.db("careerai")
  } catch {
    return null
  }
}

export default clientPromise
