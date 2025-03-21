module.exports = {
    color: true,
    exit: true,
    extension: ["js", "cjs", "mjs"],
    package: "./package.json",
    parallel: false,
    recursive: false,
    require: "@babel/register",
    slow: 5000,
    spec: ["bot.spec.js"]
};