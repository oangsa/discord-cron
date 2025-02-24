import { NextResponse } from 'next/server'
import { createCanvas } from "canvas";
import axios from "axios";
import FormData from "form-data";

type CResponse = {
    message: string;
    success?: boolean;
}


async function generateProgressBar(percent: number): Promise<Buffer> {
    const width = 400;
    const height = 50;
    const progressWidth = (percent / 100) * width;

    const canvas = createCanvas(width + 10, height + 10);
    const ctx = canvas.getContext("2d");

    // Draw border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 20;
    ctx.strokeRect(5, 5, width, height);

    // Draw progress (Sky Blue)
    ctx.fillStyle = "skyblue";
    ctx.fillRect(5, 5, progressWidth, height);

    // Draw remaining part (Black)
    ctx.fillStyle = "black";
    ctx.fillRect(5 + progressWidth, 5, width - progressWidth, height);

    return canvas.toBuffer("image/png");
}

async function sendToDiscord(imageBuffer: Buffer) {
    const formData = new FormData();
    formData.append("file", imageBuffer, {
        filename: "progress_bar.png",
        contentType: "image/png",
    });

    formData.append("username", "Year Progress");

    try {
        await axios.post(process.env.URL as string, formData, {
            headers: formData.getHeaders(),
        });
        console.log("✅ Image sent to Discord webhook!");
    }
    catch (error) {
        console.error("❌ Error sending image:", error);
    }
}

async function sendMessagetoDiscord(message: string) {
    try {
        await axios.post(process.env.URL as string, {
            content: message,
            username: "Year Progress",
        });
        console.log("✅ Message sent to Discord webhook!");
    }
    catch (error) {
        console.error("❌ Error sending message:", error);
    }
}

export async function GET(): Promise<NextResponse<CResponse>> {
    const lastDay = new Date(new Date().getFullYear(), 11, 31);
    const today = new Date();

    const percent = ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (lastDay.getTime() - new Date(today.getFullYear(), 0, 1).getTime())) * 100;

    await sendMessagetoDiscord(`||@everyone||\n${new Date().getFullYear()} is ${percent.toFixed(2)}% complete!`);

    const buffer = await generateProgressBar(percent);

    // Attempt to send happy new year message
    if (new Date().getMonth() === 0 && new Date().getDate() === 1) {
        await sendMessagetoDiscord(`${new Date().getFullYear()-1} Ended!`);
        await sendMessagetoDiscord(`Happy New Year ${new Date().getFullYear()}!`);
    }

    await sendToDiscord(buffer);

    return NextResponse.json({ message: "OK" }, { status: 200 })
}
