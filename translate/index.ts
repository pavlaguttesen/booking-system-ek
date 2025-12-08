"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locals/en.json";
import da from "./locals/da.json";

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: en,
        },
        da: {
            translation: da,
        },
    },
    lng: "da",
    fallbackLng: "da",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;