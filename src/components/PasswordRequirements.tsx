import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordRequirements({
  password,
  showRequirements = true,
}: PasswordRequirementsProps) {
  const requirements = [
    {
      label: "Минимум 8 символов",
      met: password.length >= 8,
    },
    {
      label: "Содержит заглавную букву",
      met: /[A-ZА-Я]/.test(password),
    },
    {
      label: "Содержит строчную букву",
      met: /[a-zа-я]/.test(password),
    },
    {
      label: "Содержит цифру",
      met: /\d/.test(password),
    },
  ];

  if (!showRequirements || password.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Минимум 8 символов (рекомендуется: заглавные, строчные буквы и цифры)
      </p>
    );
  }

  const allMet = requirements.every((req) => req.met);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700">
        Требования к паролю:
      </p>
      {requirements.map((req, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 text-xs ${
            req.met ? "text-green-600" : "text-gray-500"
          }`}
        >
          {req.met ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          <span>{req.label}</span>
        </div>
      ))}
      {allMet && (
        <p className="text-xs text-green-600 font-medium mt-2">
          ✓ Пароль соответствует всем требованиям
        </p>
      )}
    </div>
  );
}
