import express from "express";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from 'telegram/events';

const app = express();
const port = process.env.PORT || 3000;

const apiId = 11972191;
const apiHash = "d0f53fb7323eb59f54e875fd16d7f1ef";
const stringSession = new StringSession(""); 

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5
});

async function startUserBot() {
  console.log("Telegram hisobingizga ulanish boshlandi...");
  
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Ulanish vaqti tugadi!")), 60000) // 60 soniyadan keyin tugadi
  );

  try {
    await Promise.race([
      client.start({
        phoneNumber: async () => {
          console.log("Telefon raqami so'ralmoqda...");
          return await input("Iltimos, telefon raqamingizni kiriting (+998xxxxxxxxx formatida): ");
        },
        password: async () => {
          console.log("Ikki bosqichli autentifikatsiya paroli so'ralmoqda...");
          return await input("Iltimos, ikki bosqichli autentifikatsiya parolingizni kiriting (agar mavjud bo'lsa): ");
        },
        phoneCode: async () => {
          console.log("Telegram ilovangizga tasdiqlash kodi yuborildi.");
          return await input("Iltimos, qabul qilgan kodingizni kiriting: ");
        },
        onError: (err) => {
          console.error("Ulanishda xatolik yuz berdi:", err);
        },
      }),
      timeout,
    ]);

    console.log("Telegram hisobingizga muvaffaqiyatli ulandingiz!");
    const sessionString = client.session.save();
    console.log("Keyingi safar foydalanish uchun session stringini saqlang:");
    console.log(sessionString);

    await runBot();

  } catch (error) {
    console.error("Ulanishda xatolik yuz berdi:", error);
  }
}

app.get("/", (req, res) => {
  res.send("Telegram User Bot ishlamoqda!");
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} portida ishlamoqda`);
  startUserBot().catch(console.error);
});

function input(message: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(message);
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Bot logikasi
async function runBot() {
  console.log("Bot ishga tushdi va xabarlarni tinglashni boshladi.");

  // /start buyrug'ini tinglash
  client.addEventHandler(async (event) => {
    const message: any = event.message;
    console.log("Xabar qabul qilindi:", message.text);
    if (message.text === '/start') {
      await client.sendMessage(message.chatId, {
        message: "Salom! Men yangi botman. Sizga qanday yordam bera olaman?"
      });
    }
  }, new NewMessage({}));

  // Barcha xabarlarni tinglash va aks ettirish
  client.addEventHandler(async (event) => {
    const message:any = event.message;
    if (message.text && message.text !== '/start') {
      console.log("Xabar aks ettirilmoqda:", message.text);
      await client.sendMessage(message.chatId, {
        message: `Siz aytdingiz: ${message.text}`
      });
    }
  }, new NewMessage({}));

  console.log("Bot xabarlarni tinglashni boshladi.");
}
