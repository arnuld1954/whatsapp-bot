
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 Tus valores directos (como pediste)
const VERIFY_TOKEN = "EAA0sxlRBkXgBRLR0TNfAzglpJ9vw1Y5XDqySwiTAD4r5AB1F6ZASUuvhL1fG6GCJo2p8Y0cd0DXlbC1WxY3Kxj5Kaen9u4AZCv451Vn2fOAO0lnKqUi0UJK8jArgc6zhseEYP6qtRUuPPre8yAO4skx7B6MPTY5VifZAs9uaAJDhKFEdtofa6GBPXqg5v1WBDC9WK4zge7ZALp2ZA67rJwCWwAzDxhgOH6tAbKT1GxLIpmkZBxLZAHUH0IPUQwWZAsVCaKwHOWWArrunGtgcqQZDZD";
const WHATSAPP_TOKEN = "EAA0sxlRBkXgBRLR0TNfAzglpJ9vw1Y5XDqySwiTAD4r5AB1F6ZASUuvhL1fG6GCJo2p8Y0cd0DXlbC1WxY3Kxj5Kaen9u4AZCv451Vn2fOAO0lnKqUi0UJK8jArgc6zhseEYP6qtRUuPPre8yAO4skx7B6MPTY5VifZAs9uaAJDhKFEdtofa6GBPXqg5v1WBDC9WK4zge7ZALp2ZA67rJwCWwAzDxhgOH6tAbKT1GxLIpmkZBxLZAHUH0IPUQwWZAsVCaKwHOWWArrunGtgcqQZDZD";
const PHONE_NUMBER_ID = "1102429786276713";
const PORT = process.env.PORT || 3000;

// Ruta raíz para comprobar que el servidor está activo
app.get("/", (req, res) => {
  res.status(200).send("Servidor activo");
});

// Verificación del webhook
app.get("/webhook", (req, res) => {
  console.log("🔎 GET /webhook recibido");
  console.log("🔎 Query params:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return res.status(200).send(challenge);
  }

  console.log("❌ Verificación fallida");
  return res.sendStatus(403);
});

// Función para enviar mensaje
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message
    }
  };

  console.log("📤 Enviando mensaje a:", to);
  console.log("📤 Payload:", JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Respuesta de Meta:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("❌ Error enviando mensaje:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Recibir mensajes del webhook
app.post("/webhook", async (req, res) => {
  console.log("📩 POST /webhook recibido");
  console.log("📩 Body completo:");
  console.log(JSON.stringify(req.body, null, 2));

  // Responder 200 rápido a Meta
  res.sendStatus(200);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("ℹ️ Evento recibido, pero no es un mensaje de usuario.");
      return;
    }

    const from = message.from;
    const type = message.type;

    console.log("👤 Número remitente:", from);
    console.log("🧩 Tipo de mensaje:", type);

    if (type !== "text") {
      console.log("ℹ️ Tipo no manejado:", type);
      await sendWhatsAppMessage(from, "Por ahora solo puedo responder mensajes de texto.");
      return;
    }

    const userText = message.text?.body?.trim() || "";
    const text = userText.toLowerCase();

    console.log("💬 Texto recibido:", userText);

    let reply = "No entendí tu mensaje.";

    if (text === "hola") {
      reply = "Hola 👋 soy tu bot de WhatsApp.";
    } else if (text === "menu" || text === "menú") {
      reply = "Opciones:\n1. horario\n2. soporte\n3. estado";
    } else if (text === "1" || text === "horario") {
      reply = "Atendemos de lunes a viernes de 8:00 a.m. a 5:00 p.m.";
    } else if (text === "2" || text === "soporte") {
      reply = "Con gusto te ayudamos. Escribe tu consulta y te respondemos.";
    } else if (text === "3" || text === "estado") {
      reply = "El sistema está funcionando correctamente ✅";
    } else {
      reply = `Recibí tu mensaje: ${userText}`;
    }

    await sendWhatsAppMessage(from, reply);
    console.log("✅ Respuesta enviada al usuario");

  } catch (error) {
    console.error("❌ Error procesando webhook:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
});

// Levantar servidor (IMPORTANTE para Render)
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
