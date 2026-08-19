"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface ObservationFormProps {
  onSubmit: (observation: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function ObservationForm({
  onSubmit,
  onCancel,
  isSubmitting,
  label = "What needs to be changed?",
  placeholder = "Describe the changes you require...",
  submitLabel = "Submit Change Request",
}: ObservationFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!value.trim()) {
      setError("This field is required.");
      return;
    }
    setError("");
    await onSubmit(value.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        rows={5}
        required
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
