'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || 'http://localhost:8000'

// Get materials available for transcription (has labMeetingId, no existing transcription or failed)
export async function getMaterialsForTranscription() {
    const materials = await prisma.material.findMany({
        where: {
            labMeetingId: { not: null },  // Materials linked to a lab meeting
            OR: [
                { transcription: null },  // No existing transcription
                { transcription: { status: 'FAILED' } }  // Or failed transcription (can retry)
            ]
        },
        include: {
            uploader: {
                select: { id: true, name: true }
            },
            presenter: {
                select: { id: true, name: true }
            },
            labMeeting: {
                select: { id: true, date: true, title: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return materials
}

// Get all materials with transcription info
export async function getMaterialsWithTranscription() {
    const materials = await prisma.material.findMany({
        where: {
            labMeetingId: { not: null }  // Materials linked to a lab meeting
        },
        include: {
            uploader: {
                select: { id: true, name: true }
            },
            presenter: {
                select: { id: true, name: true }
            },
            labMeeting: {
                select: { id: true, date: true, title: true }
            },
            transcription: {
                select: {
                    id: true,
                    status: true,
                    summary: true,
                    createdAt: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return materials
}

// Get transcription by material ID
export async function getTranscriptionByMaterial(materialId: string) {
    const transcription = await prisma.meetingTranscription.findUnique({
        where: { materialId },
        include: {
            material: {
                include: {
                    uploader: { select: { id: true, name: true } },
                    presenter: { select: { id: true, name: true } },
                    labMeeting: { select: { id: true, date: true, title: true } }
                }
            },
            recorder: { select: { id: true, name: true } }
        }
    })

    return transcription
}

// Get all transcriptions
export async function getTranscriptions() {
    const transcriptions = await prisma.meetingTranscription.findMany({
        include: {
            material: {
                include: {
                    uploader: { select: { id: true, name: true } },
                    presenter: { select: { id: true, name: true } },
                    labMeeting: { select: { id: true, date: true, title: true } }
                }
            },
            recorder: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return transcriptions
}

// Create transcription (upload audio and start processing)
export async function createTranscription(formData: FormData) {
    console.log('[Transcription] Starting createTranscription...')
    const session = await auth()

    if (!session?.user) {
        console.log('[Transcription] No session')
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        console.log('[Transcription] User not approved')
        return { error: "승인된 멤버만 사용할 수 있습니다." }
    }

    const materialId = formData.get('materialId') as string
    const audioFile = formData.get('audioFile') as File

    console.log('[Transcription] materialId:', materialId)
    console.log('[Transcription] audioFile:', audioFile?.name, audioFile?.size)

    if (!materialId || !audioFile) {
        console.log('[Transcription] Missing materialId or audioFile')
        return { error: "발표자료와 오디오 파일을 선택해주세요." }
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: { transcription: true }
    })

    if (!material) {
        return { error: "발표자료를 찾을 수 없습니다." }
    }

    // Allow re-upload if previous transcription failed
    if (material.transcription) {
        if (material.transcription.status === 'FAILED') {
            // Delete the failed transcription to allow retry
            await prisma.meetingTranscription.delete({
                where: { id: material.transcription.id }
            })
        } else {
            return { error: "이미 트랜스크립션이 존재합니다." }
        }
    }

    // Validate audio file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/flac', 'audio/ogg', 'audio/webm']
    if (!allowedTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
        return { error: "지원하지 않는 오디오 형식입니다. (mp3, wav, m4a, flac, ogg, webm)" }
    }

    try {
        // Upload audio to Supabase Storage
        console.log('[Transcription] Starting upload to Supabase...')
        const timestamp = Date.now()
        const safeName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `transcriptions/${filename}`

        console.log('[Transcription] Converting file to buffer...')
        const bytes = await audioFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        console.log('[Transcription] Buffer size:', buffer.length)

        console.log('[Transcription] Uploading to Supabase storage...')
        const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: audioFile.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('[Transcription] Supabase upload error:', uploadError)
            return { error: "오디오 파일 업로드 중 오류가 발생했습니다." }
        }
        console.log('[Transcription] Upload successful!')

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        // Create transcription record
        console.log('[Transcription] Creating database record...')
        const transcription = await prisma.meetingTranscription.create({
            data: {
                materialId,
                audioUrl: urlData.publicUrl,
                audioFilename: audioFile.name,
                status: 'PENDING',
                recorderId: session.user.id,
                recorderName: session.user.name || '알 수 없음'
            }
        })
        console.log('[Transcription] Database record created:', transcription.id)

        // Call transcription service (async, don't wait)
        console.log('[Transcription] Starting transcription job...')
        startTranscriptionJob(transcription.id, urlData.publicUrl).catch(err => {
            console.error('Failed to start transcription job:', err)
        })

        revalidatePath('/meetings')
        console.log('[Transcription] Done! Returning success.')
        return { success: true, transcriptionId: transcription.id }
    } catch (error) {
        console.error('Create transcription error:', error)
        return { error: "트랜스크립션 생성 중 오류가 발생했습니다." }
    }
}

// Start transcription job (internal function)
async function startTranscriptionJob(transcriptionId: string, audioUrl: string) {
    try {
        // Update status to PROCESSING
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: { status: 'PROCESSING' }
        })

        // Download audio from Supabase and send to transcription service
        const audioResponse = await fetch(audioUrl)
        if (!audioResponse.ok) {
            throw new Error('Failed to download audio file')
        }

        const audioBlob = await audioResponse.blob()
        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.mp3')

        // Call transcription service with extended timeout (30 minutes for model loading + processing)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000)

        const response = await fetch(`${TRANSCRIPTION_SERVICE_URL}/process`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Transcription service error: ${response.status}`)
        }

        const result = await response.json()

        // Update with job ID
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: { jobId: result.job_id }
        })

        // Start polling for result
        pollTranscriptionResult(transcriptionId, result.job_id)

    } catch (error) {
        console.error('Start transcription job error:', error)
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            }
        })
    }
}

// Poll for transcription result (internal function)
async function pollTranscriptionResult(transcriptionId: string, jobId: string) {
    const maxAttempts = 120  // 30 minutes (15s interval)
    let attempts = 0

    const poll = async () => {
        try {
            const response = await fetch(`${TRANSCRIPTION_SERVICE_URL}/status/${jobId}`)
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`)
            }

            const status = await response.json()

            if (status.status === 'completed') {
                // Get full result
                const resultResponse = await fetch(`${TRANSCRIPTION_SERVICE_URL}/result/${jobId}`)
                const result = await resultResponse.json()

                await prisma.meetingTranscription.update({
                    where: { id: transcriptionId },
                    data: {
                        status: 'COMPLETED',
                        transcript: JSON.stringify(result.transcript),
                        summary: result.summary
                    }
                })
                return
            }

            if (status.status === 'failed') {
                await prisma.meetingTranscription.update({
                    where: { id: transcriptionId },
                    data: {
                        status: 'FAILED',
                        error: status.error || '처리 실패'
                    }
                })
                return
            }

            // Still processing, continue polling
            attempts++
            if (attempts < maxAttempts) {
                setTimeout(poll, 15000)  // Poll every 15 seconds
            } else {
                await prisma.meetingTranscription.update({
                    where: { id: transcriptionId },
                    data: {
                        status: 'FAILED',
                        error: '처리 시간 초과'
                    }
                })
            }
        } catch (error) {
            console.error('Poll error:', error)
            attempts++
            if (attempts < maxAttempts) {
                setTimeout(poll, 15000)
            }
        }
    }

    // Start polling after 30 seconds
    setTimeout(poll, 30000)
}

// Check and update transcription status (for client polling)
export async function checkTranscriptionStatus(transcriptionId: string) {
    const transcription = await prisma.meetingTranscription.findUnique({
        where: { id: transcriptionId },
        select: {
            id: true,
            status: true,
            summary: true,
            error: true
        }
    })

    return transcription
}

// Delete transcription
export async function deleteTranscription(transcriptionId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const transcription = await prisma.meetingTranscription.findUnique({
        where: { id: transcriptionId }
    })

    if (!transcription) {
        return { error: "트랜스크립션을 찾을 수 없습니다." }
    }

    // Only recorder or admin can delete
    if (transcription.recorderId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // Delete audio from Supabase Storage
        const urlParts = transcription.audioUrl.split('/storage/v1/object/public/uploads/')
        if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([filePath])
        }

        // Delete database record
        await prisma.meetingTranscription.delete({
            where: { id: transcriptionId }
        })

        revalidatePath('/meetings')
        return { success: true }
    } catch (error) {
        console.error('Delete transcription error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}

// Update material presenter
export async function updateMaterialPresenter(materialId: string, presenterId: string | null) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    try {
        await prisma.material.update({
            where: { id: materialId },
            data: { presenterId }
        })

        revalidatePath('/materials')
        revalidatePath('/meetings')
        return { success: true }
    } catch (error) {
        console.error('Update presenter error:', error)
        return { error: "발표자 변경 중 오류가 발생했습니다." }
    }
}

// Get lab meeting members for presenter selection
export async function getLabMembers() {
    const members = await prisma.user.findMany({
        where: {
            isApproved: true
        },
        select: {
            id: true,
            name: true,
            role: true
        },
        orderBy: { name: 'asc' }
    })

    return members
}
