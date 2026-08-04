"use client";

import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999998]"
        onClick={onCancel}
      />

      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6">

        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6">

          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">

            <AlertTriangle
              size={34}
              className="text-red-600"
            />

          </div>

          <h2 className="text-2xl font-black text-center mt-6">
            {title}
          </h2>

          <p className="text-zinc-500 text-center mt-3 leading-7">
            {description}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">

            <button
              onClick={onCancel}
              className="
                h-12
                rounded-2xl
                border
                border-zinc-300
                font-semibold
                hover:bg-zinc-100
                transition
              "
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className="
                h-12
                rounded-2xl
                bg-red-600
                text-white
                font-semibold
                hover:bg-red-700
                transition
              "
            >
              {confirmText}
            </button>

          </div>

        </div>

      </div>
    </>
  );
}