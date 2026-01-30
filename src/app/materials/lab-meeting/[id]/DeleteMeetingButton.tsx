'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteLabMeeting } from '@/actions/lab-meeting'

interface Props {
    meetingId: string
}

export function DeleteMeetingButton({ meetingId }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('이 랩미팅을 삭제하시겠습니까? 연결된 모든 자료도 함께 삭제됩니다.')) {
            return
        }

        setLoading(true)
        const result = await deleteLabMeeting(meetingId)

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push('/materials/lab-meeting')
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="삭제"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    )
}
