'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cancelReservation } from '@/actions/reservation'

interface CancelReservationButtonProps {
    reservationId: string
}

export function CancelReservationButton({ reservationId }: CancelReservationButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleCancel() {
        if (!confirm('예약을 취소하시겠습니까?')) return

        setLoading(true)
        const result = await cancelReservation(reservationId)

        if (result.error) {
            alert(result.error)
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleCancel}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="예약 취소"
        >
            <X className="w-4 h-4" />
        </button>
    )
}
