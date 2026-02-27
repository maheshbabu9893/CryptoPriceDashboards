import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          background: "#f0f2f5",
          surface: "#ffffff",
          "surface-variant": "#f7f8fa",
          primary: "#2dce89",
          secondary: "#5e72e4",
          accent: "#11cdef",
          error: "#f5365c",
          success: "#2dce89",
          warning: "#fb6340",
          info: "#11cdef",
          "on-background": "#1a1a2e",
          "on-surface": "#1a1a2e",
        },
      },
    },
  },
});
