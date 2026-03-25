



require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "EAA0sxlRBkXgBRLR0TNfAzglpJ9vw1Y5XDqySwiTAD4r5AB1F6ZASUuvhL1fG6GCJo2p8Y0cd0DXlbC1WxY3Kxj5Kaen9u4AZCv451Vn2fOAO0lnKqUi0UJK8jArgc6zhseEYP6qtRUuPPre8yAO4skx7B6MPTY5VifZAs9uaAJDhKFEdtofa6GBPXqg5v1WBDC9WK4zge7ZALp2ZA67rJwCWwAzDxhgOH6tAbKT1GxLIpmkZBxLZAHUH0IPUQwWZAsVCaKwHOWWArrunGtgcqQZDZD";
const PORT = 3000;

// Pega aquí tu token temporal o permanente
const WHATSAPP_TOKEN = "EAA0sxlRBkXgBRLR0TNfAzglpJ9vw1Y5XDqySwiTAD4r5AB1F6ZASUuvhL1fG6GCJo2p8Y0cd0DXlbC1WxY3Kxj5Kaen9u4AZCv451Vn2fOAO0lnKqUi0UJK8jArgc6zhseEYP6qtRUuPPre8yAO4skx7B6MPTY5VifZAs9uaAJDhKFEdtofa6GBPXqg5v1WBDC9WK4zge7ZALp2ZA67rJwCWwAzDxhgOH6tAbKT1GxLIpmkZBxLZAHUH0IPUQwWZAsVCaKwHOWWArrunGtgcqQZDZD";

// Pega aquí tu Phone Number ID
const PHONE_NUMBER_ID = "1102429786276713";

// Verificación del webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Función para enviar mensaje
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: message }
  };

  await axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}

// Recibir mensajes y responder
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    console.log("📩 Mensaje recibido:");
    console.log(JSON.stringify(req.body, null, 2));

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    const type = message.type;

    if (type === "text") {
      const text = message.text?.body?.trim().toLowerCase();

      let reply = "No entendí tu mensaje.";

      if (text === "hola") {
        reply = "Hola 👋 soy tu bot de WhatsApp.";
      } else if (text === "menu") {
        reply = "Opciones:\n1. horario\n2. soporte\n3. estado";
      } else if (text === "horario") {
        reply = "Atendemos de lunes a viernes de 8am a 5pm.";
      } else {
        reply = `Recibí tu mensaje: ${message.text?.body}`;
      }

      await sendWhatsAppMessage(from, reply);
      console.log("✅ Respuesta enviada");
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});