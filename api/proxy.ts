import { VercelRequest, VercelResponse } from '@vercel/node'
import axios, { AxiosRequestHeaders } from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
    // Make CORS happy
    res
        .setHeader("Access-Control-Allow-Origin", "*")
        .setHeader("Access-Control-Allow-Methods", "GET")
        .setHeader("Access-Control-Allow-Headers", "x-extension-jwt, x-extension-channel")

    // Preflight requests
    if (req.method == "OPTIONS") {
        res.status(204).send("")
        return
    }

    // Restrict to just Alienware Arena URls
    if (!req.query['url']) {
        res.status(400).send("URL parameter missing.")
        return
    }
    const url = req.query['url'] as string
    try {
        const host = new URL(url).host
        if (host != "www.alienwarearena.com" && host != "ehc5ey5g9hoehi8ys54lr6eknomqgr.ext-twitch.tv") {
            res.status(403).send("Unsupported URL.")
            return
        }
    } catch {
        res.status(400).send("Invalid URL.")
        return
    }

    // Set up headers for proxied request
    let headers: AxiosRequestHeaders = {}
    for (const key in req.headers) {
        if (key.startsWith("x-forwarded") || key.startsWith("x-vercel") || key == "x-real-ip" || key == "host") {
            continue
        }
        headers[key] = req.headers[key] as string
    }

    // Proxy request
    try {
        const response = await axios.get(url, {
            headers: headers,
            validateStatus: (_) => true,
        })
        res.status(response.status).send(response.data)
        return
    } catch (error) {
        console.error(error)
        res.status(500).send('An error occurred while fetching data.')
        return
    }
}
