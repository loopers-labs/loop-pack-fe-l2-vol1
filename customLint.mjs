const plugin = {
  meta: {
    name: "customLint",
    version: "1.0.0",
  },
  configs: {
    all: {
      name: "customLint/all",
      rules: {
        "no-eval": "error",
        "no-console": "error",
      },
    },
  },
};

export default plugin;
