export default {
    paths: ["tests/bdd/features/**/*.feature"],
    import: [
      "tests/bdd/support/**/*.ts",
      "tests/bdd/steps/**/*.ts"
    ],
    format: ["progress", "summary"]
};
