import { Metadata } from 'next'
import Image from 'next/image'
import { Navbar } from '@/components/layout'
import { getProfessorInfo } from '@/actions/professor'
import { Phone, Printer, Mail, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '교수님 소개 | CPE Lab',
    description: '화학공정연구실(CPE Lab) 지도교수 소개',
}

export default async function ProfessorPage() {
    const professor = await getProfessorInfo()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6 bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto">
                    {/* Page Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-center text-slate-900 dark:text-white mb-12">
                        Professor
                    </h1>

                    {/* Profile Card */}
                    <section className="bg-slate-50 dark:bg-slate-900 t-rounded-2xl p-8 mb-12 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Profile Image */}
                            <div className="w-36 h-44 bg-slate-200 dark:bg-slate-800 t-rounded-xl overflow-hidden flex-shrink-0">
                                {professor.profileImage ? (
                                    <Image
                                        src={professor.profileImage}
                                        alt={professor.name}
                                        width={144}
                                        height={176}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-16 h-16 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    {professor.name}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-1">
                                    {professor.department}, {professor.university}
                                </p>
                                {professor.address && (
                                    <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
                                        {professor.address}
                                    </p>
                                )}

                                {/* Contact Row */}
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    {professor.phone && (
                                        <a href={`tel:${professor.phone}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                                            <Phone className="w-4 h-4" />
                                            {professor.phone}
                                        </a>
                                    )}
                                    {professor.fax && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Printer className="w-4 h-4" />
                                            {professor.fax}
                                        </div>
                                    )}
                                    {professor.email && (
                                        <a href={`mailto:${professor.email}`} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                            <Mail className="w-4 h-4" />
                                            {professor.email}
                                        </a>
                                    )}
                                </div>

                                {/* Research Keywords & Description */}
                                {(professor.researchKeywords.length > 0 || professor.researchDescription) && (
                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            Research Interests {professor.researchDescription && '& Overview'}
                                        </h3>

                                        {professor.researchKeywords.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {professor.researchKeywords.map((keyword, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-default"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {professor.researchDescription && (
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                {professor.researchDescription}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Education Section */}
                    {professor.education.length > 0 && (
                        <Section title="Education">
                            <ul className="space-y-4">
                                {professor.education.map((edu, index) => (
                                    <li key={index}>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 leading-relaxed">•</span>
                                            <div>
                                                <p className="text-slate-900 dark:text-white">
                                                    <span className="font-semibold">{edu.degree}</span>
                                                    {edu.year && <span className="text-slate-500"> ({edu.year})</span>}
                                                    , {edu.major}, {edu.school}
                                                </p>
                                                {edu.thesis && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        - Thesis: <span className="italic">{edu.thesis}</span>
                                                    </p>
                                                )}
                                                {edu.advisor && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        - Advisor: {edu.advisor}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Career / Professional Experience Section */}
                    {professor.career.length > 0 && (
                        <Section title={<>Research /<br />Professional Experience</>}>
                            <ul className="space-y-4">
                                {professor.career.map((job, index) => (
                                    <li key={index}>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 leading-relaxed">•</span>
                                            <div>
                                                <p className="text-slate-900 dark:text-white">
                                                    <span className="font-semibold">{job.position}</span>
                                                    {job.period && <span className="text-slate-500"> ({job.period})</span>}
                                                </p>
                                                {job.description && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                        - {job.description}
                                                    </p>
                                                )}
                                                {job.organization && !job.description && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                        - {job.organization}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Academic Activities Section */}
                    {professor.academicActivities.length > 0 && (
                        <Section title="Academic Activities">
                            <ul className="space-y-4">
                                {professor.academicActivities.map((activity, index) => (
                                    <li key={index}>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 leading-relaxed">•</span>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {activity.category}
                                                </p>
                                                {activity.items.length > 0 && (
                                                    <ul className="mt-1 space-y-0.5">
                                                        {activity.items.map((item, idx) => (
                                                            <li key={idx} className="text-sm text-slate-500 dark:text-slate-400">
                                                                - {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Awards and Honors Section */}
                    {professor.awards.length > 0 && (
                        <Section title="Awards and Honors">
                            <ul className="space-y-2">
                                {professor.awards.map((award, index) => (
                                    <li key={index}>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 leading-relaxed">•</span>
                                            <p className="text-slate-900 dark:text-white">
                                                {award.title}
                                                {award.year && <span className="text-slate-500">, {award.year}</span>}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}
                </div>
            </main>
        </>
    )
}

// Reusable Section Component with 2-column layout
function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="mb-10 pb-10 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white md:w-56 flex-shrink-0">
                    {title}
                </h3>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </section>
    )
}
