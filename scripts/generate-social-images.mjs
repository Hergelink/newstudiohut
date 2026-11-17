import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";

const require = createRequire(import.meta.url);
const { ImageResponse } = require("next/og");
const root = new URL("../", import.meta.url);
const font = await readFile(
  new URL("scripts/assets/NotoSans-SemiBold.ttf", root),
);
const logo = await readFile(new URL("public/studiohut-logo.png", root));
const output = new URL("public/images/social/", root);
await mkdir(output, { recursive: true });

for (const locale of ["tr", "en"]) {
  const messages = JSON.parse(
    await readFile(new URL(`messages/${locale}.json`, root), "utf8"),
  );
  const lines = messages.Home.platformStatement.split("\n");
  const image = new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#2945ff",
          color: "white",
          fontFamily: "Noto Sans",
        },
      },
      h(
        "svg",
        {
          width: 1200,
          height: 630,
          viewBox: "0 0 1200 630",
          style: { position: "absolute", top: 0, left: 0 },
        },
        h("path", {
          d: "M 72 238 L 424 124 V 238 L 776 124 V 238 L 1128 124 V 558 H 72 Z",
          fill: "#e34545",
          stroke: "#000000",
          strokeWidth: 3,
          strokeLinejoin: "round",
        }),
      ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            top: 30,
            left: 72,
            padding: "10px 14px",
            display: "flex",
            backgroundColor: "white",
          },
        },
        h("img", {
          src: `data:image/png;base64,${logo.toString("base64")}`,
          width: 200,
          height: 47,
          alt: "StudioHut",
        }),
      ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            left: 110,
            top: 300,
            width: 980,
            height: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: "-3px",
            lineHeight: 1.1,
          },
        },
        ...lines.map((line) =>
          h("div", { key: line, style: { display: "flex" } }, line),
        ),
      ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            bottom: 22,
            left: 72,
            display: "flex",
            fontSize: 22,
            letterSpacing: "-0.5px",
          },
        },
        "studiohut.co",
      ),
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Noto Sans", data: font, weight: 600, style: "normal" }],
    },
  );
  const path = new URL(`studiohut-${locale}-v1.png`, output);
  await writeFile(path, Buffer.from(await image.arrayBuffer()));
  console.log(fileURLToPath(path));
}
