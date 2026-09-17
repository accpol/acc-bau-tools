/**
 * Compatibility guard for the retired email-login fleet API (v0.2.0).
 * Browser uploads overlay files: omitting an old route does not remove it.
 * Never translate legacy mutations into new commands or bypass authentication.
 * The active API is app/api/fleet/[...path]/route.ts. This exact legacy URL
 * returns an explicit error; it does not read/write the database or Storage.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function retiredEndpoint(): Response {
  return Response.json(
    {
      error: "CLIENT_UPDATE_REQUIRED",
      message: "Odśwież aplikację i otwórz zakładkę Pojazdy. Ten adres dotyczy poprzedniej wersji programu.",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function GET(): Promise<Response> { return retiredEndpoint(); }
export async function POST(): Promise<Response> { return retiredEndpoint(); }
export async function PUT(): Promise<Response> { return retiredEndpoint(); }
export async function PATCH(): Promise<Response> { return retiredEndpoint(); }
export async function DELETE(): Promise<Response> { return retiredEndpoint(); }
