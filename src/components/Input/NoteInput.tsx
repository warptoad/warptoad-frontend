import React, { useRef } from "react";
import { loadNotes, saveNotes, type WarptoadNote, type WarptoadNoteStorageEntry } from "../utils/depositFunctionality";

type NoteInputProps = {
  onImported?: (notes: WarptoadNoteStorageEntry[]) => void;
};

export default function NoteInput({ onImported }: NoteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow selecting the same file again
    if (!file) return;

    if (!file.name.startsWith("warptoad") || !file.name.endsWith(".txt")) {
      alert("File must start with 'warptoad' and be a .txt file.");
      return;
    }

    try {
      const text = await file.text();
      const parsed: WarptoadNote = JSON.parse(text);

      // Save to localStorage
      saveNotes([
        {
          isAvailable: true,
          note: parsed
        }
      ]);
      const merged = loadNotes()

      // Trigger callback if provided
      onImported?.(merged);
    } catch {
      alert("Invalid JSON in file.");
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-outline w-full"
        onClick={openPicker}
      >
        Import Warptoad Notes
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
