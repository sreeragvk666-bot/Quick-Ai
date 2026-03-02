import OpenAI from "openai"
import sql from "../configs/db.js"
import { clerkClient } from "@clerk/express"
import axios from "axios"
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import FormData from "form-data"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";




const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt, length } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit reached. Please upgrade to premium.",
      })
    }

    const maxTokens = Math.min(length * 2, 4096)

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `
Write a detailed article of at least ${length} words.

Topic: ${prompt}

Rules:
- Minimum ${length} words
- Use headings and subheadings
- Write long, detailed paragraphs
- Do not stop early
- Do not summarize until the word count is reached
          `,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    })

    const content = response.choices[0].message.content

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      })
    }

    res.json({ success: true, content })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to generate article",
    })
  }
}


export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit reached. Please upgrade to premium.",
      })
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })

    // ✅ OPENAI-COMPATIBLE RESPONSE
    const content = response.choices?.[0]?.message?.content

    if (!content) {
      console.log("AI RAW RESPONSE:", response)
      return res.json({
        success: false,
        message: "Failed to generate blog title",
      })
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      })
    }

    res.json({ success: true, content })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}



export const generateImage = async (req, res) => {
  try {
    const {userId} = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const formData = new FormData()
    formData.append('prompt', prompt)
    const {data} =await axios.post('https://clipdrop-api.co/text-to-image/v1',formData,{
    headers: {'x-api-key': process.env.CLIPDROP_API_KEY,},
    responseType: 'arraybuffer',
    })

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`

    const {secure_url} = await cloudinary.uploader.upload(base64Image)

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`

    res.json({ success: true, content: secure_url })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const removeImageBackground = async (req, res) => {
  try {
    const {userId} = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const {secure_url} = await cloudinary.uploader.upload(image.path, {
      transformation: [{
        effect: 'background_removal',
        background_removal: 'remove_the_background'
      }]
    })

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'remove background from image', ${secure_url}, 'image')`

    res.json({ success: true, content: secure_url })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const {public_id} = await cloudinary.uploader.upload(image.path)

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{
        effect: `gen_remove:${object}`}],
      resource_type: 'image',
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`

    res.json({ success: true, content: imageUrl })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    // 🔒 Premium check
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // 📄 File validation
    if (!resume) {
      return res.json({
        success: false,
        message: "Resume file is required.",
      });
    }

    // 📦 Size check (5MB)
    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    // ✅ pdfjs-dist requires Uint8Array (NOT Buffer)
    const buffer = new Uint8Array(fs.readFileSync(resume.path));

    // ✅ Disable worker per-document (Node.js requirement)
    const loadingTask = pdfjs.getDocument({
      data: buffer,
      disableWorker: true,
    });

    const pdfDoc = await loadingTask.promise;

    let text = "";

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }

    // 🧠 Prompt
    const prompt = `
Review the following resume and provide constructive feedback.

Include:
- Strengths
- Weaknesses
- Areas for improvement

Resume Content:
${text}
`;

    // 🤖 Gemini (via OpenAI-compatible API)
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;

    // 💾 Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    // 🧹 Cleanup uploaded file
    fs.unlinkSync(resume.path);

    res.json({ success: true, content });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message || "Resume review failed",
    });
  }
};