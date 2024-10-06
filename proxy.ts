import { Axiom } from "@axiomhq/js";
import type { ExecutionContext } from "@cloudflare/workers-types"
import { Logtail } from "@logtail/edge"

export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext) {
        const axiom = new Axiom({ token: env.AXIOM_TOKEN })
        const baseLogger = new Logtail(env.BETTER_STACK_TOKEN)
        const logger = baseLogger.withExecutionContext(ctx)

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: baseHeaders()
            })
        }

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

        // Proxy request
        try {
            const response = await fetch(url, { headers: request.headers })
            const body = await response.text()
            try {
                logger.info(JSON.parse(body))
                axiom.ingest("alienware-arena-proxy", JSON.parse(body))
            } catch {
                logger.info(body)
                axiom.ingest("alienware-arena-proxy", { body })
            }

            return new Response(body, {
                status: response.status,
                headers: baseHeaders(),
            })
        } catch (error) {
            logger.error(error)
            return errorResponse(500, "An error occurred while communicating with Alienware Arena.")
        }
    },
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
