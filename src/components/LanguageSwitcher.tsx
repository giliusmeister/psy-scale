import { APP_LANGUAGES } from "../i18n";
import type { AppLanguage, UiCopy } from "../i18n";

type LanguageSwitcherProps = {
  selectedLanguage: AppLanguage;
  copy: UiCopy;
  onLanguageChange: (language: AppLanguage) => void;
};

export function LanguageSwitcher({
  selectedLanguage,
  copy,
  onLanguageChange,
}: LanguageSwitcherProps) {
  return (
    <div className="language-switcher" aria-label={copy.language}>
      {APP_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          title={copy.languageNames[language]}
          className={`language-switcher-button ${
            selectedLanguage === language ? "language-switcher-button--active" : ""
          }`}
          onClick={() => onLanguageChange(language)}
        >
          {language === "ru" ? "Rus" : "Eng"}
        </button>
      ))}
    </div>
  );
}
