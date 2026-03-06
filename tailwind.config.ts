import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#2563EB",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#1E3A8A",
                    foreground: "#FFFFFF",
                }
            },
        },
    },
    plugins: [],
};
export default config;
