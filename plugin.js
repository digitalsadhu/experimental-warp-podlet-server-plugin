import { parse } from "node:path";
import { readFile } from "node:fs/promises";
import * as lightning from "lightningcss";
import { createGenerator } from "@unocss/core";
// @ts-ignore
import { presetWarp } from "@warp-ds/uno";

const uno = createGenerator({ presets: [presetWarp()] });

const buildCSS = async (content) => {
  const { css } = await uno.generate(content);
  const { code: minified } = lightning.transform({
    code: Buffer.from(css),
    minify: true,
    targets: {
      safari: 13 << 16,
    },
    filename: "warp-css-plugin"
  });
  return minified.toString();
};

export default () => ({
  name: "esbuild-warp-css",
  setup(build) {
    build.onLoad({ filter: /(content|fallback|src\/.*)\.(ts|js)$/ }, async (args) => {
      const { ext } = parse(args.path);
      const input = await readFile(args.path, { encoding: "utf8" });
      if (!input.includes("@warp-css")) return;
      const css = await buildCSS(input);
      const contents = `${input.replace("@warp-css", css)}`;
      return {
        contents,
        loader: ext.replace(".", ""),
      };
    });
  },
});
