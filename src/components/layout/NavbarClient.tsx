'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, FlaskConical, LogOut, User, ChevronDown, Settings, Shield, MessageCircle } from 'lucide-react'
import { Session } from 'next-auth'
import { signOutAction } from '@/actions/user'
import { useTheme } from '@/components/ThemeProvider'

interface NavbarClientProps {
    session: Session | null
    unreadInquiryCount?: number
    pendingCounts?: {
        purchases: number
        tasks: number
        users: number
        inquiries: number
    }
}

// 공개 메뉴 (비로그인 + 소개 모드)
const introNavigation = [
    { name: '연구실 소개', href: '/about' },
    { name: '교수님 소개', href: '/professor' },
    { name: '구성원', href: '/members' },
    { name: '학술 논문', href: '/publications' },
]

// 내부 메뉴 (로그인 + 사용 모드)
const workNavigation = [
    { name: '게시판', href: '/board' },
    { name: '연구자료', href: '/materials' },
    { name: '작업관리', href: '/tasks' },
    { name: '협업공간', href: '/workspaces' },
    { name: '자원관리', href: '/inventory' },
    { name: '예약', href: '/reservations' },
    { name: '캘린더', href: '/calendar' },
]



function getStatusBadge(user: { isAdmin?: boolean, isApproved?: boolean }) {
    if (user.isAdmin) {
        return <span className="text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-md">ADMIN</span>
    }
    if (user.isApproved) {
        return <span className="text-[10px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded-md">MEMBER</span>
    }
    return <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">GUEST</span>
}

export function NavbarClient({ session, unreadInquiryCount = 0, pendingCounts }: NavbarClientProps) {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [adminRequestsOpen, setAdminRequestsOpen] = useState(false)
    const [navMode, setNavMode] = useState<'intro' | 'work'>('intro')
    const user = session?.user
    const { designTheme } = useTheme()
    const isMember = user?.isApproved || user?.isAdmin

    // Load navMode from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('navMode')
            if (saved === 'work' || saved === 'intro') {
                setNavMode(saved)
            }
        }
    }, [])

    const toggleNavMode = () => {
        const newMode = navMode === 'intro' ? 'work' : 'intro'
        setNavMode(newMode)
        if (typeof window !== 'undefined') {
            localStorage.setItem('navMode', newMode)
        }
    }

    // 비로그인/게스트: 소개 메뉴만, 로그인 멤버: 모드에 따라 다름
    const currentNavigation = !isMember ? introNavigation : (navMode === 'intro' ? introNavigation : workNavigation)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                        <Image
                            src={designTheme === 'sharp' ? '/images/logo-sharp.png' : '/images/logo-soft.png'}
                            alt="CPE Lab Logo"
                            width={43}
                            height={43}
                            className="t-rounded-lg"
                        />
                        <span>CPE Lab</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-12">
                        {currentNavigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-base font-semibold transition-colors ${pathname === item.href
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Admin Requests Dropdown */}
                        {user?.isAdmin && (
                            <div className="relative">
                                <button
                                    onClick={() => setAdminRequestsOpen(!adminRequestsOpen)}
                                    onBlur={() => setTimeout(() => setAdminRequestsOpen(false), 150)}
                                    className={`relative text-sm font-medium transition-colors flex items-center gap-1 ${adminRequestsOpen
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                                        }`}
                                >
                                    <span className="relative">
                                        <MessageCircle className="w-4 h-4" />
                                        {pendingCounts && (pendingCounts.purchases + pendingCounts.tasks + pendingCounts.users + pendingCounts.inquiries) > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
                                        )}
                                    </span>
                                    요청
                                    <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${adminRequestsOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {adminRequestsOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-2 z-50">
                                        <Link
                                            href="/inventory/purchase?status=PENDING"
                                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span>📋 구매요청</span>
                                            {pendingCounts && pendingCounts.purchases > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                                    {pendingCounts.purchases}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href="/tasks?status=QUESTION"
                                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span>❓ 질문요청</span>
                                            {pendingCounts && pendingCounts.tasks > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                                    {pendingCounts.tasks}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href="/admin/users"
                                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span>👤 회원가입 승인</span>
                                            {pendingCounts && pendingCounts.users > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                                    {pendingCounts.users}
                                                </span>
                                            )}
                                        </Link>
                                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                        <Link
                                            href="/admin/inquiries"
                                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span>💬 문의관리</span>
                                            {pendingCounts && pendingCounts.inquiries > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                                    {pendingCounts.inquiries}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href="/admin"
                                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span>⚙️ 관리자 설정</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Menu / Login Button */}
                    <div className="hidden md:block">
                        {user ? (
                            <div className="flex items-center gap-2">
                                {/* Mode Toggle Button */}
                                {isMember && (
                                    <button
                                        onClick={toggleNavMode}
                                        className={`px-4 py-2 text-sm font-bold t-rounded-lg transition-all ${navMode === 'work'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        title={navMode === 'intro' ? '연구실 모드로 전환' : '홈페이지 모드로 전환'}
                                    >
                                        {navMode === 'work' ? '🔬 연구실' : '🏠 홈페이지'}
                                    </button>
                                )}
                                {/* User dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-3 pl-4 pr-2 py-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        {user.image ? (
                                            <img src={user.image} alt={user.name || ''} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <User className="w-5 h-5 text-slate-500" />
                                            </div>
                                        )}
                                        <div className="text-sm text-left">
                                            <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
                                            {getStatusBadge(user)}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown menu */}
                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-20 py-2 overflow-hidden">
                                                {/* User info */}
                                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                </div>

                                                {/* Admin link */}
                                                {user.isAdmin && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Shield className="w-4 h-4 text-blue-600" />
                                                        관리자 페이지
                                                    </Link>
                                                )}

                                                {/* Settings (future) */}
                                                <Link
                                                    href="/settings"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    설정
                                                </Link>

                                                {/* Logout */}
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false)
                                                        signOutAction()
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    로그아웃
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                            >
                                로그인
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 -mr-2 text-slate-600 dark:text-slate-300"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <div className="px-6 py-4 space-y-1">
                        {currentNavigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block py-3 text-base font-medium ${pathname === item.href
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Admin link for mobile */}
                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 py-3 text-base font-medium text-blue-600 dark:text-blue-400"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Shield className="w-4 h-4" />
                                관리자 페이지
                            </Link>
                        )}

                        {/* Admin Contact link for mobile */}
                        {user?.isAdmin && (
                            <Link
                                href="/admin#inquiries"
                                className="flex items-center gap-2 py-3 text-base font-medium text-slate-600 dark:text-slate-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <MessageCircle className="w-4 h-4" />
                                문의
                                {unreadInquiryCount > 0 && (
                                    <span className="min-w-[20px] h-[20px] flex items-center justify-center text-[11px] font-bold text-white bg-red-500 rounded-full px-1.5">
                                        {unreadInquiryCount > 99 ? '99+' : unreadInquiryCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Mode Toggle Button for mobile */}
                        {isMember && (
                            <button
                                onClick={() => {
                                    toggleNavMode()
                                    setMobileMenuOpen(false)
                                }}
                                className={`w-full py-3 text-base font-bold text-center rounded-xl transition-all ${navMode === 'work'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {navMode === 'work' ? '🏠 홈페이지 모드로 전환' : '🔬 연구실 모드로 전환'}
                            </button>
                        )}


                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            {user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 py-2">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name || ''} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                            <div className="mt-1">{getStatusBadge(user)}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            signOutAction()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="w-full py-2.5 text-sm font-bold text-red-500 border border-red-200 dark:border-red-800 rounded-xl"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="block w-full text-center py-3 text-base font-bold text-white bg-blue-600 rounded-xl"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    로그인
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
