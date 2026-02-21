import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import archiver from "archiver";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FOLDER_NAME = "extention";
const ZIP_NAME = `${FOLDER_NAME}.zip`;

export async function GET() {
  const folderPath = path.join(process.cwd(), FOLDER_NAME);

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return NextResponse.json(
      { error: `${FOLDER_NAME} folder not found` },
      { status: 404 },
    );
  }

  const passthrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => {
    passthrough.destroy(err);
  });

  archive.pipe(passthrough);
  archive.directory(folderPath, FOLDER_NAME);
  void archive.finalize();

  return new NextResponse(passthrough as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=\"${ZIP_NAME}\"`,
      "Cache-Control": "no-store",
    },
  });
}
