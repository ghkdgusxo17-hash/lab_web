import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout'
import { ContactForm } from './ContactForm'
import { Mail, MapPin, MessageCircleMore, Phone } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact Us | CPE Lab',
    description: '화학공정연구실에 문의하세요',
}

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Contact Us
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            연구실에 대해 궁금한 점이 있으시면 문의해주세요
                        </p>
                    </div>

                    <div className="mb-10 rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-6 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/20 md:p-8">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-slate-950/60 dark:text-cyan-300">
                                    <MessageCircleMore className="h-4 w-4" />
                                    익명 문의하기
                                </div>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                                    이름 없이 편하게 물어보고 싶다면
                                    <br />
                                    익명 전용 문의방을 이용해보세요
                                </h2>
                                <p className="mt-3 text-slate-600 dark:text-slate-300">
                                    랩실 생활, 연구 주제, 대학원 고민, 취업·진로 같은 질문을 익명 방에서 이어서 주고받을 수 있습니다.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link href="/contact/anonymous" className="btn-primary px-6 py-3 text-white">
                                    익명 전용 페이지 가기
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-5 gap-8">
                        {/* Contact Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    연락처
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">주소</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                강원특별자치도 강릉시 죽헌길 7<br />
                                                공과대학 2호관 생명화학공학과 419호
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">이메일</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                huckwnmo99@gwnu.ac.kr
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">전화</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                010-9891-2839
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                                    💡 문의 안내
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    대학원 입학, 연구 협력, 인턴십 등 다양한 문의를 환영합니다.
                                    빠른 시일 내에 답변 드리겠습니다.
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="md:col-span-3">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                                    문의하기
                                </h2>
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
