import { auth } from "@/auth"
import { NavbarClient } from "./NavbarClient"
import { AnnouncementBanner } from "@/components/AnnouncementBanner"
import { getActiveAnnouncements } from "@/actions/announcement"
import { getUnreadInquiryCount } from "@/actions/contact"
import { getAdminPendingCounts } from "@/actions/admin"

export async function Navbar() {
    const session = await auth()
    const announcements = await getActiveAnnouncements()

    // Fetch pending counts for admins
    let pendingCounts = { purchases: 0, tasks: 0, users: 0, inquiries: 0 }
    if (session?.user?.isAdmin) {
        pendingCounts = await getAdminPendingCounts()
    }

    return (
        <>
            <NavbarClient
                session={session}
                unreadInquiryCount={pendingCounts.inquiries}
                pendingCounts={pendingCounts}
            />
            <AnnouncementBanner announcements={announcements} />
        </>
    )
}
