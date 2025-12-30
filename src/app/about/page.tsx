import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout'
import { ResearchAreaGrid } from '@/components/about/ResearchAreaGrid'
import { getProfessorInfo } from '@/actions/professor'
import { getSiteSettings } from '@/actions/settings'
import { FlaskConical, GraduationCap, Award, ArrowRight, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '연구실 소개 | CPE Lab',
    description: '화학공정연구실(Chemical Process Engineering Lab) 소개',
}

export default async function AboutPage() {
    const settings = await getSiteSettings()
    const professor = await getProfessorInfo()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <section className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 tag-pill tag-primary mb-6">
                            <FlaskConical className="w-4 h-4" />
                            Chemical Process Engineering Lab
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                            미래 화학 공정의 <span className="text-gradient">혁신</span>을 선도합니다
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            강원대학교 생명화학공학과 화학공정연구실(CPE Lab)은 2020년 설립되어,
                            화학 공정의 효율화와 지속가능한 에너지 기술 개발을 위해 연구하고 있습니다.
                            기초 학문과 응용 기술의 융합을 통해 산업 현장의 실질적인 문제를 해결합니다.
                        </p>
                    </section>

                    {/* Research Areas */}
                    <section className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                연구 분야
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                CPE Lab의 핵심 연구 영역을 소개합니다
                            </p>
                        </div>
                        <ResearchAreaGrid videoEnabled={settings.videoEnabled} />
                    </section>

                    {/* Professor Info */}
                    <section className="mb-20">
                        <div className="bg-slate-50 dark:bg-slate-800/50 t-rounded-3xl p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-32 h-32 t-rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg">
                                    {professor.profileImage ? (
                                        <Image
                                            src={professor.profileImage}
                                            alt={professor.name}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-16 h-16 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                        <GraduationCap className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">지도교수</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                        {professor.name}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        {professor.university} {professor.department} {professor.position}
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        {professor.researchKeywords.slice(0, 3).map((keyword, index) => (
                                            <span
                                                key={index}
                                                className={`px-3 py-1 rounded-md text-sm ${index % 3 === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                    index % 3 === 1 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    }`}
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                        {professor.researchKeywords.length === 0 && (
                                            <span className="text-sm text-slate-400">연구 분야 키워드가 없습니다.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center">
                        <div className="relative overflow-hidden t-rounded-3xl p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                            {/* Decorative gradient border */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 opacity-50" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                                    <Award className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                    함께 연구할 인재를 찾습니다
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                                    대학원 진학, 연구 협력, 산학 프로젝트에 관심이 있으시다면<br className="hidden sm:block" />
                                    언제든 연락해주세요.
                                </p>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold t-rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                                >
                                    문의하기
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    )
}
