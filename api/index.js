import { create } from "ipfs-http-client";
import 'dotenv/config'
import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();

app.use(cors());
app.use(multer().single("logo"));

const PORT = 5001;

// Routes
app.post("/api/upload", async (req, res) => {
  const projectId = process.env.INFURA_ID;
  const projectSecret = process.env.INFURA_SECRET;

  const auth =
    "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

  const client = create({
    host: "ipfs.infura.io",
    port: PORT,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const { cid } = await client.add(req.file.buffer);
  await client.pin.add(cid);

  res.send(cid.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));