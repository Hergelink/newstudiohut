"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function FormSubmit({
  idle,
  pending,
  disabled = false,
}: {
  idle: string;
  pending: string;
  disabled?: boolean;
}) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending || disabled}>
      {status.pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="size-4" aria-hidden="true" />
      )}
      {status.pending ? pending : idle}
    </Button>
  );
}
