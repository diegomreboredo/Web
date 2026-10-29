

export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      mensaje: "ReborIT funciona correctamente",
      baseDeDatosDisponible: Boolean(context.env.DB)
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
