import type { OrderStatus as OrderStatusType } from '../api/orders'

const STEPS: OrderStatusType[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']

const LABELS: Record<OrderStatusType, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'On the way',
  DELIVERED: 'Delivered',
  FAILED: 'Payment Failed',
}

const ICONS: Record<OrderStatusType, string> = {
  PENDING: '🕐',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  OUT_FOR_DELIVERY: '🛵',
  DELIVERED: '🎉',
  FAILED: '❌',
}

interface OrderStatusProps {
  status: OrderStatusType
}

/**
 * Renders a horizontal step-progress bar showing the current order status.
 * Steps are highlighted up to and including the current status.
 */
export default function OrderStatus({ status }: OrderStatusProps) {
  if (status === 'FAILED') {
    return (
      <div className="text-center py-8 text-red-500">
        <div className="text-5xl mb-2">❌</div>
        <p className="font-semibold text-lg">Payment Failed</p>
        <p className="text-sm text-gray-500">Please try again from the menu.</p>
      </div>
    )
  }

  const currentIndex = STEPS.indexOf(status)

  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIndex
        return (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-colors ${done ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
              {ICONS[step]}
            </div>
            <p className={`text-xs mt-2 text-center font-medium ${done ? 'text-orange-600' : 'text-gray-400'}`}>
              {LABELS[step]}
            </p>
            {idx < STEPS.length - 1 && (
              <div className={`absolute hidden md:block h-0.5 flex-1 ${done ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
