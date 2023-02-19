import { VercelRequest, VercelResponse } from '@vercel/node'
import path from 'path'

export default async (req: VercelRequest, res: VercelResponse) => {
    // Make CORS happy
    res
        .setHeader("Access-Control-Allow-Origin", "*")
        .setHeader("Access-Control-Allow-Methods", "GET")

    // Preflight requests
    if (req.method == "OPTIONS") {
        res.status(204).send("")
        return
    }

    const file = path.join(process.cwd(), 'files', 'test.json')
}
