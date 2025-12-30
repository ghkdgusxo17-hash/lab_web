import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar, BookOpen, Settings, ArrowRight, FlaskConical, Atom, Database } from 'lucide-react'
import { Navbar } from '@/components/layout'

export default async function Home() {
    const features = [
        {
            icon: Users,
            title: '구성원',
            description: '교수진 및 연구원 소개',
            href: '/members',
            color: 'bg-blue-500',
        },
        {
            icon: BookOpen,
            title: '게시판',
            description: '공지사항 및 연구 소식',
            href: '/board',
            color: 'bg-cyan-500',
        },
        {
            icon: Settings,
            title: '예약',
            description: '실험 장비 및 회의실',
            href: '/reservations',
            color: 'bg-violet-500',
        },
        {
            icon: Calendar,
            title: '캘린더',
            description: '랩미팅 및 학회 일정',
            href: '/calendar',
            color: 'bg-emerald-500',
        },
    ]

    return (
        <main className="min-h-screen">
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <section className="pt-40 pb-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 tag-pill tag-primary text-sm font-medium mb-6 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                                </span>
                                Chemical Process Engineering Lab
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
                                화학공정의 <br />
                                <span className="text-gradient">미래를 설계합니다</span>
                            </h1>
                            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                AI와 데이터 기반의 공정 설계부터 흡착 분리 기술까지.<br className="hidden sm:block" />
                                지속가능한 미래를 위한 스마트 화학 공정을 연구합니다.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/members"
                                    className="btn-primary px-8 py-4 text-white"
                                >
                                    연구실 둘러보기
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="btn-secondary px-8 py-4"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                            <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square">
                                <div className="hero-blob absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 t-rounded-3xl backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-2xl transform rotate-3"></div>
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 t-rounded-3xl backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl -rotate-3 flex items-center justify-center p-8">
                                    <div className="grid grid-cols-2 gap-2 w-full h-full">
                                        <div className="bg-slate-50 dark:bg-slate-800 t-rounded-2xl p-2 flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform cursor-default">
                                            <div className="flex-1 w-full relative">
                                                <Image
                                                    src="/images/research-ccs.png"
                                                    alt="Process Design"
                                                    fill
                                                    className="object-contain scale-110"
                                                />
                                            </div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">Process Design</div>
                                            <div className="text-xs text-slate-500">공정 설계</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 t-rounded-2xl p-2 flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform cursor-default">
                                            <div className="flex-1 w-full relative">
                                                <Image
                                                    src="/images/research-clc.png"
                                                    alt="Hydrogen CLC"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">수소생산</div>
                                            <div className="text-xs text-slate-500">CLC 기반</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 t-rounded-2xl p-2 flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform cursor-default">
                                            <div className="flex-1 w-full relative">
                                                <Image
                                                    src="/images/research-psa.png"
                                                    alt="PSA Separation"
                                                    fill
                                                    className="object-contain scale-125"
                                                />
                                            </div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">분리 공정</div>
                                            <div className="text-xs text-slate-500">PSA/SMB</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 t-rounded-2xl p-2 flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform cursor-default">
                                            <div className="flex-1 w-full relative">
                                                <Image
                                                    src="/images/research-absorption.png"
                                                    alt="Absorption Process"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">흡수 공정</div>
                                            <div className="text-xs text-slate-500">Amine-based</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <Link
                                key={feature.title}
                                href={feature.href}
                                className="group relative p-8 t-rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 t-rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

                                <div className={`w-14 h-14 t-rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`w-7 h-7 ${feature.color.replace('bg-', 'text-')}`} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">
                                    {feature.description}
                                </p>

                                <div className="flex items-center text-sm font-semibold text-slate-900 dark:text-white group-hover:gap-2 transition-all">
                                    바로가기 <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Research Areas */}
            <section className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Research Areas
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            CPE Lab의 주요 연구 분야를 소개합니다
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: '공정설계',
                                eng: 'Process Design',
                                tags: ['수소생산', 'CCS'],
                                desc: '수소 생산 및 탄소 포집(CCS) 기술을 위한 공정 설계 및 최적화를 연구합니다.',
                                icon: Database,
                                color: 'blue'
                            },
                            {
                                title: 'CLC 수소생산',
                                eng: 'Chemical Looping',
                                tags: ['CLC', 'Hydrogen'],
                                desc: '순환 산화환원 연소(CLC) 기반 청정 수소 생산 공정 연구 및 최적화를 수행합니다.',
                                icon: Atom,
                                color: 'emerald'
                            },
                            {
                                title: '흡수 공정',
                                eng: 'Absorption Process',
                                tags: ['CCS', 'Amine-based'],
                                desc: '아민 기반 CO₂ 흡수 공정을 통한 탄소 포집 기술 및 공정 최적화를 수행합니다.',
                                icon: FlaskConical,
                                color: 'cyan'
                            },
                            {
                                title: '분리 공정',
                                eng: 'Separation Process',
                                tags: ['PSA', 'SMB'],
                                desc: 'PSA 및 SMB 기반 분리 공정으로 고순도 가스 분리 및 정제 기술을 개발합니다.',
                                icon: Database,
                                color: 'violet'
                            },
                        ].map((area, i) => (
                            <div key={i} className="group bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all">
                                <div className={`w-12 h-12 rounded-2xl bg-${area.color}-50 dark:bg-${area.color}-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <area.icon className={`w-6 h-6 text-${area.color}-600 dark:text-${area.color}-400`} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                    {area.title}
                                </h3>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                                    {area.eng}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {area.tags.map((tag) => (
                                        <span key={tag} className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                    {area.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                                <FlaskConical className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">
                                    CPE Lab
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Chemical Process Engineering Laboratory
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
                            <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                연구실 소개
                            </Link>
                            <Link href="/publications" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                학술 논문
                            </Link>
                            <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                오시는 길
                            </Link>
                        </div>
                        <p className="text-sm text-slate-400">
                            © 2024 CPE Lab. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    )
}
