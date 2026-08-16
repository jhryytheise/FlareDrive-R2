ts
export async function onRequestGet(context) {
  return new Response(context.env["PUBURL"] || "", {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600"
    }
  });
}