

export async function onRequestPost(context) {
  const { request, env } = context;

  // Protección temporal: no acepta datos sin una clave.
  const clave = request.headers.get("X-Admin-Key");

  if (!env.ADMIN_KEY || clave !== env.ADMIN_KEY) {
    return Response.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const datos = await request.json();

    const nombre = String(datos.nombre || "").trim();
    const apellido = String(datos.apellido || "").trim();
    const telefono = String(datos.telefono || "").trim();
    const marca = String(datos.marca || "").trim();
    const modelo = String(datos.modelo || "").trim();
    const falla = String(datos.falla_declarada || "").trim();

    if (
      !nombre || !apellido || !telefono ||
      !marca || !modelo || !falla
    ) {
      return Response.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const anio = new Date().getUTCFullYear();

    // Genera el próximo número anual de forma atómica.
    const contador = await env.DB.prepare(`
      INSERT INTO numeracion_ordenes (anio, ultimo_numero)
      VALUES (?, 1)
      ON CONFLICT(anio)
      DO UPDATE SET ultimo_numero = ultimo_numero + 1
      RETURNING ultimo_numero
    `).bind(anio).first();

    const numeroOrden =
      `RB-${anio}-${String(contador.ultimo_numero).padStart(6, "0")}`;

    const cliente = await env.DB.prepare(`
      INSERT INTO clientes (nombre, apellido, telefono, email)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `).bind(
      nombre,
      apellido,
      telefono,
      String(datos.email || "").trim() || null
    ).first();

    const orden = await env.DB.prepare(`
      INSERT INTO ordenes (
        numero_orden,
        cliente_id,
        marca,
        modelo,
        color,
        imei,
        falla_declarada,
        estado_fisico,
        accesorios,
        observaciones
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, numero_orden, estado, creado_en
    `).bind(
      numeroOrden,
      cliente.id,
      marca,
      modelo,
      String(datos.color || "").trim() || null,
      String(datos.imei || "").trim() || null,
      falla,
      String(datos.estado_fisico || "").trim() || null,
      String(datos.accesorios || "").trim() || null,
      String(datos.observaciones || "").trim() || null
    ).first();

    return Response.json(
      {
        mensaje: "Orden registrada correctamente",
        orden
      },
      { status: 201 }
    );

  } catch (error) {
    return Response.json(
      { error: "No se pudo registrar la orden" },
      { status: 500 }
    );
  }
}
