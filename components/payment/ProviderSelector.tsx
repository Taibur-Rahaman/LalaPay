'use client';

export type PaymentProvider = 'BKASH' | 'NAGAD';

type Props = {
  value: PaymentProvider | null;
  onChange: (provider: PaymentProvider) => void;
  bkashAvailable?: boolean;
  nagadAvailable?: boolean;
};

export default function ProviderSelector({
  value,
  onChange,
  bkashAvailable = true,
  nagadAvailable = true,
}: Props) {
  const options: Array<{ id: PaymentProvider; name: string; available: boolean }> = [
    { id: 'BKASH', name: 'bKash', available: bkashAvailable },
    { id: 'NAGAD', name: 'Nagad', available: nagadAvailable },
  ];

  return (
    <fieldset>
      <legend>Choose payment method</legend>
      <div>
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name="payment-provider"
              value={option.id}
              checked={value === option.id}
              disabled={!option.available}
              onChange={() => onChange(option.id)}
            />
            {option.name}
            {!option.available && ' (currently unavailable)'}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
