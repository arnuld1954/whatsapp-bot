const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 Tus valores directos (como pediste)
const VERIFY_TOKEN = "EAA0sxlRBkXgBRKt0yoJwLRqSLU0gZCvlxLzVRGA4s5oZAu8pBtVl4eKM78zNMJFJ0zUKaqo613m6GKxVYx98jZCL0Iv0uq5jX3RGqjmZCydhwpFm7W46KBZBiEgWZCVuHG9uDB0HvKZAfbqFJXYaJZCxG3Ja1HvOpAo3ZBKpuCCRrVtZCxxoZAH08VrNOOaBClXLuoqBVBPcnYAZCMjQ3fYWaFCOOaERyXg4b7SrHf1BdluSbB4Q8bGp8H79qtk4IbpSU9hFME9o0T1uCVsoAZBnbnB0ZD";
const WHATSAPP_TOKEN = "EAA0sxlRBkXgBRKt0yoJwLRqSLU0gZCvlxLzVRGA4s5oZAu8pBtVl4eKM78zNMJFJ0zUKaqo613m6GKxVYx98jZCL0Iv0uq5jX3RGqjmZCydhwpFm7W46KBZBiEgWZCVuHG9uDB0HvKZAfbqFJXYaJZCxG3Ja1HvOpAo3ZBKpuCCRrVtZCxxoZAH08VrNOOaBClXLuoqBVBPcnYAZCMjQ3fYWaFCOOaERyXg4b7SrHf1BdluSbB4Q8bGp8H79qtk4IbpSU9hFME9o0T1uCVsoAZBnbnB0ZD";
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

// Función para enviar mensaje de texto
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
    throw error;
  }
}

// Función para enviar botones interactivos
async function sendWhatsAppButtons(to, bodyText, button1Id, button1Title, button2Id, button2Title) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: bodyText
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: button1Id,
              title: button1Title
            }
          },
          {
            type: "reply",
            reply: {
              id: button2Id,
              title: button2Title
            }
          }
        ]
      }
    }
  };

  console.log("📤 Enviando botones a:", to);
  console.log("📤 Payload botones:", JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Botones enviados:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("❌ Error enviando botones:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
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

    // Manejo de botones
    if (type === "interactive") {
      const buttonReply = message.interactive?.button_reply;
      const buttonId = buttonReply?.id;
      const buttonTitle = buttonReply?.title;

      console.log("🔘 Botón presionado:", buttonId, buttonTitle);

      if (buttonId?.startsWith("confirmar_nombre|")) {
        const nombre = buttonId.split("|")[1] || "";
        await sendWhatsAppMessage(from, `Perfecto ✅, nombre confirmado: ${nombre}`);
        console.log("✅ Nombre confirmado");
        return;
      }

      if (buttonId === "rechazar_nombre") {
        await sendWhatsAppMessage(from, "Está bien. Escribe tu nombre nuevamente.");
        console.log("✅ Se pidió el nombre nuevamente");
        return;
      }

      await sendWhatsAppMessage(from, "No entendí la opción seleccionada.");
      return;
    }

    // Manejo de texto
    if (type !== "text") {
      console.log("ℹ️ Tipo no manejado:", type);
      await sendWhatsAppMessage(from, "Por ahora solo puedo responder mensajes de texto.");
      return;
    }

    const userText = message.text?.body?.trim() || "";
    const text = userText.toLowerCase();

    console.log("💬 Texto recibido:", userText);

    // Flujo inicial
    if (text === "hola") {
      await sendWhatsAppMessage(from, "Hola 👋 Bienvenido. Por favor, escribe tu nombre.");
      console.log("✅ Se solicitó el nombre");
      return;
    }

    if (text === "menu" || text === "menú") {
      await sendWhatsAppMessage(from, "Por favor, escribe tu nombre para continuar.");
      console.log("✅ Menú inicial enviado");
      return;
    }

    if (text === "1" || text === "horario") {
      await sendWhatsAppMessage(from, "Atendemos de lunes a viernes de 8:00 a.m. a 5:00 p.m.");
      console.log("✅ Horario enviado");
      return;
    }

    if (text === "2" || text === "soporte") {
      await sendWhatsAppMessage(from, "Con gusto te ayudamos. Primero escribe tu nombre.");
      console.log("✅ Soporte enviado");
      return;
    }

    if (text === "3" || text === "estado") {
      await sendWhatsAppMessage(from, "El sistema está funcionando correctamente ✅");
      console.log("✅ Estado enviado");
      return;
    }

    // Cualquier otro texto se toma como nombre y se pide confirmación
    await sendWhatsAppButtons(
      from,
      `Tu nombre es *${userText}*. ¿Deseas confirmarlo?`,
      `confirmar_nombre|${userText}`,
      "Sí",
      "rechazar_nombre",
      "No"
    );

    console.log("✅ Se enviaron botones de confirmación");

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
