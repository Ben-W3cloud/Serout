import { Button } from '../ui/Button';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransactionConfirm({ onConfirm, onCancel, isLoading = false }: Props) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <Button variant="primary" onClick={onConfirm} loading={isLoading}>
        Confirm & Execute
      </Button>
      <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
    </div>
  );
}
