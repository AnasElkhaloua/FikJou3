"use client";

type Props = Readonly<{
  action: () => Promise<void>;
  confirmMessage?: string;
  danger?: boolean;
  label: string;
}>;

export function LifecycleActionForm({
  action,
  confirmMessage,
  danger = false,
  label,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        className={danger ? "danger-button" : "text-button"}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
