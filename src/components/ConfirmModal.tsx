import { useState } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  requireTyping?: boolean;
  typingText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  requireTyping = false,
  typingText = "SUPPRIMER TOUT",
  isDangerous = false,
  isLoading = false,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireTyping && inputValue !== typingText) {
      return;
    }
    onConfirm();
    setInputValue("");
  };

  const handleClose = () => {
    if (isLoading) return;
    setInputValue("");
    onClose();
  };

  const canConfirm = !requireTyping || inputValue === typingText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1730] rounded-2xl border border-[#2d2a4a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>

        <div className="mb-6">
          <p className="text-gray-300 whitespace-pre-line">{message}</p>
        </div>

        {requireTyping && (
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Tapez &quot;{typingText}&quot; pour confirmer :
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={typingText}
              className="w-full px-4 py-3 bg-[#0c0a1d] border border-[#2d2a4a] rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              autoFocus
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[#2d2a4a] rounded-xl font-medium hover:bg-[#3d3a5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`
              flex-1 px-4 py-3 rounded-xl font-medium transition-all
              ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
                  : "bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-50"
              }
              disabled:cursor-not-allowed
            `}
          >
            {isLoading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
