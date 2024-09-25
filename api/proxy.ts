export const config = {
    runtime: "edge"
}

function baseHeaders() {
    return {
        "Content-Type": "application.json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "x-extension-jwt, x-extension-channel",
    }
}

function errorResponse(status: number, error: string): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: baseHeaders()
    })
}

export async function OPTIONS(request: Request): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: baseHeaders()
    })
}

export async function GET(request: Request): Promise<Response> {
    let urlParameter = (new URL(request.url)).searchParams.get("url")
    if (!urlParameter) {
        return errorResponse(400, "URL parameter missing.")
    }

    // Restrict to just Alienware Arena URLs
    let url: URL
    try {
        url = new URL(urlParameter)
    } catch {
        return errorResponse(400, "Invalid URL.")
    }
    if (url.host != "www.alienwarearena.com") {
        return errorResponse(403, "Unsupported URL.")
    }

    // Strip Vercel headers
    const headers = new Headers()
    for (const [ key, value ] of request.headers.entries()) {
        if (key.startsWith("x-forwarded") || key.startsWith("x-vercel") || key == "x-real-ip" || key == "host") {
            continue
        }
        headers.append(key, value)
    }

    // Proxy request
    try {
        const { body, status} = await fetch(url, { headers })
        return new Response(body, {
            status,
            headers: baseHeaders(),
        })
    } catch (error) {
        console.error(error)
        return errorResponse(500, "An error occurred while communicating with Alienware Arena.")
    }
}
