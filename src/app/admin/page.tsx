import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAllUsers } from "@/actions/user"
import { getAllAnnouncements } from "@/actions/announcement"
import { getProjectsWithMembers } from "@/actions/project"
import { getAllWorkspaces } from "@/actions/workspace"
import { getInquiries } from "@/actions/contact"
import { getPublications } from "@/actions/publication"
import { getSiteSettings } from "@/actions/settings"
import { getProfessorInfo } from "@/actions/professor"
import { getResources } from "@/actions/resource"
import { getAlumniVisibilitySetting } from "@/actions/member"
import { AdminUserList } from "@/components/admin/AdminUserList"
import { AnnouncementManager } from "@/components/admin/AnnouncementManager"
import { ProjectManager } from "@/components/admin/ProjectManager"
import { ResourceManager } from "@/components/admin/ResourceManager"
import { WorkspaceManager } from "@/components/admin/WorkspaceManager"
import { InquiryManager } from "@/components/admin/InquiryManager"
import { PublicationManager } from "@/components/admin/PublicationManager"
import { VideoToggle } from "@/components/admin/VideoToggle"
import { AlumniVisibilityToggle } from "@/components/admin/AlumniVisibilityToggle"
import { ProfessorInfoEditor } from "@/components/admin/ProfessorInfoEditor"
import { CollapsibleSection } from "@/components/admin/CollapsibleSection"
import { StorageCleanupPanel } from "@/components/admin/StorageCleanupPanel"
import { Navbar } from "@/components/layout"
import { UserPlus, Users, UserX, Settings, GraduationCap, Megaphone, FolderKanban, HardDrive, Mail, BookOpen, Server } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect("/")
    }

    const [userResult, announcementResult, projects, workspaces, inquiryResult, publications, settings, professorInfo, resources, alumniVisibleToPublic] = await Promise.all([
        getAllUsers(),
        getAllAnnouncements(),
        getProjectsWithMembers(),
        getAllWorkspaces(),
        getInquiries(),
        getPublications(),
        getSiteSettings(),
        getProfessorInfo(),
        getResources(),
        getAlumniVisibilitySetting()
    ])

    if (userResult.error || !userResult.users) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12">
                            <p className="text-red-500">{userResult.error || "사용자를 불러올 수 없습니다."}</p>
                        </div>
                    </div>
                </main>
            </>
        )
    }

    // Separate members and non-members
    const members = userResult.users.filter((u: { isApproved: boolean }) => u.isApproved)
    const nonMembers = userResult.users.filter((u: { isApproved: boolean }) => !u.isApproved)
    const announcements = ('announcements' in announcementResult ? announcementResult.announcements : []) || []
    const pendingInquiries = (inquiryResult.inquiries || []).filter((i: any) => i.status === 'PENDING').length
    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                관리자 페이지
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                사이트를 관리합니다
                            </p>
                        </div>
                        <Link
                            href="/admin/users/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                        >
                            <UserPlus className="w-5 h-5" />
                            새 구성원 추가
                        </Link>
                    </div>

                    {/* Announcements Section */}
                    <CollapsibleSection
                        title="공지사항"
                        icon={<Megaphone className="w-5 h-5" />}
                        iconColor="text-amber-600"
                        borderColor="border-amber-500"
                        count={announcements.length}
                        countColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        defaultOpen={false}
                    >
                        <AnnouncementManager
                            announcements={announcements}
                            members={members.map((m: any) => ({
                                id: m.id,
                                name: m.name,
                                image: m.image
                            }))}
                        />
                    </CollapsibleSection>

                    {/* Projects Section */}
                    <CollapsibleSection
                        title="과제 관리"
                        icon={<FolderKanban className="w-5 h-5" />}
                        iconColor="text-blue-600"
                        borderColor="border-blue-500"
                        count={(projects as any[]).length}
                        countColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        defaultOpen={false}
                    >
                        <ProjectManager projects={projects as any} allMembers={members.map((m: any) => ({ id: m.id, name: m.name, image: m.image }))} />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="장비/공간 관리"
                        icon={<Server className="w-5 h-5" />}
                        iconColor="text-violet-600"
                        borderColor="border-violet-500"
                        count={(resources as any[]).length}
                        countColor="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                        defaultOpen={false}
                    >
                        <ResourceManager resources={resources as any[]} />
                    </CollapsibleSection>

                    {/* Workspaces Section */}
                    <CollapsibleSection
                        title="협업공간"
                        icon={<HardDrive className="w-5 h-5" />}
                        iconColor="text-indigo-600"
                        borderColor="border-indigo-500"
                        count={(workspaces as any[]).length}
                        countColor="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        defaultOpen={false}
                    >
                        <WorkspaceManager workspaces={workspaces as any} />
                    </CollapsibleSection>

                    {/* Contact Inquiries Section */}
                    <CollapsibleSection
                        title="문의 관리"
                        icon={<Mail className="w-5 h-5" />}
                        iconColor="text-rose-600"
                        borderColor="border-rose-500"
                        count={pendingInquiries}
                        countColor="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                        defaultOpen={pendingInquiries > 0}
                    >
                        <InquiryManager inquiries={inquiryResult.inquiries || []} />
                    </CollapsibleSection>

                    {/* Publications Section */}
                    <CollapsibleSection
                        title="학술 논문"
                        icon={<BookOpen className="w-5 h-5" />}
                        iconColor="text-teal-600"
                        borderColor="border-teal-500"
                        count={publications.length}
                        countColor="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                        defaultOpen={false}
                    >
                        <PublicationManager publications={publications} />
                    </CollapsibleSection>

                    {/* Professor Info Section */}
                    <CollapsibleSection
                        title="교수 정보"
                        icon={<GraduationCap className="w-5 h-5" />}
                        iconColor="text-cyan-600"
                        borderColor="border-cyan-500"
                        defaultOpen={false}
                    >
                        <ProfessorInfoEditor initialData={professorInfo} />
                    </CollapsibleSection>


                    {/* Site Settings Section */}
                    <CollapsibleSection
                        title="사이트 설정"
                        icon={<Settings className="w-5 h-5" />}
                        iconColor="text-purple-600"
                        borderColor="border-purple-500"
                        defaultOpen={false}
                    >
                        <div className="space-y-6">
                            <VideoToggle initialEnabled={settings.videoEnabled} />
                            <AlumniVisibilityToggle initialVisible={alumniVisibleToPublic} />
                            <StorageCleanupPanel />
                        </div>
                    </CollapsibleSection>

                    {/* Members Section */}
                    <CollapsibleSection
                        title="멤버"
                        icon={<Users className="w-5 h-5" />}
                        iconColor="text-green-600"
                        borderColor="border-green-500"
                        count={members.length}
                        countColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        defaultOpen={false}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-green-100 dark:border-green-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                            {members.length > 0 ? (
                                <AdminUserList users={members} currentUserId={session.user.id} />
                            ) : (
                                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                                    승인된 멤버가 없습니다
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* Non-Members Section */}
                    <CollapsibleSection
                        title="승인 대기"
                        icon={<UserX className="w-5 h-5" />}
                        iconColor="text-slate-500"
                        borderColor="border-slate-400"
                        count={nonMembers.length}
                        countColor="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        defaultOpen={nonMembers.length > 0}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
                            {nonMembers.length > 0 ? (
                                <AdminUserList users={nonMembers} currentUserId={session.user.id} />
                            ) : (
                                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                                    승인 대기 중인 사용자가 없습니다
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                </div>
            </main>
        </>
    )
}
