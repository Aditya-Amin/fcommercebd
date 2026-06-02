"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCategory } from "@/lib/api/categories";
import type { Category } from "@/lib/types/product";
import type { NewCategoryCopy } from "@/lib/types/product-copy";

interface Props {
  label?: string;
  value: string;
  categories: Category[];
  onChange: (slug: string) => void;
  onCategoryCreated: (category: Category) => void;
  copy: NewCategoryCopy;
  includeAll?: { label: string };
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function CategorySelect({
  label,
  value,
  categories,
  onChange,
  onCategoryCreated,
  copy,
  includeAll,
  onError,
  onSuccess
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const NEW_VALUE = "__new__";

  function handleSelect(val: string) {
    if (val === NEW_VALUE) {
      setOpen(true);
      return;
    }
    onChange(val);
  }

  async function handleCreate() {
    setError(null);
    if (!name.trim()) {
      setError(copy.errorRequired);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCategory(name);
      onCategoryCreated(created);
      onChange(created.slug);
      onSuccess?.(copy.success);
      setName("");
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.errorGeneric;
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const options = [
    ...(includeAll ? [{ label: includeAll.label, value: "all" }] : []),
    ...categories.map((c) => ({ label: c.name, value: c.slug })),
    { label: copy.trigger, value: NEW_VALUE }
  ];

  return (
    <>
      <Select
        label={label}
        value={value}
        onChange={(e) => handleSelect((e.target as HTMLSelectElement).value)}
        options={options}
      />

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
            setName("");
            setError(null);
          }
        }}
        title={copy.title}
        description={copy.description}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {copy.cancel}
            </Button>
            <Button
              onClick={handleCreate}
              loading={submitting}
              leftIcon={!submitting ? <Plus className="h-4 w-4" /> : undefined}
            >
              {submitting ? copy.submitting : copy.submit}
            </Button>
          </>
        }
      >
        <Input
          label={copy.nameLabel}
          placeholder={copy.namePlaceholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          autoFocus
        />
      </Modal>
    </>
  );
}
