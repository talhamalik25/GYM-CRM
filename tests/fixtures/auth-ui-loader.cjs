const { transformSync } = require("next/dist/build/swc");

module.exports = function transformAuthFixture(source) {
  return transformSync(source, {
    filename: this.resourcePath,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
    module: { type: "es6" },
  }).code;
};
