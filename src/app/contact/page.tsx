import { Metadata } from 'next'
import { Navbar } from '@/components/layout'
import { ContactForm } from './ContactForm'
import { Mail, MapPin, Phone } from 'lucide-react'

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
